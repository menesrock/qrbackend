# QR Restaurant System - Backend

Node.js + Express + PostgreSQL backend for the QR Restaurant System.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io
- **Authentication**: JWT with httpOnly cookies
- **File Upload**: Multer + Sharp
- **Push Notifications**: web-push

## Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

3. Set up PostgreSQL database and update `DATABASE_URL` in `.env`

4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

5. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

6. Generate VAPID keys for web push:
   ```bash
   npx web-push generate-vapid-keys
   ```
   Add the keys to `.env`

### Development

Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

### Database Management

- View database in Prisma Studio:
  ```bash
  npm run prisma:studio
  ```

- Create a new migration:
  ```bash
  npm run prisma:migrate
  ```

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── config/            # Configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript types
│   └── server.ts          # Entry point
├── uploads/               # Uploaded files
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

### Menu Items
- `GET /api/menu-items` - Get all menu items
- `POST /api/menu-items` - Create menu item (admin)
- `PUT /api/menu-items/:id` - Update menu item (admin)
- `DELETE /api/menu-items/:id` - Delete menu item (admin)

### Orders
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status
- `GET /api/orders/:id` - Get order details

### Tables
- `GET /api/tables` - Get all tables
- `POST /api/tables` - Create table (admin)
- `PUT /api/tables/:id` - Update table
- `DELETE /api/tables/:id` - Delete table (admin)

### Call Requests
- `GET /api/call-requests` - Get call requests
- `POST /api/call-requests` - Create call request
- `PUT /api/call-requests/:id` - Complete call request

### Users
- `GET /api/users` - Get users (admin)
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings (admin)

## WebSocket Events

### Client → Server
- `join:room` - Join a room (table, waiter, chef, admin)
- `leave:room` - Leave a room

### Server → Client
- `order:new` - New order created
- `order:updated` - Order status updated
- `call:new` - New call request
- `call:completed` - Call request completed
- `menu:updated` - Menu items updated
- `settings:updated` - Settings updated

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Deployment

See `DEPLOYMENT.md` for VM deployment instructions.
