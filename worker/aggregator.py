"""
Cost Aggregator - computes daily/monthly aggregates from billing items
"""
import pandas as pd
from database import Database
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CostAggregator:
    """Aggregate billing items into daily and monthly summaries"""
    
    def __init__(self, db: Database):
        self.db = db
    
    def aggregate_from_dataframe(self, df: pd.DataFrame, organization_id: str):
        """
        Compute aggregations from DataFrame and store in database
        
        Args:
            df: DataFrame with billing items
            organization_id: Organization UUID
        """
        logger.info("Computing cost aggregations...")
        
        # Compute daily aggregations
        daily_aggs = self._compute_daily_aggregations(df, organization_id)
        self._upsert_aggregations(daily_aggs, 'daily')
        
        # Compute monthly aggregations
        monthly_aggs = self._compute_monthly_aggregations(df, organization_id)
        self._upsert_aggregations(monthly_aggs, 'monthly')
        
        logger.info(f"Stored {len(daily_aggs)} daily and {len(monthly_aggs)} monthly aggregations")
    
    def _compute_daily_aggregations(self, df: pd.DataFrame, organization_id: str) -> List[Dict]:
        """Compute daily cost aggregations grouped by service, team, environment"""
        
        # Group by date, service, tags
        group_cols = ['usage_date', 'service_name']
        optional_cols = ['tag_team', 'tag_environment']
        
        # Add optional columns that exist
        for col in optional_cols:
            if col in df.columns:
                group_cols.append(col)
        
        # Aggregate
        grouped = df.groupby(group_cols, dropna=False).agg({
            'cost': 'sum'
        }).reset_index()
        
        # Convert to list of dicts
        aggregations = []
        for _, row in grouped.iterrows():
            agg = {
                'organization_id': organization_id,
                'period_type': 'daily',
                'period_start': row['usage_date'],
                'service_name': row['service_name'],
                'tag_team': row.get('tag_team'),
                'tag_environment': row.get('tag_environment'),
                'total_cost': float(row['cost'])
            }
            aggregations.append(agg)
        
        return aggregations
    
    def _compute_monthly_aggregations(self, df: pd.DataFrame, organization_id: str) -> List[Dict]:
        """Compute monthly cost aggregations"""
        
        # Add month column
        df['month'] = pd.to_datetime(df['usage_date']).dt.to_period('M')
        df['month_start'] = df['month'].dt.to_timestamp().dt.date
        
        # Group by month, service, tags
        group_cols = ['month_start', 'service_name']
        optional_cols = ['tag_team', 'tag_environment']
        
        for col in optional_cols:
            if col in df.columns:
                group_cols.append(col)
        
        # Aggregate
        grouped = df.groupby(group_cols, dropna=False).agg({
            'cost': 'sum'
        }).reset_index()
        
        # Convert to list of dicts
        aggregations = []
        for _, row in grouped.iterrows():
            agg = {
                'organization_id': organization_id,
                'period_type': 'monthly',
                'period_start': row['month_start'],
                'service_name': row['service_name'],
                'tag_team': row.get('tag_team'),
                'tag_environment': row.get('tag_environment'),
                'total_cost': float(row['cost'])
            }
            aggregations.append(agg)
        
        return aggregations
    
    def _upsert_aggregations(self, aggregations: List[Dict], period_type: str):
        """Upsert aggregations into database (insert or update on conflict)"""
        
        if not aggregations:
            logger.warning(f"No {period_type} aggregations to insert")
            return
        
        # Build upsert query
        query = """
            INSERT INTO public.cost_aggregations 
                (organization_id, period_type, period_start, service_name, tag_team, tag_environment, total_cost)
            VALUES 
                (%(organization_id)s, %(period_type)s, %(period_start)s, %(service_name)s, %(tag_team)s, %(tag_environment)s, %(total_cost)s)
            ON CONFLICT (organization_id, period_type, period_start, service_name, tag_team, tag_environment)
            DO UPDATE SET
                total_cost = EXCLUDED.total_cost,
                created_at = now()
        """
        
        # Execute batch insert
        with self.db.get_connection() as conn:
            with conn.cursor() as cursor:
                for agg in aggregations:
                    cursor.execute(query, agg)
        
        logger.info(f"Upserted {len(aggregations)} {period_type} aggregations")
