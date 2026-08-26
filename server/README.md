# Mosh Automation - Secure Backend Server

This directory contains the secure Express and MySQL backend for Mosh Automation.

## Features

- **Database**: Relational MySQL database schemas with structured relations, indexes, check constraints, and cascading actions.
- **Authentication**: JWT token authorization securely signed and delivered through HTTP-only, secure, and strict SameSite cookies.
- **Security**: 
  - Password hashing utilizing `bcryptjs` (salt rounds = 10).
  - Role-based Access Control (RBAC) middleware verifying administrator and customer privileges.
  - Express payload parsing limit config (`10mb` size limit for base64 image uploads).
- **Auto-Initialization**: The server automatically boots up, creates the MySQL database if not exists, and seeds default tables (default admin account, billing parameters, default products, and reviews) directly on connection.

## Installation

1. **Install Dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Configure Database & Secrets**:
   Create or edit the `.env` configuration file in the `server` folder with your local setup credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=mosh_automation
   JWT_SECRET=generate_a_random_high_entropy_secret_string
   JWT_EXPIRES_IN=7d
   COOKIE_EXPIRES_IN=7
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```

3. **Start Database**:
   Ensure your MySQL service is running locally on the configured port.

4. **Run the Server**:
   - **Production Mode**: `npm start`
   - **Development Mode**: `npm run dev` (utilizes `nodemon` hot reloading)

## Database Schema Overview

The database contains the following tables:

1. **`users`**: Customer registry and admin credentials. Default administrator phone number `9514714441` (password: `adminpassword`).
2. **`products`**: Smart controller catalog data including descriptions, prices, image paths, float fee, and wire configurations.
3. **`billing_settings`**: Baseline tax rates, sensor costs, and installation parameters.
4. **`orders`**: Customer transactions header containing shipping details, status, and total amount.
5. **`order_items`**: Order line items referencing products.
6. **`estimations`**: Customer inquiries and custom design configuration settings.
7. **`reviews`**: Product ratings and admin reply parameters.
8. **`stories`**: Customer success stories with video details.
9. **`notifications`**: Live alert feeds for administrative events.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create a new user account.
- `POST /api/auth/login` - Authenticate using phone and password; returns cookie.
- `POST /api/auth/logout` - Clear the cookie.
- `GET /api/auth/me` - Retrieve current session details.

### Products
- `GET /api/products` - Get product list.
- `POST /api/products` - [Admin] Create a product.
- `PUT /api/products/:id` - [Admin] Update a product.
- `DELETE /api/products/:id` - [Admin] Delete a product.

### Orders
- `GET /api/orders` - Get orders (Admin: all, Customer: own).
- `POST /api/orders` - Place a new order.
- `PATCH /api/orders/:id/status` - Update order status (Admin: any status, Customer: Completed/Cancelled).

### Success Stories
- `GET /api/stories` - Get success stories.
- ... and admin CRUD routes.
