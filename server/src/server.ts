import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { errorHandler } from './middlewares/error.middleware';

// Routes
import itemRoutes from './routes/item.routes';
import messageRoutes from './routes/message.routes';
import claimRoutes from './routes/claim.routes';
import adminRoutes from './routes/admin.routes';
import feedbackRoutes from './routes/feedbackRoutes';
import authRoutes from './routes/authRoutes';
import notificationRoutes from './routes/notification.routes';
import ClaimMeeting from './models/ClaimMeeting';

dotenv.config();

const app: Application = express();
const httpServer = http.createServer(app);

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/items', itemRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Database Connection ──────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/trueclaim';

async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    await ClaimMeeting.createCollection();
    console.log('[MongoDB] Connected successfully');
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    process.exit(1);
  }
}

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '5000', 10);

connectDB().then(() => {
  const server = httpServer.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use`);
      console.error(`\nSolutions:`);
      console.error(`1. Kill the process: taskkill /PID <pid> /F`);
      console.error(`2. Or use a different port: PORT=5001 npm run dev`);
      console.error(`3. Or check what's using the port: netstat -ano | findstr :${PORT}\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });
});

export { io };
