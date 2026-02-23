"""
CSV Parser for AWS billing data
Handles AWS Cost and Usage Report (CUR) format and normalizes data
"""
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BillingCSVParser:
    """Parse and normalize AWS billing CSV files"""
    
    # Expected column mappings (handles variations in AWS CUR formats)
    COLUMN_MAPPINGS = {
        'lineItem/UsageStartDate': 'usage_start_date',
        'lineItem/ProductCode': 'service_name',
        'lineItem/BlendedCost': 'cost',
        'lineItem/UsageAmount': 'usage_quantity',
        'lineItem/UsageType': 'usage_type',
        'product/region': 'region',
        'resourceTags/user:Team': 'tag_team',
        'resourceTags/user:Project': 'tag_project',
        'resourceTags/user:Environment': 'tag_environment',
        'lineItem/ResourceId': 'resource_id',
    }
    
    # Simplified column names (for synthetic data)
    SIMPLE_MAPPINGS = {
        'date': 'usage_start_date',
        'service': 'service_name',
        'cost': 'cost',
        'usage': 'usage_quantity',
        'unit': 'usage_unit',
        'region': 'region',
        'team': 'tag_team',
        'project': 'tag_project',
        'environment': 'tag_environment',
        'resource_id': 'resource_id',
    }
    
    def __init__(self):
        self.errors = []
    
    def parse(self, csv_path: str, organization_id: str) -> pd.DataFrame:
        """
        Parse billing CSV and return normalized DataFrame
        
        Args:
            csv_path: Path to CSV file
            organization_id: Organization UUID
            
        Returns:
            DataFrame with normalized columns
        """
        logger.info(f"Parsing CSV: {csv_path}")
        
        try:
            # Read CSV - handle various encodings
            try:
                df = pd.read_csv(csv_path)
            except UnicodeDecodeError:
                df = pd.read_csv(csv_path, encoding='latin-1')
            
            logger.info(f"Loaded {len(df)} rows, {len(df.columns)} columns")
            
            # Detect format and apply appropriate mapping
            df_normalized = self._normalize_columns(df)
            
            # Add organization_id
            df_normalized['organization_id'] = organization_id
            
            # Data cleaning and validation
            df_normalized = self._clean_data(df_normalized)
            
            # Extract usage date
            df_normalized = self._parse_dates(df_normalized)
            
            logger.info(f"Parsed {len(df_normalized)} valid rows")
            
            return df_normalized
            
        except Exception as e:
            logger.error(f"Error parsing CSV: {e}")
            raise
    
    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize column names based on detected format"""
        
        # Try AWS CUR format first
        mapping = {}
        for cur_col, norm_col in self.COLUMN_MAPPINGS.items():
            if cur_col in df.columns:
                mapping[cur_col] = norm_col
        
        # If no CUR columns found, try simple format
        if not mapping:
            for simple_col, norm_col in self.SIMPLE_MAPPINGS.items():
                if simple_col in df.columns:
                    mapping[simple_col] = norm_col
        
        if not mapping:
            # Log available columns for debugging
            logger.warning(f"Available columns: {df.columns.tolist()}")
            raise ValueError("Unrecognized CSV format - no known columns found")
        
        # Rename columns
        df_renamed = df.rename(columns=mapping)
        
        # Ensure required columns exist
        required = ['usage_start_date', 'service_name', 'cost']
        missing = [col for col in required if col not in df_renamed.columns]
        if missing:
            raise ValueError(f"Missing required columns: {missing}")
        
        # Select only normalized columns that exist (don't include organization_id yet)
        available_cols = [col for col in mapping.values() if col in df_renamed.columns]
        
        return df_renamed[available_cols] if available_cols else df_renamed
    
    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate data"""
        
        # Remove rows with zero or negative cost
        df = df[df['cost'] > 0].copy()
        
        # Fill missing service names
        df['service_name'].fillna('Unknown', inplace=True)
        
        # Strip whitespace from string columns
        string_cols = df.select_dtypes(include=['object']).columns
        for col in string_cols:
            if col in df.columns:
                df[col] = df[col].str.strip() if df[col].dtype == 'object' else df[col]
        
        # Ensure cost is numeric
        df['cost'] = pd.to_numeric(df['cost'], errors='coerce')
        df = df.dropna(subset=['cost'])
        
        # Handle usage quantity
        if 'usage_quantity' in df.columns:
            df['usage_quantity'] = pd.to_numeric(df['usage_quantity'], errors='coerce')
        else:
            df['usage_quantity'] = None
        
        # Add usage_unit if missing
        if 'usage_unit' not in df.columns:
            df['usage_unit'] = 'N/A'
        
        return df
    
    def _parse_dates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Parse and validate date columns"""
        
        # Parse usage_start_date
        df['usage_date'] = pd.to_datetime(df['usage_start_date'], errors='coerce').dt.date
        
        # Remove rows with invalid dates
        df = df.dropna(subset=['usage_date'])
        
        return df
    
    def validate_row(self, row: Dict) -> bool:
        """Validate a single row"""
        
        # Must have positive cost
        if not row.get('cost') or row['cost'] <= 0:
            self.errors.append(f"Invalid cost: {row.get('cost')}")
            return False
        
        # Must have service name
        if not row.get('service_name'):
            self.errors.append("Missing service_name")
            return False
        
        # Must have valid date
        if not row.get('usage_date'):
            self.errors.append("Missing usage_date")
            return False
        
        return True
    
    def get_errors(self) -> List[str]:
        """Get list of parsing errors"""
        return self.errors
