# Food Waste Forecasting & Reduction Planning Platform
### *Enterprise ML Demand Forecasting, Kitchen Surplus Analytics & Sustainability Planning*

A full-stack, production-oriented web platform designed for commercial kitchens, hotels, corporate cafeterias, college campus canteens, catering companies, and food-service operations to record daily preparation, accurately forecast future diner demand with machine learning, prevent surplus overproduction, track food donations under strict safety guidelines, and verify financial and environmental savings.

---

## 1. Core Platform Architecture & Features

```
User Registration & Login (Isolated Org) 
       ↓
Executive Operations Dashboard (8 KPI Cards, Recharts Analytics)
       ↓
Daily Food Preparation & Waste Logging (Validated CRUD)
       ↓
Machine Learning Demand Forecasting (Random Forest & Gradient Boosting + Baseline Fallback)
       ↓
Surplus Analysis & Intelligent Recommendations (Batch sizing, Spoilage, Donation Checklist)
       ↓
Intervention Logging & Outcome Measurement (Verified kg and $ savings)
       ↓
Sustainability Impact & Audit Reporting (CO2e avoided, water saved, CSV exports)
```

### Key Modules:
- **Multi-Tenant Organization Setup**: Real multi-tenant data isolation. Each organization (Restaurant, Hotel, College Canteen, Cafeteria, Catering Service, Other) manages its own private catalog, daily records, forecasts, and impact reports.
- **Executive Dashboard**: 8 primary KPI cards (Total Prepared, Consumed, Waste, Surplus, Waste %, Cost of Waste, Waste Reduction % vs Previous Period, Forecasted Demand) and real-time interactive Recharts charts.
- **Daily Food Records & Inventory**: Full CRUD with strict business rule validations (non-negative, consumed $\le$ prepared, surplus vs discarded distinction, reason tagging, storage conditions, unit costs).
- **ML Demand Forecasting**: Feature engineering (day-of-week, month, meal period encoding, lag-1, lag-7, 7-day & 14-day rolling averages), chronological train/validation split (no data leakage), Random Forest and Gradient Boosting Regressors compared with moving average baseline, uncertainty intervals ($80\%$ confidence bounds), and transparent preliminary baseline handling for sparse data ($< 7$ records).
- **Actionable Operational Recommendations**: Surplus analysis detecting repeated overproduction, stockout risks, portion size calibrations, cold-chain spoilage audits, and safe surplus redistribution with a **mandatory food safety checklist** ($\ge 60^\circ\text{C}$ hot holding, $\le 4^\circ\text{C}$ chilled, $< 2\text{h}$ holding window).
- **Sustainability & Environmental Impact**: Documented conversion standards:
  - **GHG Avoidance**: $2.5\text{ kg CO}_2\text{e}$ per $1\text{ kg}$ food saved (*US EPA WARM model / FAO Food Wastage Footprint*).
  - **Freshwater Conserved**: $1,000\text{ Liters}$ virtual water per $1\text{ kg}$ food (*Water Footprint Network / WRI*).
  - **Nutritious Meals Rescued**: $0.45\text{ kg}$ per balanced meal (*USDA / Feeding America standard*).
- **Audit Reports & CSV Data Export**: Filterable summary reports by date range, category, and meal period, with one-click direct CSV streaming export.
- **Demonstration Dataset**: Optional 30-day realistic sample dataset with 450 historical records, trained forecasts, and recommendations, along with a 1-click purge button to return to an empty state.

---

## 2. Technology Stack

- **Frontend**:
  - React.js + Vite (Fast HMR and production bundle optimization)
  - TypeScript
  - Tailwind CSS
  - Recharts (Interactive Area, Bar, Line, and Donut visualizations)
  - Axios (JWT bearer interceptors and automated session recovery)
  - React Router DOM v7 (Stateless protected route architecture)
  - Lucide React Icons
- **Backend**:
  - Python 3.11+
  - Flask 3.1 & Flask-CORS
  - Flask-SQLAlchemy 3.1 & SQLAlchemy 2.1
  - Flask-JWT-Extended 4.7
  - Scikit-learn 1.9, SciPy 1.17, Pandas 2.2, NumPy 2.4
  - PyMySQL 1.2
- **Database**:
  - MySQL 8.0+ / SQLite 3 (Dynamic resolution via `DATABASE_URL`)

---

## 3. Quick Start & Local Setup

### Step 1: Environment Configuration
Create or inspect `.env` in the root directory:
```bash
# Flask Server
FLASK_APP=backend/app.py
FLASK_PORT=5000

# Security Keys
SECRET_KEY=fw-platform-super-secret-key-prod-2026-production-ready
JWT_SECRET_KEY=fw-platform-jwt-token-secret-key-secure-2026
JWT_ACCESS_TOKEN_EXPIRES_HOURS=24

# Database:
# For MySQL:
# DATABASE_URL=mysql+pymysql://root:password@localhost:3306/food_waste_db
# For SQLite (default out-of-the-box):
DATABASE_URL=sqlite:///food_waste.db

# Frontend API URL
VITE_API_BASE_URL=http://localhost:5000/api
```

