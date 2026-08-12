# Smart Expense Tracker API

A Node.js and Express backend for the Smart Expense Tracker application. This API handles user authentication, financial records, budget tracking, dashboards, reports, notifications, and admin operations for a personal finance platform.

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

## Project Structure

```text
backend/
├── package.json
├── .env.example
├── .gitignore
├── .eslintrc.json
├── README.md
├── src/
│   ├── app.js
│   ├── server.js
│   ├── seedCategories.js
│   ├── config/
│   │   ├── db.config.js
│   │   ├── env.config.js
│   │   └── logger.config.js
│   ├── constants/
│   │   └── roles.constant.js
│   ├── controllers/
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   ├── budget.controller.js
│   │   ├── category.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── expense.controller.js
│   │   ├── income.controller.js
│   │   ├── notification.controller.js
│   │   └── report.controller.js
│   ├── domain/
│   │   ├── base/
│   │   ├── Budget.js
│   │   ├── Category.js
│   │   ├── Expense.js
│   │   ├── Income.js
│   │   ├── Notification.js
│   │   ├── Report.js
│   │   └── User.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── notFound.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   └── validate.middleware.js
│   ├── models/
│   │   ├── Budget.model.js
│   │   ├── Category.model.js
│   │   ├── Expense.model.js
│   │   ├── Income.model.js
│   │   ├── Notification.model.js
│   │   └── User.model.js
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── budget.routes.js
│   │   ├── category.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── expense.routes.js
│   │   ├── income.routes.js
│   │   ├── notification.routes.js
│   │   └── report.routes.js
│   ├── services/
│   │   ├── AnalyticsService.js
│   │   ├── AuthService.js
│   │   ├── BudgetService.js
│   │   ├── DashboardService.js
│   │   ├── EmailService.js
│   │   ├── ExpenseCalculator.js
│   │   ├── NotificationService.js
│   │   ├── PdfGenerator.js
│   │   └── ValidationService.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   └── asyncHandler.js
│   ├── validations/
│   │   ├── auth.validation.js
│   │   ├── budget.validation.js
│   │   ├── category.validation.js
│   │   ├── expense.validation.js
│   │   └── income.validation.js
│   └── seedCategories.js
└── README.md
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

This project is intended for local development and project demonstration use unless additional licensing terms are added by the repository owner.
