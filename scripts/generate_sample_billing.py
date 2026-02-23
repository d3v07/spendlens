#!/usr/bin/env python3
"""
Generate synthetic AWS billing CSV for testing
"""
import pandas as pd
import random
from datetime import datetime, timedelta
import argparse


class SyntheticBillingGenerator:
    """Generate realistic AWS billing data"""
    
    SERVICES = [
        'EC2', 'Lambda', 'S3', 'RDS', 'DynamoDB', 'CloudWatch',
        'CloudFront', 'EBS', 'EKS', 'ElastiCache', 'Route53', 
        'SNS', 'SQS', 'API Gateway', 'Secrets Manager'
    ]
    
    REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']
    TEAMS = ['backend', 'frontend', 'data', 'infra', 'ml']
    PROJECTS = ['web-app', 'mobile-api', 'analytics', 'platform', 'ml-pipeline']
    ENVIRONMENTS = ['production', 'staging', 'development']
    
    # Cost ranges per service (daily, in USD)
    SERVICE_COST_RANGES = {
        'EC2': (50, 500),
        'Lambda': (10, 100),
        'S3': (20, 200),
        'RDS': (100, 800),
        'DynamoDB': (30, 300),
        'CloudWatch': (5, 50),
        'CloudFront': (20, 150),
        'EBS': (30, 200),
        'EKS': (200, 600),
        'ElastiCache': (50, 300),
        'Route53': (5, 30),
        'SNS': (2, 20),
        'SQS': (3, 25),
        'API Gateway': (10, 80),
        'Secrets Manager': (5, 40)
    }
    
    def generate(self, days: int = 30, output_file: str = 'billing.csv'):
        """Generate billing CSV"""
        
        print(f"Generating {days} days of billing data...")
        
        records = []
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days-1)
        
        # Generate daily records
        for day_offset in range(days):
            current_date = start_date + timedelta(days=day_offset)
            
            # Generate records for each service
            for service in self.SERVICES:
                cost_range = self.SERVICE_COST_RANGES.get(service, (10, 100))
                
                # Each service has 3-5 resource entries per day
                num_resources = random.randint(3, 5)
                
                for _ in range(num_resources):
                    cost = random.uniform(*cost_range) / num_resources
                    usage = random.uniform(1, 100)
                    
                    record = {
                        'date': current_date.isoformat(),
                        'service': service,
                        'cost': round(cost, 4),
                        'usage': round(usage, 2),
                        'unit': self._get_usage_unit(service),
                        'region': random.choice(self.REGIONS),
                        'team': random.choice(self.TEAMS),
                        'project': random.choice(self.PROJECTS),
                        'environment': random.choice(self.ENVIRONMENTS),
                        'resource_id': self._generate_resource_id(service)
                    }
                    records.append(record)
        
        # Create DataFrame and save
        df = pd.DataFrame(records)
        df.to_csv(output_file, index=False)
        
        print(f"✅ Generated {len(df)} billing records")
        print(f"📁 Saved to: {output_file}")
        print(f"📊 Total cost: ${df['cost'].sum():,.2f}")
        print(f"📅 Date range: {start_date} to {end_date}")
        
        return output_file
    
    def _get_usage_unit(self, service: str) -> str:
        """Get usage unit for service"""
        units = {
            'EC2': 'Hours',
            'Lambda': 'Requests',
            'S3': 'GB-Month',
            'RDS': 'Hours',
            'DynamoDB': 'WCU-Hours',
            'CloudWatch': 'Metrics',
            'CloudFront': 'GB',
            'EBS': 'GB-Month',
            'EKS': 'Hours',
            'ElastiCache': 'Hours',
            'Route53': 'Queries',
            'SNS': 'Requests',
            'SQS': 'Requests',
            'API Gateway': 'Requests',
            'Secrets Manager': 'Secrets'
        }
        return units.get(service, 'Units')
    
    def _generate_resource_id(self, service: str) -> str:
        """Generate realistic resource ID"""
        prefixes = {
            'EC2': 'i-',
            'RDS': 'db-',
            'Lambda': 'func-',
            'EKS': 'cluster-',
            'ElastiCache': 'cache-'
        }
        
        prefix = prefixes.get(service, 'res-')
        return f"{prefix}{random.randint(100000, 999999)}"


def main():
    parser = argparse.ArgumentParser(description='Generate synthetic AWS billing CSV')
    parser.add_argument('--days', type=int, default=30, help='Number of days to generate (default: 30)')
    parser.add_argument('--output', default='sample_billing.csv', help='Output CSV file path')
    
    args = parser.parse_args()
    
    generator = SyntheticBillingGenerator()
    generator.generate(days=args.days, output_file=args.output)


if __name__ == '__main__':
    main()
