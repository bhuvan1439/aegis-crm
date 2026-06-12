# Aegis CRM | Client Lead Management System

Aegis CRM is a high-performance, secure, and beautiful Client Lead Management System designed to help agencies, freelancers, and startups manage client leads generated from website contact forms.

Featuring a premium **dark-themed glassmorphism** visual style, real-time analytics, status workflows, timeline logs, and data portability, Aegis CRM is built to streamline client onboarding workflows.

---

## ✨ Key Features

### 🔹 Lead Ingestion & Workflows
- **Public Contact Form**: A client-facing contact form simulating lead generation from a company website.
- **Manual Lead Insertion**: Administrators can add new leads manually from inside the console (useful for referrals or walk-ins).
- **Lead Status Management**: Transition leads through a full lifecycle: `New` ➜ `Contacted` ➜ `Converted`.
- **Chronological Follow-up Notes**: Log detailed notes, proposals, and interaction histories for each client.

### 🔹 Analytics & Visuals
- **Metrics Banner**: Real-time KPI calculations showing total leads, contacted counts, converted counts, and overall conversion rate.
- **Visual Lead Distribution**: Custom CSS-based distribution bar charts displaying statuses and source metrics.
- **Search & Filters**: Instantly find leads using live search (by name, email, or company), filter by lead source/status, and sort by date or name.

### 🔹 Security & Portability
- **Secure Admin Panel**: Admin actions are protected using standard JSON Web Tokens (JWT) and encrypted passwords (bcryptjs).
- **CSV Data Exporter**: Export lead registries instantly to a CSV file for reporting or offline analysis.
- **Cascading Records**: Automated deletion of associated follow-up notes when a lead is removed.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Vanilla CSS, Lucide Icons
- **Backend**: Node.js, Express.js, JWT, BcryptJS
- **Database**: SQLite3 (zero-configuration, serverless relational database)
- **Tooling**: Concurrently (to manage backend and frontend dev servers simultaneously)

---

## 📋 Database Schema

The database stores records locally in `backend/crm.sqlite` using three tables:

### 1. `users` (Admin Authentication)
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `username`: TEXT UNIQUE (Default: `admin`)
- `password`: TEXT (Bcrypt hashed password)
- `role`: TEXT (Default: `admin`)

### 2. `leads` (Client Information)
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `name`: TEXT NOT NULL
- `email`: TEXT NOT NULL
- `phone`: TEXT
- `company`: TEXT
- `source`: TEXT (e.g. 'Website Contact Form', 'LinkedIn Referral')
- `status`: TEXT DEFAULT 'new' (`new`, `contacted`, `converted`)
- `created_at`: DATETIME
- `updated_at`: DATETIME

### 3. `notes` (Timeline Logs)
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `lead_id`: INTEGER NOT NULL (Foreign Key referencing `leads(id)` ON DELETE CASCADE)
- `content`: TEXT
- `created_at`: DATETIME

---

## 🚀 Setup & Execution Instructions

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v16+) and `npm` installed.

### 1. Installation
Clone this repository, navigate to the `CRM` directory, and install all dependencies:
```bash
npm run install:all
```

### 2. Launch the Application
Start the Express API and the Vite development server concurrently:
```bash
npm run dev
```
Once started:
- **Frontend App**: `http://localhost:5173/` (Contact Form / Dashboard UI)
- **Backend API**: `http://localhost:5000/` (Express API)

### 3. Default Credentials
Access the admin dashboard using the default login credentials:
- **Username**: `admin`
- **Password**: `admin123`

---

## 🌐 API Reference

### Public Endpoints
- `POST /api/leads` - Creates a new lead (e.g., from a website contact form submission).
- `POST /api/auth/login` - Authenticates admin credentials and returns a JWT token.

### Protected Endpoints (Requires `Authorization: Bearer <JWT_TOKEN>`)
- `GET /api/leads` - Retrieve all leads (supports `status`, `source`, `search`, and `sort` query parameters).
- `GET /api/leads/:id` - Fetch details for a specific lead.
- `PATCH /api/leads/:id` - Update status or lead details.
- `DELETE /api/leads/:id` - Remove a lead record and its notes.
- `GET /api/leads/:id/notes` - Retrieve follow-up notes list.
- `POST /api/leads/:id/notes` - Create a new note entry.
