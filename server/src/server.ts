import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { errorHandler } from './middlewares/error.middleware';
import './config/loadEnv';

// Routes
import itemRoutes from './routes/item.routes';
import messageRoutes, { conversationRouter } from './routes/message.routes';
import claimRoutes from './routes/claim.routes';
import adminRoutes from './routes/admin.routes';
import feedbackRoutes from './routes/feedbackRoutes';
import authRoutes from './routes/authRoutes';
import notificationRoutes from './routes/notification.routes';
import contactRoutes from './routes/contact.routes';

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : defaultAllowedOrigins;

const corsOriginValidator: cors.CorsOptions['origin'] = (origin, callback) => {
  // Allow non-browser tools like curl/Postman and same-origin server calls.
  if (!origin) {
    callback(null, true);
    return;
  }

  if (allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked for origin: ${origin}`));
};

const app: Application = express();
const httpServer = http.createServer(app);
const uploadsDir = path.resolve(__dirname, '../uploads');
const placeholderImagePath = path.resolve(__dirname, '../../client/public/placeholder.png');

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Join a room scoped to a conversation (itemId + sorted participants)
  socket.on('join_conversation', (roomId: string) => {
    socket.join(roomId);
    console.log(`[Socket] ${socket.id} joined room ${roomId}`);
  });

  // Real-time message relay: client emits this after the REST API persists it
  socket.on('send_message', (data: { conversationId: string; itemId?: string; message: unknown }) => {
    // Broadcast to everyone else in the conversation room
    socket.to(data.conversationId).emit('receive_message', data);
    if (data.itemId) {
      socket.to(data.itemId).emit('receive_message', data);
    }
  });

  socket.on('typing', (data: { conversationId?: string; itemId?: string; senderId: string }) => {
    if (data.conversationId) {
      socket.to(data.conversationId).emit('typing', data);
    }
    if (data.itemId) {
      socket.to(data.itemId).emit('typing', data);
    }
  });

  socket.on('stop_typing', (data: { conversationId?: string; itemId?: string; senderId: string }) => {
    if (data.conversationId) {
      socket.to(data.conversationId).emit('stop_typing', data);
    }
    if (data.itemId) {
      socket.to(data.itemId).emit('stop_typing', data);
    }
  });

  socket.on('message_deleted', (data: { conversationId?: string; itemId?: string; messageId: string }) => {
    if (data.conversationId) {
      socket.to(data.conversationId).emit('message_deleted', data);
    }
    if (data.itemId) {
      socket.to(data.itemId).emit('message_deleted', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: corsOriginValidator,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Backward compatibility for existing DB records that still reference /uploads/* URLs.
app.use('/uploads', express.static(uploadsDir));
app.get('/uploads/:fileName', (_req, res) => {
  if (fs.existsSync(placeholderImagePath)) {
    res.sendFile(placeholderImagePath);
    return;
  }

  res.status(404).json({ error: 'Image not found' });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/items', itemRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRouter);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Database Connection ──────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/trueclaim';
const ENABLE_MEMORY_FALLBACK =
  String(process.env.ENABLE_MEMORY_FALLBACK ?? 'false').toLowerCase() === 'true';

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectDB(): Promise<void> {
  const uri = MONGO_URI.trim();

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('[MongoDB] Connected successfully to primary database');
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[MongoDB] Primary DB connect attempt ${attempt}/3 failed: ${message}`);

      if (attempt < 3) {
        await wait(1000 * attempt);
      }
    }
  }

  if (!ENABLE_MEMORY_FALLBACK) {
    console.error(
      '[MongoDB] Could not connect to primary DB. Set ENABLE_MEMORY_FALLBACK=true for temporary in-memory mode.'
    );
    process.exit(1);
  }

  console.warn('[MongoDB] Falling back to in-memory database (ENABLE_MEMORY_FALLBACK=true)...');
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log('[MongoDB] Connected to in-memory database');
  } catch (memError) {
    console.error('[MongoDB] In-memory fallback failed:', memError);
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
