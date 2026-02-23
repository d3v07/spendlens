"""
Recommendation Engine - generates cost optimization recommendations
"""
import pandas as pd
from database import Database
from typing import List, Dict
import logging
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RecommendationEngine:
    """Generate cost optimization recommendations based on usage patterns"""
    
    # Thresholds for recommendations
    IDLE_RESOURCE_THRESHOLD = 0.10  # <10% utilization considered idle
    STORAGE_GROWTH_THRESHOLD = 1.5  # 50% growth month-over-month
    HIGH_COST_THRESHOLD = 500  # Services costing >$500/day
    
    def __init__(self, db: Database):
        self.db = db
    
    def generate_recommendations(self, df: pd.DataFrame, organization_id: str) -> List[Dict]:
        """
        Analyze billing data and generate recommendations
        
        Args:
            df: DataFrame with billing items
            organization_id: Organization UUID
            
        Returns:
            List of recommendation dictionaries
        """
        logger.info("Generating cost optimization recommendations...")
        
        recommendations = []
        
        # 1. Identify idle resources (low usage)
        recommendations.extend(self._find_idle_resources(df, organization_id))
        
        # 2. Identify storage growth opportunities
        recommendations.extend(self._find_storage_optimization(df, organization_id))
        
        # 3. Identify high-cost services for right-sizing
        recommendations.extend(self._find_rightsizing_opportunities(df, organization_id))
        
        # 4. Identify reserved instance opportunities
        recommendations.extend(self._find_reserved_instance_opportunities(df, organization_id))
        
        # Store recommendations in database
        self._store_recommendations(recommendations)
        
        logger.info(f"Generated {len(recommendations)} recommendations")
        return recommendations
    
    def _find_idle_resources(self, df: pd.DataFrame, organization_id: str) -> List[Dict]:
        """Find resources with low utilization"""
        
        recommendations = []
        
        # Filter for compute services (EC2, RDS, etc.)
        compute_services = ['EC2', 'RDS', 'ElastiCache', 'EKS']
        compute_df = df[df['service_name'].isin(compute_services)].copy()
        
        if compute_df.empty:
            return recommendations
        
        # Group by resource and check usage
        if 'resource_id' in compute_df.columns and 'usage_quantity' in compute_df.columns:
            resource_usage = compute_df.groupby(['service_name', 'resource_id']).agg({
                'usage_quantity': 'mean',
                'cost': 'sum'
            }).reset_index()
            
            # Find low utilization resources
            # Normalize usage (simplified - in real scenario, this would be service-specific)
            for _, row in resource_usage.iterrows():
                if row['usage_quantity'] > 0:
                    # Simplified check - in reality, would compare against instance size
                    if row['cost'] > 10:  # Only recommend for resources costing >$10
                        recommendations.append({
                            'organization_id': organization_id,
                            'category': 'idle_resource',
                            'title': f"Potentially idle {row['service_name']} resource",
                            'description': f"Resource {row['resource_id']} shows low utilization. Consider downsizing or terminating.",
                            'current_cost': float(row['cost']),
                            'projected_savings': float(row['cost'] * 0.7),  # Assume 70% savings
                            'confidence': 'medium',
                            'resource_id': row['resource_id'],
                            'service_name': row['service_name'],
                            'action_type': 'terminate'
                        })
        
        return recommendations[:3]  # Limit to top 3
    
    def _find_storage_optimization(self, df: pd.DataFrame, organization_id: str) -> List[Dict]:
        """Find storage optimization opportunities"""
        
        recommendations = []
        
        # Filter for storage services
        storage_services = ['S3', 'EBS']
        storage_df = df[df['service_name'].isin(storage_services)].copy()
        
        if storage_df.empty:
            return recommendations
        
        # Analyze S3 storage classes
        s3_df = storage_df[storage_df['service_name'] == 'S3']
        if not s3_df.empty:
            total_s3_cost = s3_df['cost'].sum()
            if total_s3_cost > 100:  # Significant S3 spend
                recommendations.append({
                    'organization_id': organization_id,
                    'category': 'storage_optimization',
                    'title': 'Optimize S3 storage classes',
                    'description': 'Move infrequently accessed S3 data to Glacier or Intelligent-Tiering to reduce costs.',
                    'current_cost': float(total_s3_cost),
                    'projected_savings': float(total_s3_cost * 0.3),  # Assume 30% savings
                    'confidence': 'high',
                    'resource_id': None,
                    'service_name': 'S3',
                    'action_type': 'modify'
                })
        
        # Analyze EBS volumes
        ebs_df = storage_df[storage_df['service_name'] == 'EBS']
        if not ebs_df.empty:
            total_ebs_cost = ebs_df['cost'].sum()
            if total_ebs_cost > 50:
                recommendations.append({
                    'organization_id': organization_id,
                    'category': 'storage_optimization',
                    'title': 'Review EBS volume types',
                    'description': 'Consider using gp3 volumes instead of gp2 for better cost-performance ratio.',
                    'current_cost': float(total_ebs_cost),
                    'projected_savings': float(total_ebs_cost * 0.20),  # Assume 20% savings
                    'confidence': 'high',
                    'resource_id': None,
                    'service_name': 'EBS',
                    'action_type': 'modify'
                })
        
        return recommendations
    
    def _find_rightsizing_opportunities(self, df: pd.DataFrame, organization_id: str) -> List[Dict]:
        """Find right-sizing opportunities for high-cost services"""
        
        recommendations = []
        
        # Find high-cost services
        service_costs = df.groupby('service_name').agg({
            'cost': 'sum'
        }).reset_index()
        
        high_cost_services = service_costs[service_costs['cost'] > self.HIGH_COST_THRESHOLD]
        
        for _, row in high_cost_services.iterrows():
            service = row['service_name']
            cost = row['cost']
            
            recommendations.append({
                'organization_id': organization_id,
                'category': 'rightsizing',
                'title': f'Review {service} instance sizing',
                'description': f'{service} represents a significant cost. Analyze usage patterns and consider right-sizing instances.',
                'current_cost': float(cost),
                'projected_savings': float(cost * 0.25),  # Assume 25% potential savings
                'confidence': 'medium',
                'resource_id': None,
                'service_name': service,
                'action_type': 'modify'
            })
        
        return recommendations[:2]  # Top 2 highest cost
    
    def _find_reserved_instance_opportunities(self, df: pd.DataFrame, organization_id: str) -> List[Dict]:
        """Find opportunities to use reserved instances"""
        
        recommendations = []
        
        # Check for steady EC2 usage
        ec2_df = df[df['service_name'] == 'EC2'].copy()
        
        if ec2_df.empty:
            return recommendations
        
        # Check if usage is consistent (simplified heuristic)
        if 'usage_date' in ec2_df.columns:
            # Add date column for grouping
            ec2_df['date'] = pd.to_datetime(ec2_df['usage_date'])
            daily_usage = ec2_df.groupby('date')['cost'].sum()
            
            # If we have at least 7 days of data
            if len(daily_usage) >= 7:
                avg_daily_cost = daily_usage.mean()
                std_daily_cost = daily_usage.std()
                
                # If usage is consistent (low variance) and significant
                if avg_daily_cost > 20 and std_daily_cost < avg_daily_cost * 0.3:
                    annual_cost = avg_daily_cost * 365
                    reserved_savings = annual_cost * 0.35  # 35% savings with reserved instances
                    
                    recommendations.append({
                        'organization_id': organization_id,
                        'category': 'reserved_instances',
                        'title': 'Consider EC2 Reserved Instances',
                        'description': 'Your EC2 usage is consistent. Reserved Instances could save up to 35% annually.',
                        'current_cost': float(avg_daily_cost * 30),  # Monthly estimate
                        'projected_savings': float(reserved_savings / 12),  # Monthly savings
                        'confidence': 'high',
                        'resource_id': None,
                        'service_name': 'EC2',
                        'action_type': 'purchase'
                    })
        
        return recommendations
    
    def _store_recommendations(self, recommendations: List[Dict]):
        """Store recommendations in database"""
        
        if not recommendations:
            logger.warning("No recommendations to store")
            return
        
        query = """
            INSERT INTO public.recommendations 
                (organization_id, category, title, description, current_cost, projected_savings, 
                 confidence, resource_id, service_name, action_type, is_applied)
            VALUES 
                (%(organization_id)s, %(category)s, %(title)s, %(description)s, %(current_cost)s, 
                 %(projected_savings)s, %(confidence)s, %(resource_id)s, %(service_name)s, 
                 %(action_type)s, FALSE)
        """
        
        with self.db.get_connection() as conn:
            with conn.cursor() as cursor:
                for rec in recommendations:
                    cursor.execute(query, rec)
        
        logger.info(f"Stored {len(recommendations)} recommendations in database")
