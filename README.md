# KaamKhaata AI — Complete Setup Instructions

## 🌟 Project Overview
**KaamKhaata AI** is a multilingual, voice-powered digital work and payment ledger for daily-wage workers, contractors, and informal workers in India.

**Tagline:** *Your Work. Your Wages. Your Record.*

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + JavaScript |
| Styling | Custom CSS (mobile-first, responsive) |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Python + FastAPI |
| Database | SQLite + SQLAlchemy |
| Voice | Browser Web Speech API |
| AI | Database-backed NLP query engine |

---

## 📁 Project Structure

```
PROJECT1/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + startup seeding
│   │   ├── database.py      # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── crud.py          # Database operations
│   │   ├── routers/
│   │   │   ├── dashboard.py
│   │   │   ├── work_entries.py
│   │   │   ├── employers.py
│   │   │   ├── payments.py
│   │   │   ├── advances.py
│   │   │   ├── reports.py
│   │   │   └── ai.py
│   │   └── services/
│   │       ├── ai_service.py    # AI query engine
│   │       └── report_service.py
│   ├── data/                # SQLite DB lives here
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api.js            # Axios API client
    │   ├── translations.js   # EN/HI/TE translations
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── WorkLedger.jsx
    │   │   ├── VoiceEntry.jsx
    │   │   ├── Payments.jsx
    │   │   ├── Advances.jsx
    │   │   ├── Calculator.jsx
    │   │   ├── Reports.jsx
    │   │   ├── AIAssistant.jsx
    │   │   └── Employers.jsx
    │   └── context/
    │       ├── LangContext.jsx
    │       └── ToastContext.jsx
    └── package.json
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The server starts at: `http://localhost:8000`

API docs at: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app opens at: `http://localhost:5173`

---

## 🎯 Features

### ✅ Implemented Features

| Feature | Description |
|---------|-------------|
| 📊 Dashboard | Live stats, earnings chart, recent entries |
| 📖 Work Ledger | Full CRUD for work entries |
| 🎤 Voice Entry | Speech recognition (EN/HI/TE) with manual fallback |
| 💰 Payment Tracker | Record & track payments |
| 💵 Advance Tracker | Record advances with adjustment tracking |
| 🧮 Wage Calculator | Daily & hourly wage calculator |
| 📈 Reports | Monthly/employer reports + CSV export |
| 🤖 AI Assistant | DB-backed NLP queries in 3 languages |
| 👥 Employers | Employer management |
| 🌐 Multilingual | English, Hindi, Telugu |

---

## 🗣️ Voice Input

The app uses the **browser's Web Speech API** (no external service needed).

Supported languages:
- **English** (`en-IN`)
- **Hindi** (`hi-IN`)
- **Telugu** (`te-IN`)

> **Note:** Voice recognition works best in **Google Chrome** or **Microsoft Edge**. Firefox has limited support. The app always provides a manual entry fallback.

---

## 🤖 AI Assistant

The AI Assistant is **100% database-backed** — no external LLM required.

Supported question types:
- Earnings queries ("How much did I earn this month?")
- Pending payment queries ("Who owes me money?")
- Advance queries ("How much advance have I received?")
- Recent work queries ("Show my last week's work")
- Summary queries

Languages: English, Hindi, Telugu

---

## 🎪 Demo Data

The application auto-seeds **60 days of realistic demo data** on first launch:
- 4 employers (construction, textiles, enterprises)
- Mixed payment statuses (paid/partial/pending)
- Worker name: Raju Kumar

**Reset demo data:** Use the sidebar button or call `DELETE /api/demo/reset`

---

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/dashboard/stats` | Dashboard statistics |
| `GET/POST /api/work-entries/` | List/create work entries |
| `PUT/DELETE /api/work-entries/{id}` | Update/delete entry |
| `GET/POST /api/employers/` | List/create employers |
| `GET/POST /api/payments/` | List/create payments |
| `GET/POST /api/advances/` | List/create advances |
| `GET /api/reports/monthly` | Monthly report |
| `GET /api/reports/export-csv` | Export to CSV |
| `GET /api/reports/employer-summary` | Employer-wise report |
| `POST /api/ai/query` | AI assistant query |
| `DELETE /api/demo/reset` | Reset demo data |

---

## 🌍 Deployment

### Local Development
Both servers must run simultaneously:
- Backend: port **8000**
- Frontend: port **5173**

### Production Considerations
1. Set `CORS` origins appropriately in `backend/app/main.py`
2. Use `gunicorn` for production backend
3. Build frontend: `npm run build`
4. Serve frontend from a static server or CDN

---

## 🔧 Troubleshooting

**Backend won't start?**
- Ensure Python 3.9+ is installed
- Check `pip install -r requirements.txt` completed

**Voice not working?**
- Use Chrome or Edge
- Allow microphone permissions
- Use HTTPS in production

**Database issues?**
- The `data/` directory is auto-created
- Delete `data/kaamkhaata.db` to reset everything

---

## 📄 License

MIT License — Free to use for educational and commercial purposes.
