#!/bin/bash
# Load sample data into SpendLens database
# This script generates synthetic billing data and processes it

set -e

echo "🚀 SpendLens Sample Data Loader"
echo "================================"

# Check if organization ID is provided
if [ -z "$1" ]; then
    echo "❌ Error: Organization ID required"
    echo "Usage: ./load_sample_data.sh <organization-id>"
    exit 1
fi

ORG_ID=$1
CSV_FILE="sample_billing.csv"

echo "📊 Organization ID: $ORG_ID"
echo ""

# Step 1: Generate synthetic billing data
echo "Step 1: Generating synthetic billing data..."
python3 scripts/generate_sample_billing.py --days 30 --output $CSV_FILE

if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Failed to generate billing CSV"
    exit 1
fi

echo ""

# Step 2: Process the CSV
echo "Step 2: Processing billing data..."
cd worker
python3 batch_aggregator.py ../$CSV_FILE --org-id $ORG_ID

echo ""
echo "✅ Sample data loaded successfully!"
echo "🎉 You can now view the data in your SpendLens dashboard"
