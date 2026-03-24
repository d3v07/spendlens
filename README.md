# SpendLens

AWS cost aggregation and recommendation engine for multi-team organizations.

Ingests AWS billing CSVs (monthly or on-demand), aggregates costs by service/team/environment, and generates 4 types of cost optimization recommendations: idle resource detection, storage class optimization, instance right-sizing, and reserved instance candidates.

## Evidence

**CSV Ingestion & Parsing** — Python batch worker parses both CUR (Cost and Usage Report) and simplified billing CSV formats. Supports AWS standard columns (date, service, region) plus custom tags (team, project, environment, resource_id).

(`worker/csv_parser.py`)

**Cost Aggregation** — Daily and monthly cost rollups grouped by:
- Service (EC2, S3, RDS, Lambda, etc.)
- Team (via tag)
- Environment (production, staging, dev, via tag)
- Region (optional)

Computed aggregations stored in Supabase PostgreSQL.

(`worker/aggregator.py`)

**Recommendation Engine** — Analyzes aggregated spend and generates 4 recommendation types:
1. **Idle Resources** — Services with zero usage hours over lookback window
2. **Storage Optimization** — S3 storage classes + EBS volume consolidation
3. **Right-Sizing** — High-cost services with low utilization (compute instances, RDS)
4. **Reserved Instances** — Steady workloads eligible for RI purchases (cost/benefit analysis)

Each recommendation includes: estimated monthly savings, implementation effort, confidence score.

(`worker/recommendation_engine.py`)

**Multi-Tenant Isolation** — Supabase PostgreSQL with Row-Level Security (RLS) policies. Each user sees only their organization's costs and recommendations.

(`supabase/migrations/` — RLS policies on costs, recommendations, budgets tables)

**Budget Alerts** — Set per-service/per-team/per-environment cost thresholds. Alerts via email (Resend integration) when budget exceeded.

(`supabase/functions/send-budget-alert.ts`)

**Dashboard** — React 18 + Recharts visualization:
- Daily/monthly cost trends by service
- Service-level cost breakdown
- Top-cost services ranking
- Budget consumption progress
- Recommendation list with implementation guidance

(`src/pages/DashboardPage.tsx`, `src/components/CostTrendChart.tsx`)

**What-If Simulator** — Model cost changes from configuration updates (storage class changes, instance downsizing, retention policy adjustments). Projects estimated savings.

(`src/pages/SimulatorPage.tsx`)

**Stack** — React 18, Vite, Supabase (PostgreSQL + Auth + Edge Functions), Python 3.9+ (pandas, psycopg2), Tailwind CSS, shadcn-ui, Recharts.

## How It Works

1. **Export AWS billing CSV** → Download from AWS Cost Management or use Cost and Usage Reports (CUR)
2. **Load into SpendLens** → Run Python worker: `python3 batch_aggregator.py billing.csv --org-id ORG_ID`
3. **Worker processes** → Parser normalizes CSV → Aggregator computes daily/monthly rollups → Recommendation engine generates suggestions
4. **Data persists to Supabase** → All team members see aggregated costs + recommendations via dashboard
5. **User sets budgets** → Define per-service or per-team thresholds → Alerts trigger if exceeded
6. **Optimize** → Review recommendations → Use simulator to model changes → Update cloud infra

## Getting Started

### Prerequisites
- Supabase account (PostgreSQL database)
- AWS billing CSV (export from AWS Cost Management or CUR)
- Python 3.9+ (local worker processing)

### Frontend Setup
```bash
npm install
npm run dev  # http://localhost:5173
```

### Backend Setup
```bash
cd worker
pip install -r requirements.txt
cp .env.example .env
# Edit .env with Supabase connection string
```

### Load Sample Data
```bash
# Generate 30 days of synthetic billing data
python3 scripts/generate_sample_billing.py --days 30 --output billing.csv

# Process with worker
python3 batch_aggregator.py billing.csv --org-id demo-org

# Open dashboard: http://localhost:5173
```

### Custom CSV Processing
```bash
python3 batch_aggregator.py /path/to/your/billing.csv --org-id your-org-id
```

## CSV Format

Parser supports two formats:

**Simplified** (recommended for testing):
```
date,service,cost,usage,unit,region,team,project,environment,resource_id
2024-01-15,EC2,125.50,100,Hours,us-east-1,backend,web-app,production,i-123456
2024-01-15,S3,45.20,500,GB-Month,us-west-2,data,analytics,production,
```

**AWS CUR** (standard format):
- Automatically detected and normalized by parser
- Supports all CUR columns + custom tags

## Testing
```bash
# Frontend
npm run test

# Backend
cd worker
python3 -m pytest tests/
```

## Deployment

### Frontend
```bash
npm run build
# Deploy to Vercel, Netlify, or any static host
```

### Worker
- **GitHub Actions** — Schedule CSV processing via Actions workflow
- **Cron** — `0 2 * * * python3 batch_aggregator.py /billing/latest.csv --org-id ORG_ID`
- **Docker** — Build and deploy worker as container with scheduled triggers

## Architecture

```
AWS Billing CSV
      ↓
Python Worker Pipeline
  ├─ csv_parser.py   → Normalize CSV
  ├─ aggregator.py   → Daily/monthly rollups
  └─ recommendation_engine.py → Generate 4 recommendation types
      ↓
Supabase PostgreSQL (RLS-protected)
      ↓
React Dashboard
  ├─ Cost trends (Recharts)
  ├─ Service breakdown
  ├─ Budget alerts
  └─ What-if simulator
```

## Security
- **Row-Level Security** — All tables (costs, recommendations, budgets) protected by RLS policies
- **Multi-tenant isolation** — Users see only their organization's data
- **No secrets in git** — `.env` file gitignored, credentials in Supabase Secrets Manager

## License
MIT
