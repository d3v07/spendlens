"""
Unit tests for CSV parser
"""
import unittest
import pandas as pd
from io import StringIO
from csv_parser import BillingCSVParser


class TestBillingCSVParser(unittest.TestCase):
    
    def setUp(self):
        self.parser = BillingCSVParser()
        self.org_id = 'test-org-123'
    
    def test_simple_format_parsing(self):
        """Test parsing of simplified CSV format"""
        csv_data = """date,service,cost,usage,unit,region,team,project,environment,resource_id
2024-01-15,EC2,125.50,100.0,Hours,us-east-1,backend,web-app,production,i-123456
2024-01-15,S3,45.20,500.0,GB-Month,us-west-2,data,analytics,production,
2024-01-15,RDS,320.00,24.0,Hours,us-east-1,backend,web-app,production,db-789012
"""
        
        # Write to temp file
        with open('/tmp/test_billing.csv', 'w') as f:
            f.write(csv_data)
        
        df = self.parser.parse('/tmp/test_billing.csv', self.org_id)
        
        # Assertions
        self.assertEqual(len(df), 3)
        self.assertIn('service_name', df.columns)
        self.assertIn('cost', df.columns)
        self.assertIn('usage_date', df.columns)
        self.assertEqual(df['organization_id'].iloc[0], self.org_id)
    
    def test_zero_cost_filtering(self):
        """Test that zero-cost items are filtered out"""
        csv_data = """date,service,cost,usage,unit,region
2024-01-15,EC2,0.00,100.0,Hours,us-east-1
2024-01-15,S3,45.20,500.0,GB-Month,us-west-2
2024-01-15,Lambda,-5.00,1000.0,Requests,us-east-1
"""
        
        with open('/tmp/test_zero_cost.csv', 'w') as f:
            f.write(csv_data)
        
        df = self.parser.parse('/tmp/test_zero_cost.csv', self.org_id)
        
        # Should only have the S3 row (positive cost)
        self.assertEqual(len(df), 1)
        self.assertEqual(df['service_name'].iloc[0], 'S3')
    
    def test_missing_optional_columns(self):
        """Test handling of missing optional columns"""
        csv_data = """date,service,cost
2024-01-15,EC2,125.50
2024-01-15,S3,45.20
"""
        
        with open('/tmp/test_minimal.csv', 'w') as f:
            f.write(csv_data)
        
        df = self.parser.parse('/tmp/test_minimal.csv', self.org_id)
        
        # Should parse successfully
        self.assertEqual(len(df), 2)
        self.assertIn('service_name', df.columns)
        self.assertIn('cost', df.columns)
    
    def test_invalid_dates(self):
        """Test handling of invalid dates"""
        csv_data = """date,service,cost
invalid-date,EC2,125.50
2024-01-15,S3,45.20
"""
        
        with open('/tmp/test_invalid_dates.csv', 'w') as f:
            f.write(csv_data)
        
        df = self.parser.parse('/tmp/test_invalid_dates.csv', self.org_id)
        
        # Should only have the valid row
        self.assertEqual(len(df), 1)
        self.assertEqual(df['service_name'].iloc[0], 'S3')


if __name__ == '__main__':
    unittest.main()
