# Smart Expense Tracker API

Backend API for a full-stack expense management application built with Node.js, Express.js and MongoDB.

The API provides authentication, expense and income management, budgets, categories, dashboard analytics, reports, notifications and admin operations.

## 🔗 Links

- 🌐 [Live Application](https://smart-expense-tracker-frontend-i0p1.onrender.com)
- 🔌 [Backend API](https://smart-expense-tracker-2-8xd6.onrender.com)
-  🎨[Frontend Repository](https://github.com/Abhishekkumar840/Smart-Expense-Tracker-Frontend)

## Overview

The backend is built with Express, MongoDB via Mongoose, and JWT-based authentication. It exposes REST endpoints for managing expenses, incomes, budgets, categories, dashboard analytics, reports, and notification workflows.

## Features

- User authentication and authorization
- Email verification and password reset flows
- Expense management with validation and filtering
- Income management with validation and filtering
- Budget creation, tracking, and comparisons against spend
- Category management with default and custom categories
- Dashboard summary and analytics endpoints
- PDF and CSV report exports
- Notification generation and read-state tracking
- Admin dashboard and user-management endpoints
- API request rate limiting and security headers

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT authentication
- Joi validation
- bcrypt password hashing
- Nodemailer
- PDFKit
- json2csv
- Winston logging
- Helmet, CORS, compression, cookie-parser

## 📁 Project Structure

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── domain/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── validations/
├── .env.example
├── package.json
└── README.md
```

## 🧩 Backend Highlights

- RESTful API architecture
- JWT-based authentication and authorization
- Role-based admin operations
- Request validation using Joi
- Password hashing with bcrypt
- Centralized error handling
- Rate limiting and security headers
- MongoDB database integration with Mongoose
- PDF and CSV report generation
- Email services using Nodemailer
- Logging with Winston

```
## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file from the example:

```bash
copy .env.example .env
```

3. Update environment values in `.env` with your own MongoDB and JWT settings.

4. Start the API:

```bash
npm run dev
```

5. Start the API in production mode:

```bash
npm start
```

## Environment Variables

The app expects the following variables in `.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Smart Expense Tracker <no-reply@expensetracker.com>"
MAX_FILE_UPLOAD_MB=5
UPLOAD_DIR=uploads
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_REQUESTS=100
```

> Keep `.env` local and do not commit secrets to version control.

## Scripts

```bash
npm run start
npm run dev
npm test
npm run lint
```

## Security Notes

- Sensitive values are expected to live in a local `.env` file.
- The project includes request rate limiting and security headers.
- CORS is configured for the expected frontend origin rather than a wildcard.
- JWT secrets and database credentials should be kept private and rotated if ever exposed.

## License

This project is for educational and portfolio purposes.
