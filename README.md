# JalMitra (जलमित्र) - Village Drought & Water Management System

**JalMitra** is an accessible, mobile-first web application designed to help villagers track drinking water availability, view distribution schedules, and report local water supply problems (such as pipeline bursts, zero pressure, or contamination). It features an integrated **Admin Portal** for the Gram Panchayat to adjust water source levels and update distribution schedules in real time, backed by a **Node.js + Express REST API** and a **MySQL** database.

---

## 🌟 Architecture & Features

### 1. 🏠 Home Dashboard
- **Village Identity**: Gram Panchayat name (`Sundarpur Gram Panchayat`) and administrative details.
- **Dynamic Water Reserve Gauge**: Visual water tank graphic with water level percentage, total available liters (e.g. `342,000 / 900,000 Liters`), and status badge (**Normal**, **Low**, or **Critical**).
- **Drought Advisory & Status Note**: Explains remaining days of supply and rationing advice.
- **Today's Distribution Snapshot**: Real-time overview of current flowing water vs upcoming ward timings.
- **Key Metrics**: Active operational sources, next water distribution slot, open villager issues, and tanker hotline.

### 2. 🚰 Water Storage (जल स्त्रोत)
- Track all village water sources:
  1. *Main Village Reservoir (Shivalay Talab)* – 500,000 L
  2. *North Falia Overhead Tank* – 150,000 L
  3. *Panchayat Community Well #1* – 100,000 L
  4. *Government Borewell Station South* – 80,000 L
  5. *School Rainwater Harvest Cistern* – 70,000 L
- Filter chips: Easily filter by **All Sources**, **Overhead Tanks**, **Wells & Borewells**, or **Reservoirs & Lakes**.
- Capacity fill bars, remaining liters, inspection timestamps, and water purity testing status.

### 3. 📅 Distribution Schedule (वितरण समय)
- Timetable organized by area/ward (Ward 1 to Ward 5).
- Displays date, time windows (e.g., `05:00 PM - 07:00 PM`), duration, supply type (Pipeline Tap, Water Tanker, Community Well), and lineman contact number.
- **Live Search bar** to search by Ward name or Lineman.
- **Status Filter dropdown** to view *Active Now (Flowing)*, *Upcoming Today*, *Tomorrow's Schedule*, or *Completed*.

### 4. 📢 Report a Problem (समस्या दर्ज करें)
- Villager-friendly complaint form with field validation:
  - Villager Name, 10-digit mobile number, Ward / Area selector
  - Issue Type (*No Water Supply*, *Pipeline Leakage*, *Dirty/Muddy Water*, *Low Pressure*, *Broken Community Tap/Valve*, *Emergency Tanker Request*)
  - Urgency level (*Normal*, *High*, *Critical*)
  - Detailed description with landmark guidance
- **Live Community Reports Feed**: Shows submitted issues with real-time status (*Pending*, *Dispatched*, *Resolved*).

### 5. ⚙️ Admin Portal
- **Village Advisory Settings**: Change village name, drought advisory status, and public banner notice.
- **Storage Level Sliders**: Real-time sliders to change the percentage and available liters for any water source. Adjustments immediately update MySQL.
- **Schedule Management**: Add new schedule slots via modal, edit existing timings, or change operational status (*Active Now*, *Upcoming*, *Completed*, *Delayed*).
- **Complaint Resolution**: Update any villager report status to *Dispatched* or *Resolved*.
- **Reset to Sample Data**: One-click restore button to re-seed MySQL with clean initial sample data.

---

## 🗄️ MySQL Database Setup Guide

### Step 1: Create the Database & Tables
Log in to your MySQL server and execute the provided `backend/schema.sql` file:

```bash
# Using MySQL Command Line Client:
mysql -u root -p < "backend/schema.sql"
```

Or open your database tool (MySQL Workbench, phpMyAdmin, DBeaver) and run the queries inside `backend/schema.sql`. It creates:
- `jalmitra_db` database
- `village_settings` table
- `water_sources` table
- `distribution_schedules` table
- `community_reports` table
- Initial sample data for Sundarpur Gram Panchayat

---

## 🔐 Environment Variables (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and enter your database credentials:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
# Server Port
PORT=5000

# MySQL Database Settings
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=jalmitra_db
```

> [!NOTE]
> `backend/.env` is included in `.gitignore` to prevent committing passwords or sensitive credentials.

---

## 🚀 How to Run the Backend & Frontend

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Start the Express Backend Server
```bash
# Production mode:
npm start

# Or development mode with auto-reload:
npm run dev
```
The server will start at:
- **API Base**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

### 3. Start the Frontend
In a new terminal window in the project root:
```bash
python -m http.server 8080
```
Open **[http://localhost:8080/](http://localhost:8080/)** in your browser.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check & MySQL connection probe |
| `GET` | `/api/village-settings` | Fetch current village status and advisory |
| `PUT` | `/api/village-settings` | Update village name, drought status, and notice |
| `GET` | `/api/water-sources` | List all water sources |
| `POST` | `/api/water-sources` | Add a new water storage source |
| `PUT` | `/api/water-sources/:id` | Update water source level % or details |
| `DELETE` | `/api/water-sources/:id` | Delete a water source |
| `GET` | `/api/distribution-schedules` | List water supply schedules |
| `POST` | `/api/distribution-schedules` | Create a new distribution schedule slot |
| `PUT` | `/api/distribution-schedules/:id` | Update schedule slot time or status |
| `DELETE` | `/api/distribution-schedules/:id` | Delete a distribution schedule slot |
| `GET` | `/api/community-reports` | List all reported water issues |
| `POST` | `/api/community-reports` | Submit a new villager complaint |
| `PUT` | `/api/community-reports/:id/status` | Update complaint status (`Pending`, `Dispatched`, `Resolved`) |
| `DELETE` | `/api/community-reports/:id` | Delete a community report |
| `POST` | `/api/reset-data` | Reset tables back to default sample data |

---

## 🚦 Connection Status Indicators

- **🟢 MySQL: Connected**: Both the Express server and MySQL database are active and synchronized.
- **🟡 Express: Live \| MySQL: Pending**: Express is running on port 5000, but MySQL credentials in `backend/.env` need to be set or MySQL service needs to be started.
- **🔴 Backend: Disconnected**: Express server is not running on port 5000. The frontend operates in local fallback mode.
