# SpendLens 💰

**Cloud cost visibility and optimization engine**

SpendLens helps teams understand and optimize their cloud spending by ingesting AWS billing data, aggregating costs, and generating actionable optimization recommendations.

---

## 🚀 Quick Start

**New to SpendLens?** Start here: **[QUICKSTART.md](QUICKSTART.md)**

---

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute setup guide
- **[BACKEND_README.md](BACKEND_README.md)** - Comprehensive backend documentation
- **[three_projects_plan.pdf](three_projects_plan.pdf)** - Original project specification

---

## 🏗️ Architecture

### Frontend
- **Framework**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn-ui components
- **Features**: 
  - Real-time cost dashboards
  - Interactive charts and visualizations
  - Budget alerts management
  - What-if cost simulator
  - AI-powered recommendation prioritization

### Backend
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Edge Functions**: Deno-based serverless functions
  - AI recommendation prioritization
  - Budget alert notifications (via Resend)
- **Batch Worker**: Python-based CSV processor
  - CSV parsing and normalization
  - Cost aggregation (daily/monthly)
  - Recommendation engine

### Data Flow
```
AWS Billing CSV → Python Worker → Supabase → React Dashboard
                       ↓
                  Recommendations
```

---

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn-ui
- Recharts (data visualization)

### Backend
- Supabase (PostgreSQL + Auth + Edge Functions)
- Python 3.9+ (batch processing)
- pandas (data aggregation)
- psycopg2 (database connectivity)

### Infrastructure
- Vercel/Netlify (frontend hosting)
- Supabase (managed PostgreSQL)
- GitHub Actions (optional batch scheduling)

---

## 💡 Key Features

### Cost Analysis
- **Daily/Monthly aggregations** grouped by service, team, and environment
- **Service-level breakdowns** with trend analysis
- **Tag-based filtering** for multi-team organizations

### Recommendations
4 types of cost optimization recommendations:

1. **🔴 Idle Resources** - Detect and eliminate underutilized resources
2. **💾 Storage Optimization** - S3 storage class and EBS volume optimization
3. **📏 Right-Sizing** - Instance sizing recommendations for high-cost services
4. **💰 Reserved Instances** - Identify steady workloads for RI purchases

### Budget Management
- Set thresholds per service/team/environment
- Email alerts when budgets are exceeded
- Visual tracking of budget consumption

### What-If Simulator
- Model cost changes from configuration changes
- Compare retention policies, instance sizes, storage classes
- Projected savings estimates

---

## 📁 Project Structure

```
SpendLens/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   └── integrations/       # Supabase client
├── supabase/
│   ├── migrations/         # Database schema
│   └── functions/          # Edge functions
├── worker/                 # Python batch processor
│   ├── batch_aggregator.py # Main orchestrator
│   ├── csv_parser.py       # CSV parsing
│   ├── aggregator.py       # Cost aggregation
│   ├── recommendation_engine.py
│   ├── database.py         # DB utilities
│   └── tests/              # Unit tests
└── scripts/
    ├── generate_sample_billing.py
    └── load_sample_data.sh
```

---

## 🚦 Getting Started

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

See **[QUICKSTART.md](QUICKSTART.md)** for detailed instructions.

Quick version:
```bash
# Install Python dependencies
cd worker
pip3 install -r requirements.txt

# Configure database
cp .env.example .env
# Edit .env with your Supabase credentials

# Load sample data
cd ..
./scripts/load_sample_data.sh <your-org-id>
```

---

## 📊 Sample Data

Generate realistic AWS billing data for testing:

```bash
python3 scripts/generate_sample_billing.py --days 30 --output billing.csv
```

This creates a CSV with:
- 15 AWS services (EC2, S3, RDS, Lambda, etc.)
- Realistic cost ranges
- Team/project/environment tags
- Resource IDs

---

## 🧪 Testing

### Frontend Tests
```bash
npm run test
```

### Backend Tests
```bash
cd worker
python3 -m pytest tests/
```

---

## 📈 Production Deployment

### Frontend
Deploy to Vercel or Netlify:
- Connect GitHub repository
- Set environment variables
- Auto-deploy on push

### Backend Worker
Schedule batch processing:

**Option 1: GitHub Actions** (Free)
```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
```

**Option 2: Cron** (Server)
```cron
0 2 * * * cd /path/to/worker && python3 batch_aggregator.py billing.csv --org-id ORG_ID
```

---

## 🔒 Security

- **Row Level Security (RLS)**: All database tables protected
- **Multi-tenant isolation**: Users only see their organization's data
- **JWT authentication**: Supabase handles auth
- **API key scoping**: Edge functions use scoped access

---

## 📝 License

This project is part of a portfolio demonstration.

---

## 🤝 Contributing

This is a portfolio project. For questions or feedback, please open an issue.

---

## 🎯 Project Goals

Built to demonstrate:
- Full-stack development (React + Python + PostgreSQL)
- System design (event-driven, batch processing)
- Data engineering (CSV ingestion, aggregation)
- Business acumen (cost optimization, ROI calculations)
- Production-ready code (testing, documentation, error handling)

---

## 📚 Learn More

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [AWS Cost and Usage Reports](https://docs.aws.amazon.com/cur/latest/userguide/what-is-cur.html)

---

**Ready to optimize your cloud costs?** Start with **[QUICKSTART.md](QUICKSTART.md)** 🚀
