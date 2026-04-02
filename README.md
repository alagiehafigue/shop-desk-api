# ShopDesk POS API

ShopDesk is a modern **Point of Sale (POS) backend system** built for retail businesses.
This repository contains the **backend API** responsible for handling authentication, product management, inventory, sales processing, and payments.

The backend is built with **Node.js, Express, and PostgreSQL** and follows a modular and scalable architecture suitable for real-world applications.

---

# Tech Stack

Backend

- Node.js
- Express.js

Database

- PostgreSQL (Neon)
- pg (PostgreSQL driver)

Security & Utilities

- bcrypt
- jsonwebtoken
- helmet
- cors
- morgan
- zod

Development Tools

- nodemon
- eslint
- prettier

---

# Project Structure

```
shop-desk-api
│
├── src
│   ├── config
│   │     db.js
│   │
│   ├── modules
│   │     auth
│   │     products
│   │     customers
│   │     sales
│   │     payments
│   │     inventory
│   │
│   ├── middlewares
│   ├── utils
│   └── app.js
│
├── database
│   └── schema.sql
│
├── tests
│
├── server.js
├── package.json
├── .env.example
└── README.md
```

---

# Core Features

The ShopDesk POS backend supports the following modules:

### Authentication

- User registration
- Login
- JWT authentication
- Role-based access (Admin, Manager, Cashier)

### Product Management

- Add product
- Update product
- Delete product
- Search product
- Barcode support

### Inventory Management

- Automatic stock deduction after sale
- Inventory tracking
- Stock adjustment logs

### Sales Processing

- Create sale transaction
- Add items to sale
- Calculate totals
- Apply discounts and taxes

### Payments

Supported payment methods:

- Cash
- Mobile Money via Paystack
- Card via Paystack

### Customer Management

- Register customers
- Track purchase history
- Loyalty points

### Reporting

- Daily sales reports
- Product performance reports
- Inventory reports

---

# Database

The system uses **PostgreSQL (Neon)**.

Database schema is located in:

```
database/schema.sql
```

Tables include:

- users
- products
- customers
- sales
- sale_items
- payments
- inventory_logs

To create the database tables, run the SQL file in the **Neon SQL editor**.

---

# Environment Variables

Create a .env file in the project root (copy .env.example and fill in the values).

Required values:

```
PORT=5000
NODE_ENV=development

DATABASE_URL=your_neon_database_connection_string
CORS_ORIGINS=http://localhost:5173

JWT_ACCESS_SECRET=super-secret
JWT_REFRESH_SECRET=another-super-secret

ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d

PAYSTACK_SECRET_KEY=sk_test_or_sk_live_key
PAYSTACK_CURRENCY=GHS
PAYSTACK_BASE_URL=https://api.paystack.co
```

Card and Mobile Money payments are verified against Paystack before the sale is marked completed.

For reference see:

```
.env.example
```
# Installation

Clone the repository

```
git clone https://github.com/alagiehafigue/shop-desk-api.git
```

Enter the project directory

```
cd shop-desk-api
```

Install dependencies

```
npm install
```

Create environment variables

```
cp .env.example .env
```

Update the `.env` file with your configuration.

---

# Running the Server

Development mode

```
npm run dev
```

Production mode

```
npm start
```

Server will start on:

```
http://localhost:5000
```

---

# Deployment

This setup supports:

- local frontend + local backend
- Vercel frontend + Render backend
- local frontend + Render backend

## Frontend on Vercel

Deploy the `shop-desk-ui` folder to Vercel.

Set this environment variable in Vercel:

```
VITE_API_URL=https://your-render-service.onrender.com
```

The frontend includes `vercel.json` so React routes rewrite to `index.html` correctly.

## Backend on Render

Deploy the `shop-desk-api` folder to Render or use the root `render.yaml` blueprint.

Important Render environment variables:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=your_neon_database_connection_string
JWT_ACCESS_SECRET=super-secret
JWT_REFRESH_SECRET=another-super-secret
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
CORS_ORIGINS=http://localhost:5173,https://your-vercel-project.vercel.app
```

If you use Paystack in production or staging, also set:

```
PAYSTACK_SECRET_KEY=...
PAYSTACK_CURRENCY=GHS
PAYSTACK_BASE_URL=https://api.paystack.co
```

## Cookies and Cross-Origin Auth

- In local development, refresh-token cookies use `sameSite=lax` and `secure=false`.
- In production, refresh-token cookies use `sameSite=none` and `secure=true` so Vercel and Render can work together across domains.
- CORS now only allows localhost defaults plus the origins listed in `CORS_ORIGINS`.

## Local Development

Frontend:

```
VITE_API_URL=http://localhost:5000
```

Backend:

```
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
```

If your Vite app runs on a different port locally, add that port to `CORS_ORIGINS`.

---

# Development Workflow

The project follows a **feature-based development approach**.

Each feature follows this process:

1. Design database schema
2. Implement API
3. Test using Postman/Thunder Client
4. Commit changes to GitHub

Example commit messages:

```
feat: implement authentication module
feat: add product management endpoints
fix: correct inventory stock deduction
```

---

# Security

Sensitive credentials are stored in `.env` files.

The following files are ignored by Git:

```
.env
node_modules
logs
```

---

# License

This project is developed for educational and portfolio purposes.
