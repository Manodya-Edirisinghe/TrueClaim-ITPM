import express, { Application } from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { errorHandler } from './middlewares/error.middleware';

import itemRoutes from './routes/item.routes';
import messageRoutes, { conversationRouter } from './routes/message.routes';
import claimRoutes from './routes/claim.routes';
import adminRoutes from './routes/admin.routes';
import feedbackRoutes from './routes/feedbackRoutes';
import authRoutes from './routes/authRoutes';
import notificationRoutes from './routes/notification.routes';
import ClaimMeeting from './models/ClaimMeeting';

dotenv.config();

const app: Application = express();
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join_conversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`[Socket] ${socket.id} joined room ${conversationId}`);
  });

  socket.on('send_message', (data: { conversationId: string; message: unknown }) => {
    socket.to(data.conversationId).emit('receive_message', data.message);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/items', itemRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRouter);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/trueclaim';

async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('[MongoDB] Connected successfully');
    await ClaimMeeting.createCollection();
  } catch (error) {
    console.warn('[MongoDB] Primary connection failed, trying in-memory database...', error);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log('[MongoDB] Connected to in-memory database');
      await ClaimMeeting.createCollection();
    } catch (memError) {
      console.error('[MongoDB] All connections failed:', memError);
      process.exit(1);
    }
  }
}

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
