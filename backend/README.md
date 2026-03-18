# Schronisko App

Animal shelter quality assessment application with automatic rating calculation based on structural data and user reviews.

## 📋 Requirements

- **Python**: 3.13+
- **Node.js**: 18+
- **PostgreSQL**: 14+
- **uv** (Python package manager): [Install here](https://github.com/astral-sh/uv)

## 🚀 Quick Start

### Step 1: Database Setup

1. **Install PostgreSQL** and make sure it's running

2. **Create database:**
```sql
CREATE DATABASE schronisko;
```

3. **Configure environment:**
```bash
cd backend/app
cp .env.example .env
```

4. **Edit `.env` file** with your PostgreSQL credentials:
```env
POSTGRESQL_URL="postgresql://postgres:your_password@localhost:5432"
```

### Step 2: Start Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
uv sync

# Start server
cd app
python main.py
```

✅ **Backend running at:** `http://localhost:8000`  
📚 **API Docs (Swagger):** `http://localhost:8000/docs`

**Console output on startup:**
```
🚀 Starting application...
✓ Quality scores calculated on startup:
  - Shelters processed: 50
  - Reviews processed: 234
  - Scores updated: 50
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 3: Start Frontend

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ **Frontend running at:** `http://localhost:5173`

## 🎯 What Happens Automatically

When backend starts, it automatically:
- ✅ Creates `shelter_quality_scores` table (if not exists)
- ✅ Calculates quality scores for all shelters
- ✅ Analyzes structural data and user reviews
- ✅ Detects systemic issues across 7 categories

## 📡 API Endpoints

### Shelters
- `GET /api/v1/hostels` - Get all shelters

### Comments
- `GET /api/v1/comments` - Get all comments
- `POST /api/v1/comments` - Add new comment
- `GET /api/v1/comments/{shelter_id}` - Comments for specific shelter

### Reports
- `POST /api/v1/reports` - Submit problem report

### Quality Scores ⭐ NEW
- `GET /api/v1/quality-scores` - Get all quality scores
- `GET /api/v1/quality-scores/{shelter_id}` - Get score for specific shelter
- `POST /api/v1/quality-scores/calculate` - Manually recalculate scores

## 🧪 Test the API

### Using curl:

```bash
# Get all shelters
curl http://localhost:8000/api/v1/hostels

# Get quality scores
curl http://localhost:8000/api/v1/quality-scores

# Get score for shelter ID=1
curl http://localhost:8000/api/v1/quality-scores/1

# Recalculate scores manually
curl -X POST http://localhost:8000/api/v1/quality-scores/calculate

# Add a comment
curl -X POST http://localhost:8000/api/v1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "shelter_id": 1,
    "author": "John Doe",
    "rating": 5,
    "comment": "Great shelter!"
  }'
```

### Using Swagger UI:

Open `http://localhost:8000/docs` to test all endpoints interactively.

## 🎯 Quality Scoring Algorithm

**Score calculation (0-100):**
- 55% - Structural data (licenses, contacts, transparency)
- 45% - User reviews (with Bayesian smoothing)

**Features:**
- Temporal weighting (older reviews count less)
- Author deduplication
- Systemic issue detection in 7 categories:
  - Cleanliness
  - Health/Veterinary care
  - Staff behavior
  - Adoption process
  - Communication
  - Overcrowding
  - Safety

See [QUALITY_SCORING_README.md](./QUALITY_SCORING_README.md) for details.

## 🔧 Development Commands

### Backend:
```bash
# Run with auto-reload
uvicorn main:app --reload

# Run on different port
uvicorn main:app --port 8080

# Run standalone scoring script
python algorytm.py
```

### Frontend:
```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
backend/
  app/
    main.py                    # FastAPI entry point
    algorytm.py                # Standalone scoring script
    .env                       # Environment variables
    api/routers/
      hostels.py               # Shelter endpoints
      comments.py              # Comment endpoints
      reports.py               # Report endpoints
      quality_scores.py        # Quality scoring endpoints ⭐
    services/
      quality_scoring.py       # Scoring algorithm ⭐
    models/                    # Pydantic models
    core/                      # Configuration

frontend/
  src/
    components/                # React components
    hooks/                     # Custom hooks
    utils/                     # Utilities
```

## 🐛 Troubleshooting

### Backend won't start

**Error:** `connection refused` or database errors

**Fix:**
1. Check PostgreSQL is running:
   ```bash
   # Windows
   net start postgresql-x64-14
   
   # Mac/Linux
   sudo service postgresql status
   ```
2. Verify database exists: `CREATE DATABASE schronisko;`
3. Check `.env` has correct `POSTGRESQL_URL`
4. Ensure you're in `backend/app` directory

### Frontend won't connect

**Error:** `ECONNREFUSED` or API errors

**Fix:**
1. Ensure backend is running on `http://localhost:8000`
2. Clear and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Python import errors

**Error:** `ModuleNotFoundError`

**Fix:**
1. Navigate to correct directory: `cd backend/app`
2. Reinstall dependencies: `uv sync`
3. Check Python version: `python --version` (need 3.13+)

### Quality scores not calculating

**Fix:**
1. Check tables exist: `shelters` and `comments`
2. Manually recalculate:
   ```bash
   curl -X POST http://localhost:8000/api/v1/quality-scores/calculate
   ```
3. Check console for error messages

## 📝 Environment Variables

Create `backend/app/.env` from `.env.example`:

```env
POSTGRESQL_URL="postgresql://username:password@localhost:5432"
```

## 🚢 Production Deployment

### Backend:
```bash
uv sync
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend:
```bash
npm run build
# Deploy the dist/ folder to your hosting service
```

## 📚 Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## 👥 Authors

UG Project Team - 2026

---

**Need help?** Check troubleshooting section above or open an issue.
