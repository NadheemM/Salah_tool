# 🕌 Salah Time Tool

A web-based management tool for masjids to manage prayer times, waqth charts, and masjid information.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb) ![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel) ![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)

---

## ✨ Features

### 🕌 Masjid Management
- Add, edit, and delete masjid records
- Store name, district, state, address, Google Maps link, and Mihrab Masjid ID
- Manage Imam and Muaddin details with phone numbers
- Committee members with name, phone number, and address
- Remarks and notes per masjid
- Search by name or Mihrab ID
- Filter by district and state

### 📋 Waqth Charts
- Upload prayer time charts via CSV or Excel (.xlsx)
- Manage multiple waqth charts per region
- View and edit prayer times for each day of the year

### ⏱️ Salah Time Adjustments
- Assign waqth charts to masjids
- Set rounding rules per prayer per masjid:
  - Round to nearest 5 or 10 minutes
  - Custom minute offset (e.g. +2 minutes from actual time)
  - No rounding (preserve exact time)
- Live preview of adjusted prayer times

### 📤 Export
- Export salah times to **CSV**, **Excel (.xlsx)**, and **PDF**
- Download formatted timetables per masjid

### 🔐 Authentication
- Secure login system
- Session-based access control

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | Frontend UI |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI components |
| **FastAPI** | Backend API |
| **MongoDB Atlas** | Database |
| **Motor** | Async MongoDB driver |
| **openpyxl / xlsxwriter** | Excel file handling |
| **ReportLab** | PDF generation |
| **Vercel** | Frontend hosting |
| **Render** | Backend hosting |

---

## 📁 Project Structure

```
├── frontend/
│   └── src/
│       ├── App.jsx                  # Root app with routing
│       ├── pages/
│       │   ├── Dashboard.jsx        # Overview dashboard
│       │   ├── MasjidList.jsx       # List all masjids
│       │   ├── MasjidDetail.jsx     # View/edit masjid + adjustments
│       │   ├── AddMasjid.jsx        # Add new masjid
│       │   ├── WaqthCharts.jsx      # List all waqth charts
│       │   ├── WaqthChartDetail.jsx # View/edit chart prayer times
│       │   ├── AddWaqthChart.jsx    # Upload new chart
│       │   └── LoginPage.jsx        # Login screen
│       └── components/
│           └── ui/                  # shadcn/ui components
│
└── backend/
    ├── server.py                    # FastAPI app — all routes and logic
    └── requirements.txt             # Python dependencies
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.11+
- MongoDB (local or Atlas)

### Backend
```bash
cd backend
pip install -r requirements.txt

# Create .env file
echo "MONGO_URL=mongodb://localhost:27017" > .env
echo "DB_NAME=salah_db" >> .env

uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
yarn install

# Create .env file
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

yarn start
```

---

## 🌐 Deployment

| Service | Purpose | Cost |
|---|---|---|
| **Vercel** | Frontend hosting | Free |
| **Render** | Backend hosting | Free (sleeps after 15 min idle) |
| **MongoDB Atlas M0** | Database | Free forever |

### Environment Variables

**Backend (Render):**

| Key | Value |
|---|---|
| `MONGO_URL` | MongoDB Atlas connection string |
| `DB_NAME` | `salah_db` |
| `CORS_ORIGINS` | Your Vercel frontend URL |
| `PYTHON_VERSION` | `3.11.9` |

**Frontend (Vercel):**

| Key | Value |
|---|---|
| `REACT_APP_BACKEND_URL` | Your Render backend URL |

---

## 🔥 MongoDB Collections

### `masjids`
| Field | Type | Description |
|---|---|---|
| `masjid_id` | String | Unique ID |
| `name` | String | Masjid name |
| `district` | String | District |
| `state` | String | State |
| `masjid_address` | String | Full address |
| `location_link` | String | Google Maps URL |
| `mihrab_masjid_id` | String | Mihrab system ID |
| `imam` | String | Imam name |
| `imam_number` | String | Imam phone |
| `muaddin` | String | Muaddin name |
| `muaddin_number` | String | Muaddin phone |
| `committee_members` | Array | Members with name, phone, address |
| `waqth_chart_id` | String | Linked chart ID |
| `adjustments` | Object | Per-prayer rounding rules |
| `remark` | String | Additional notes |

### `waqth_charts`
| Field | Type | Description |
|---|---|---|
| `chart_id` | String | Unique ID |
| `name` | String | Chart name |
| `district` | String | District |
| `state` | String | State |
| `prayer_times` | Array | Daily prayer times for the year |

---

## 📄 License

This project is open source and available under the MIT License.

---

Made with ❤️ for the Muslim community
