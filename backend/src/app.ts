import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import questionRoutes from './routes/questions.routes';
import answerRoutes from './routes/answer.routes';
import validationRoutes from './routes/validation.routes';
import peerValidationRoutes from './routes/peerValidation.routes';
import goldenFAQRoutes from './routes/goldenFAQ.routes';
import notificationRoutes from './routes/notifications.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminRoutes from './routes/admin.routes';
import { connectDB } from './config/database';
import logger from './utils/logger.utils';

connectDB();

const app = express();

app.use(helmet());
// app.use(cors());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
// app.use(express.json());
app.use((req, res, next) => {
  if (req.is('multipart/form-data')) {
    return next(); 
  }
  return express.json()(req, res, next); 
});

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/validate', validationRoutes);
app.use('/api/peer-validate', peerValidationRoutes);
app.use('/api/golden-faq', goldenFAQRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  logger.info('Health check endpoint accessed');
  res.json({ status: 'healthy', timestamp: new Date() });
});
app.get('/', (req, res) => {
  logger.info('Root endpoint accessed');
  res.json({ message: 'KCC Review Workflow System API', version: '1.0.0', status: 'active' });
});

app.use(errorHandler);

export default app;
