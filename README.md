# Synergy

Synergy is a full-stack waste paper collection management application for schools, offices, and homes in Kenya.

## What is included

- Public website with hero, services, benefits, contact section, WhatsApp link, and partnership inquiry form
- JWT-authenticated admin dashboard
- Role-based access for Super Admin, Admin, and Collection Agent
- Client management with negotiated buying prices per client
- Collection tracking with supplier cost, recycler revenue, logistics cost, and net profit
- Dashboard analytics for weight, revenue, profit, and supplier ranking
- Editable document templates with print preview and PDF export
- Reminder management and report export to Excel/PDF
- Sample seed data for schools, offices, homes, staff, collections, inquiries, and templates

## Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT
- Charts: Recharts
- Export: jsPDF, html2canvas, xlsx

## Project structure

```text
.
├── client
│   ├── src
│   └── .env.example
├── server
│   ├── src
│   └── .env.example
├── package.json
└── README.md
```

## Setup

1. Install dependencies

```bash
npm install
npm install --prefix server
npm install --prefix client
```

2. Copy environment examples

```bash
copy server\.env.example server\.env
copy client\.env.example client\.env
```

3. Update `server/.env` with your MongoDB connection string and JWT secret.

4. Create the first production-safe admin account and settings

```bash
npm run bootstrap
```

This creates the initial Super Admin and default business settings without inserting demo clients or collections.

5. Optional: seed demo data

```bash
npm run seed
```

Use `npm run seed` only when you want sample schools, offices, homes, collections, and inquiries.

6. Start the app in development

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` and backend runs on `http://localhost:5000`.

## Demo accounts

- Super Admin: `superadmin@synergy.co.ke` / `Synergy123!`
- Admin: `admin@synergy.co.ke` / `Synergy123!`
- Collection Agent: `agent@synergy.co.ke` / `Synergy123!`

## Production build

From the project root, install and build:

```bash
npm install
npm run build
```

Then start the production server from the root:

```bash
npm start
```

The Express server is set up to serve the built frontend from `client/dist`.

## Deployment checklist

For a generic Node deployment platform:

- Root install command: `npm install`
- Root build command: `npm run build`
- Root start command: `npm start`
- Required environment variables:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `CLIENT_URL`
  - `PORT`

If the database is empty, run this once before first login:

```bash
npm run bootstrap
```

## Business logic notes

- Supplier buying price is negotiated per client and stored on each client record.
- Buying price can be `0`, `5`, `7`, or any custom number.
- Collection profit uses:
  - Revenue = `weight × recycler price`
  - Supplier cost = `weight × client buying price`
  - Net profit = `revenue - supplier cost - transport - loading - miscellaneous`
- Recycler price is configurable globally, with a default value of `KES 28/kg`.

## Printable documents

Synergy includes editable templates for:

- Collection Record Form
- Partnership Agreement
- Registration Form
- School Proposal

Each template supports:

- auto-filled client and collection data
- on-screen preview
- browser print
- PDF download
