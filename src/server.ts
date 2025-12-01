import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(compression());
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Serve favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content - favicon is optional
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
import authRoutes from './routes/auth.routes';
import menuItemsRoutes from './routes/menuItems.routes';
import ordersRoutes from './routes/orders.routes';
import tablesRoutes from './routes/tables.routes';
import callRequestsRoutes from './routes/callRequests.routes';
import usersRoutes from './routes/users.routes';
import settingsRoutes from './routes/settings.routes';
import uploadRoutes from './routes/upload.routes';
import customersRoutes from './routes/customers.routes';

app.get('/api', (req, res) => {
  res.json({ message: 'QR Restaurant API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/menu-items', menuItemsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/call-requests', callRequestsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/customizations', require('./routes/customizations.routes').default);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in other modules
export { io };

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// Start server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
