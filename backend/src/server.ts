// server.ts
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/database';
import { config } from './config/env';
import logger from './utils/logger.utils';
import setupSocket from './utils/socket';

const PORT = config.port || 8000;

(async () => {
  try {
    logger.info(' Starting server...');

    // 1️⃣ Connect to MongoDB
    await connectDB();
    logger.info('MongoDB connected*********');

    // 2️⃣ Create HTTP + Socket.IO server
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
      },
    });

    // 3️⃣ Setup Socket.IO listeners (notifications, validations, etc.)
    setupSocket(io);
    logger.info(' Socket.IO setup complete');

    // 4️⃣ Start Express HTTP server
    server.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (err: any) {
    logger.error(' Startup error:', err.message);
    process.exit(1);
  }
})();
