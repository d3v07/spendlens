"""
Main batch aggregator - orchestrates CSV parsing, aggregation, and recommendation generation
"""
import os
import sys
from dotenv import load_dotenv
import argparse
import logging

from database import Database
from csv_parser import BillingCSVParser
from aggregator import CostAggregator
from recommendation_engine import RecommendationEngine

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def process_billing_csv(csv_path: str, organization_id: str):
    """
    Main processing pipeline:
    1. Parse CSV
    2. Insert billing items
    3. Compute aggregations
    4. Generate recommendations
    """
    logger.info(f"Starting batch processing for organization: {organization_id}")
    logger.info(f"CSV file: {csv_path}")
    
    # Initialize components
    db = Database()
    parser = BillingCSVParser()
    aggregator = CostAggregator(db)
    rec_engine = RecommendationEngine(db)
    
    try:
        # Step 1: Parse CSV
        logger.info("Step 1: Parsing CSV...")
        df = parser.parse(csv_path, organization_id)
        logger.info(f"Parsed {len(df)} billing items")
        
        # Step 2: Insert billing items into database
        logger.info("Step 2: Inserting billing items...")
        insert_billing_items(db, df)
        
        # Step 3: Compute and store aggregations
        logger.info("Step 3: Computing aggregations...")
        aggregator.aggregate_from_dataframe(df, organization_id)
        
        # Step 4: Generate recommendations
        logger.info("Step 4: Generating recommendations...")
        recommendations = rec_engine.generate_recommendations(df, organization_id)
        
        logger.info("✅ Batch processing completed successfully!")
        logger.info(f"  - Processed {len(df)} billing items")
        logger.info(f"  - Generated {len(recommendations)} recommendations")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Batch processing failed: {e}")
        raise


def insert_billing_items(db: Database, df):
    """Insert billing items into database"""
    
    query = """
        INSERT INTO public.billing_items 
            (organization_id, service_name, cost, usage_quantity, usage_unit, 
             usage_date, region, tag_team, tag_project, tag_environment, resource_id)
        VALUES 
            (%(organization_id)s, %(service_name)s, %(cost)s, %(usage_quantity)s, %(usage_unit)s,
             %(usage_date)s, %(region)s, %(tag_team)s, %(tag_project)s, %(tag_environment)s, %(resource_id)s)
    """
    
    # Convert DataFrame to list of dicts
    records = df.to_dict('records')
    
    # Batch insert
    batch_size = 1000
    total_inserted = 0
    
    with db.get_connection() as conn:
        with conn.cursor() as cursor:
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                for record in batch:
                    # Ensure all fields are present
                    record.setdefault('usage_quantity', None)
                    record.setdefault('usage_unit', 'N/A')
                    record.setdefault('region', None)
                    record.setdefault('tag_team', None)
                    record.setdefault('tag_project', None)
                    record.setdefault('tag_environment', None)
                    record.setdefault('resource_id', None)
                    
                    cursor.execute(query, record)
                
                total_inserted += len(batch)
                logger.info(f"Inserted {total_inserted}/{len(records)} billing items...")
    
    logger.info(f"Successfully inserted {total_inserted} billing items")


def main():
    """Main entry point"""
    
    # Load environment variables
    load_dotenv()
    
    # Parse arguments
    parser = argparse.ArgumentParser(description='Process AWS billing CSV and generate cost insights')
    parser.add_argument('csv_file', help='Path to billing CSV file')
    parser.add_argument('--org-id', required=True, help='Organization UUID')
    
    args = parser.parse_args()
    
    # Validate inputs
    if not os.path.exists(args.csv_file):
        logger.error(f"CSV file not found: {args.csv_file}")
        sys.exit(1)
    
    if not os.getenv('DATABASE_URL'):
        logger.error("DATABASE_URL environment variable not set")
        sys.exit(1)
    
    # Process CSV
    try:
        process_billing_csv(args.csv_file, args.org_id)
        sys.exit(0)
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