### Step 2: Backend Dependencies & Database Initialization
```bash
# Install backend packages
pip install -r backend/requirements.txt

# Run database seeder (initializes schema and enterprise demo organization)
python database/seed_mysql.py
```

### Step 3: Run Automated Test Suite
```bash
python -m pytest tests/test_food_waste_platform.py -v
```

### Step 4: Start Backend Server
```bash
python backend/app.py
```
*API runs at `http://localhost:5000`.*

### Step 5: Start Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
*Web application runs at `http://localhost:3000`.*

---

## 4. Pre-Configured Demo Credentials

| Role | Email | Password | Organization |
| :--- | :--- | :--- | :--- |
| **Enterprise Admin** | `director@emeraldvalley.com` | `Director2026!` | Emerald Valley Bistro & Hotel |

*You can also register any new organization directly via the Registration screen.*

---

## 5. REST API Endpoint Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register organization & administrator user.
- `POST /api/auth/login` - Authenticate user & issue JWT bearer access token.
- `GET /api/auth/me` - Retrieve authenticated user profile and organization details.

### Operations Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats?days=30` - Retrieve aggregated 8 KPI metrics and period-over-period comparisons.
- `GET /api/dashboard/charts?days=30` - Retrieve Recharts time-series data (Daily Trends, Prepared vs Consumed, Category Breakdown, Top Wasted Items).

### Food Catalog Inventory (`/api/food-items`)
- `GET /api/food-items` - List food items with category and search filters.
- `POST /api/food-items` - Add food item (name, category, unit, cost, shelf life, storage).
- `PUT /api/food-items/<id>` - Update food item attributes.
- `DELETE /api/food-items/<id>` - Delete food item with confirmation.

### Daily Service Logs (`/api/food-logs`)
- `GET /api/food-logs` - Paginated list of daily records with multi-filter parameters.
- `POST /api/food-logs` - Log daily preparation, consumption, surplus, and waste.
- `PUT /api/food-logs/<id>` - Update recorded quantities and operational notes.
- `DELETE /api/food-logs/<id>` - Delete daily record.

### ML Demand Forecasting (`/api/forecasting`)
- `GET /api/forecasting/latest` - Fetch active demand predictions and confidence bounds.
- `POST /api/forecasting/generate` - Trigger model training and predict future demand.

### Recommendations & Surplus Planning (`/api/recommendations`)
- `GET /api/recommendations` - List active and resolved operational recommendations.
- `POST /api/recommendations/refresh` - Re-analyze historical logs and identify surplus risks.
- `PATCH /api/recommendations/<id>/status` - Transition recommendation status (Pending, In Progress, Completed, Dismissed).
- `POST /api/recommendations/<id>/intervene` - Record verified intervention outcomes (food saved kg, cost saved).

### System Alerts (`/api/alerts`)
- `GET /api/alerts` - List active and historical threshold alerts.
- `PATCH /api/alerts/<id>/resolve` - Resolve active alert.

### Reports & Data Export (`/api/reports`)
- `GET /api/reports/summary` - Aggregated category and meal period audit reports.
- `GET /api/reports/export-csv` - Direct CSV file download.

### Sustainability Impact (`/api/impact`)
- `GET /api/impact/summary` - Verified financial recovery, GHG avoided, water conserved, and meal equivalents.

### Demonstration Data Control (`/api/demo`)
- `POST /api/demo/load` - Seed 30-day realistic sample records.
- `POST /api/demo/clear` - Purge demonstration records with zero leftover artifacts.

---

## 6. Free & Low-Cost Deployment Guide

### A. Backend Deployment (Render / Railway)
1. Fork or push repository to GitHub.
2. In Railway / Render, create a new **Web Service** connecting to the repo.
3. Configure:
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `gunicorn backend.app:app`
   - **Environment Variables**: Add `SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL`.
4. Run `python database/seed_mysql.py` via web console or initial deployment task.

### B. Database Hosting (MySQL)
- **Railway MySQL / Aiven / PlanetScale**: Provision a free/starter MySQL instance and copy the connection string into `DATABASE_URL` (`mysql+pymysql://user:pass@host:port/food_waste_db`).
- Execute `database/schema.sql` if creating tables manually, or allow SQLAlchemy to auto-create all tables.

### C. Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
1. Connect GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Configure:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: `VITE_API_BASE_URL=https://your-backend-api.railway.app/api`
4. Deploy with automatic SSL.
