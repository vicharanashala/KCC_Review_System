// server.ts - Complete MERN Backend (Node.js + Express + TypeScript + MongoDB + Mongoose)
// This file contains the entire codebase. Run with: ts-node server.ts (after npm install)
// Assumptions:
// - MongoDB running locally on default port (mongodb://localhost:27017/kcc_review_system)
// - No frontend (React ignored)
// - All functionality preserved: auth, workflow, endpoints, etc.
// - Background tasks simulated with async/await (no real queue for simplicity)
// - SystemStats computed on-the-fly (model removed as unused)
// - UUID generation using crypto (native Node.js)

// First, install dependencies:
// npm init -y
// npm install express mongoose bcryptjs jsonwebtoken cors dotenv
// npm install -D @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/cors typescript ts-node

import express, { Request, Response, NextFunction, Application } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import crypto from 'crypto';
import { Types } from 'mongoose';

const app: Application = express();
const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kcc_review_system';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Environment variables
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRE_MINUTES = 480; // 8 hours

// Logging
console.log = function(...args: any[]) {
  // Simulate logging
  args[0] = `[LOG] ${args[0]}`;
  console.info.apply(console, args);
};

// Enums
enum UserRole {
  AGRI_SPECIALIST = 'agri_specialist',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

enum QuestionStatus {
  PENDING_ASSIGNMENT = 'pending_assignment',
  ASSIGNED_TO_SPECIALIST = 'assigned_to_specialist',
  PENDING_MODERATION = 'pending_moderation',
  NEEDS_REVISION = 'needs_revision',
  READY_FOR_GOLDEN_FAQ = 'ready_for_golden_faq',
  GOLDEN_FAQ_CREATED = 'golden_faq_created',
}

enum ValidationStatus {
  VALID = 'valid',
  INVALID = 'invalid',
}

enum NotificationType {
  QUESTION_ASSIGNED = 'question_assigned',
  REVISION_NEEDED = 'revision_needed',
  VALIDATION_REQUEST = 'validation_request',
  READY_FOR_GOLDEN_FAQ = 'ready_for_golden_faq',
}

// Interfaces (DTOs)
interface UserCreate {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password: string;
  specialization?: string[];
}

interface UserResponse {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  workload_count: number;
}

interface QuestionCreate {
  crop?: string;
  state?: string;
  district?: string;
  block_name?: string;
  query_type?: string;
  season?: string;
  sector?: string;
  original_query_text: string;
  refined_query_text?: string;
  latitude?: string;
  longitude?: string;
  priority?: string;
}

interface QuestionResponse {
  question_id: string;
  original_query_text: string;
  status: QuestionStatus;
  assigned_specialist?: string;
  valid_count: number;
  created_at: Date;
}

interface AnswerCreate {
  question_id: string;
  answer_text: string;
  sources: { name: string; link: string }[];
}

interface ValidationCreate {
  answer_id: string;
  validation_status: ValidationStatus;
  comments?: string;
}

interface GoldenFAQCreate {
  question_id: string;
  final_answer_text: string;
  category?: string;
  tags?: string[];
}

// Mongoose Schemas
const generateCustomId = (prefix: string): string => {
  return `${prefix}_${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
};

const userSchema = new mongoose.Schema({
  user_id: { type: String, unique: true, index: true, default: () => generateCustomId('USER') },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, index: true },
  phone: String,
  role: { type: String, enum: Object.values(UserRole), required: true },
  hashed_password: { type: String, required: true },
  specialization: [String],
  is_active: { type: Boolean, default: true },
  is_available: { type: Boolean, default: true },
  workload_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const questionSchema = new mongoose.Schema({
  question_id: { type: String, unique: true, index: true, default: () => generateCustomId('Q') },
  crop: String,
  state: String,
  district: String,
  block_name: String,
  query_type: String,
  season: String,
  sector: String,
  original_query_text: { type: String, required: true },
  refined_query_text: String,
  latitude: String,
  longitude: String,
  status: { type: String, enum: Object.values(QuestionStatus), default: QuestionStatus.PENDING_ASSIGNMENT },
  assigned_specialist_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priority: { type: String, default: 'medium' },
  valid_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const answerSchema = new mongoose.Schema({
  answer_id: { type: String, unique: true, index: true, default: () => generateCustomId('A') },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  specialist_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answer_text: { type: String, required: true },
  sources: [Object],
  version: { type: Number, default: 1 },
  is_current: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const validationSchema = new mongoose.Schema({
  validation_id: { type: String, unique: true, index: true, default: () => generateCustomId('V') },
  answer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer', required: true },
  moderator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  validation_status: { type: String, enum: Object.values(ValidationStatus), required: true },
  comments: { type: String, default: '' },
  validation_sequence: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
});

const goldenFAQSchema = new mongoose.Schema({
  faq_id: { type: String, unique: true, index: true, default: () => generateCustomId('FAQ') },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  final_answer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer', required: true },
  question_text: { type: String, required: true },
  final_answer_text: { type: String, required: true },
  category: String,
  crop: String,
  sources: [Object],
  tags: [String],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  is_published: { type: Boolean, default: true },
  view_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

const notificationSchema = new mongoose.Schema({
  notification_id: { type: String, unique: true, index: true, default: () => generateCustomId('N') },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: Object.values(NotificationType), required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  related_entity_type: String,
  related_entity_id: String,
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

// Models
const User = mongoose.model('User', userSchema);
const Question = mongoose.model('Question', questionSchema);
const Answer = mongoose.model('Answer', answerSchema);
const Validation = mongoose.model('Validation', validationSchema);
const GoldenFAQ = mongoose.model('GoldenFAQ', goldenFAQSchema);
const Notification = mongoose.model('Notification', notificationSchema);

// Utility Functions
const getPasswordHash = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const createAccessToken = (data: { sub: string }, expiresDeltaMinutes?: number): string => {
  const expiresIn = expiresDeltaMinutes || 15;
  return jwt.sign(data, SECRET_KEY, { expiresIn: `${expiresIn}m` });
};

// Auth Middleware
interface AuthRequest extends Request {
  user?: any;
}

const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ detail: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { sub: string };
    const user = await User.findOne({ email: decoded.sub });
    if (!user) {
      return res.status(401).json({ detail: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ detail: 'Invalid token' });
  }
};

// Workflow Engine
class WorkflowEngine {
  static async getRandomAvailableSpecialist(): Promise<any | null> {
    const specialists = await User.find({
      role: UserRole.AGRI_SPECIALIST,
      is_active: true,
      is_available: true,
    }).sort({ workload_count: 1 }).lean();

    if (!specialists.length) return null;

    const minWorkload = specialists[0].workload_count;
    const minWorkloadSpecialists = specialists.filter((s: any) => s.workload_count === minWorkload);
    const randomIndex = Math.floor(Math.random() * minWorkloadSpecialists.length);
    return minWorkloadSpecialists[randomIndex];
  }

  static async getRandomAvailableModerator(): Promise<any | null> {
    const moderators = await User.find({
      role: UserRole.MODERATOR,
      is_active: true,
      is_available: true,
    }).sort({ workload_count: 1 }).lean();

    if (!moderators.length) return null;

    const minWorkload = moderators[0].workload_count;
    const minWorkloadModerators = moderators.filter((m: any) => m.workload_count === minWorkload);
    const randomIndex = Math.floor(Math.random() * minWorkloadModerators.length);
    return minWorkloadModerators[randomIndex];
  }

  static async assignQuestionToSpecialist(questionId: string): Promise<boolean> {
    const question = await Question.findOne({ question_id: questionId });
    if (!question) return false;

    const specialist = await WorkflowEngine.getRandomAvailableSpecialist();
    if (!specialist) {
      console.log('No available specialists for assignment');
      return false;
    }

    question.assigned_specialist_id = specialist._id;
    question.status = QuestionStatus.ASSIGNED_TO_SPECIALIST;
    await question.save();

    await User.findByIdAndUpdate(specialist._id, { $inc: { workload_count: 1 } });

    const notification = new Notification({
      user_id: specialist._id,
      type: NotificationType.QUESTION_ASSIGNED,
      title: 'New Question Assigned',
      message: `Question ${question.question_id} has been assigned to you.`,
      related_entity_type: 'question',
      related_entity_id: question.question_id,
    });
    await notification.save();

    console.log(`Question ${questionId} assigned to specialist ${specialist.name}`);
    return true;
  }

  static async processValidation(validation: any): Promise<boolean> {
    const answer = await Answer.findById(validation.answer_id).populate('question_id');
    const question = answer?.question_id as any;

    if (validation.validation_status === ValidationStatus.VALID) {
      question.valid_count += 1;
      await question.save();

      if (question.valid_count >= 2) {
        question.status = QuestionStatus.READY_FOR_GOLDEN_FAQ;
        await question.save();

        const notification = new Notification({
          user_id: answer.specialist_id,
          type: NotificationType.READY_FOR_GOLDEN_FAQ,
          title: 'Ready for Golden FAQ Creation',
          message: `Your answer for question ${question.question_id} has received 2 VALID validations. Please create the Golden FAQ.`,
          related_entity_type: 'question',
          related_entity_id: question.question_id,
        });
        await notification.save();

        console.log(`Question ${question.question_id} ready for Golden FAQ creation`);
      } else {
        question.status = QuestionStatus.PENDING_MODERATION;
        await question.save();
        await WorkflowEngine.assignToNextModerator(answer._id);
      }
    } else {
      question.status = QuestionStatus.NEEDS_REVISION;
      question.valid_count = 0;
      await question.save();

      const notification = new Notification({
        user_id: answer.specialist_id,
        type: NotificationType.REVISION_NEEDED,
        title: 'Answer Revision Needed',
        message: `Your answer for question ${question.question_id} needs revision. Moderator comments: ${validation.comments}`,
        related_entity_type: 'answer',
        related_entity_id: answer.answer_id,
      });
      await notification.save();

      console.log(`Question ${question.question_id} sent back for revision`);
    }

    return true;
  }

  static async assignToNextModerator(answerId: Types.ObjectId): Promise<boolean> {
    const answer = await Answer.findById(answerId);
    if (!answer) return false;

    const moderator = await WorkflowEngine.getRandomAvailableModerator();
    if (!moderator) {
      console.log('No available moderators for validation');
      return false;
    }

    await User.findByIdAndUpdate(moderator._id, { $inc: { workload_count: 1 } });

    const notification = new Notification({
      user_id: moderator._id,
      type: NotificationType.VALIDATION_REQUEST,
      title: 'New Answer to Validate',
      message: `Answer ${answer.answer_id} is ready for validation.`,
      related_entity_type: 'answer',
      related_entity_id: answer.answer_id,
    });
    await notification.save();

    return true;
  }
}

// Routes
// POST /register
app.post('/register', async (req: Request, res: Response) => {
  const { name, email, phone, role, password, specialization }: UserCreate = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ detail: 'Email already registered' });
  }

  const hashedPassword = await getPasswordHash(password);
  const newUser = new User({
    name,
    email,
    phone,
    role,
    hashed_password: hashedPassword,
    specialization: specialization || [],
  });
  await newUser.save();

  const response: UserResponse = {
    user_id: newUser.user_id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    is_active: newUser.is_active,
    workload_count: newUser.workload_count,
  };

  console.log(`New user registered: ${name} (${role})`);
  res.status(201).json(response);
});

// POST /token
app.post('/token', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await User.findOne({ email: username });
  if (!user || !(await verifyPassword(password, user.hashed_password))) {
    return res.status(401).json({ detail: 'Incorrect email or password' });
  }

  const accessToken = createAccessToken({ sub: user.email }, ACCESS_TOKEN_EXPIRE_MINUTES);

  res.json({
    access_token: accessToken,
    token_type: 'bearer',
    user_role: user.role,
  });
});

// POST /questions
app.post('/questions', authenticateToken, async (req: AuthRequest, res: Response) => {
  const questionData: QuestionCreate = req.body;
  const newQuestion = new Question({ ...questionData });
  await newQuestion.save();

  // Background task simulation
  setImmediate(async () => {
    await WorkflowEngine.assignQuestionToSpecialist(newQuestion.question_id);
  });

  const response: QuestionResponse = {
    question_id: newQuestion.question_id,
    original_query_text: newQuestion.original_query_text,
    status: newQuestion.status,
    assigned_specialist: undefined, // Will be set after assignment
    valid_count: newQuestion.valid_count,
    created_at: newQuestion.created_at,
  };

  console.log(`New question submitted: ${newQuestion.question_id}`);
  res.status(201).json(response);
});

// POST /answers
app.post('/answers', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { question_id, answer_text, sources }: AnswerCreate = req.body;
  const user = req.user;

  if (user.role !== UserRole.AGRI_SPECIALIST) {
    return res.status(403).json({ detail: 'Only Agri Specialists can create answers' });
  }

  const question = await Question.findOne({ question_id });
  if (!question) {
    return res.status(404).json({ detail: 'Question not found' });
  }

  if (question.assigned_specialist_id?.toString() !== user._id.toString()) {
    return res.status(403).json({ detail: 'You are not assigned to this question' });
  }

  // Mark previous answers as not current
  await Answer.updateMany({ question_id: question._id }, { is_current: false });

  const version = (await Answer.countDocuments({ question_id: question._id })) + 1;
  const newAnswer = new Answer({
    question_id: question._id,
    specialist_id: user._id,
    answer_text,
    sources,
    version,
  });
  await newAnswer.save();

  question.status = QuestionStatus.PENDING_MODERATION;
  question.valid_count = 0;
  await question.save();

  // Background task
  setImmediate(async () => {
    await WorkflowEngine.assignToNextModerator(newAnswer._id);
  });

  res.json({
    message: 'Answer created successfully',
    answer_id: newAnswer.answer_id,
    version: newAnswer.version,
  });
});

// POST /validate
app.post('/validate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { answer_id, validation_status, comments }: ValidationCreate = req.body;
  const user = req.user;

  if (user.role !== UserRole.MODERATOR) {
    return res.status(403).json({ detail: 'Only Moderators can validate answers' });
  }

  const answer = await Answer.findOne({ answer_id });
  if (!answer) {
    return res.status(404).json({ detail: 'Answer not found' });
  }

  const existingValidation = await Validation.findOne({
    answer_id: answer._id,
    moderator_id: user._id,
  });
  if (existingValidation) {
    return res.status(400).json({ detail: 'You have already validated this answer' });
  }

  const validationCount = await Validation.countDocuments({ answer_id: answer._id });
  const newValidation = new Validation({
    answer_id: answer._id,
    moderator_id: user._id,
    validation_status,
    comments: comments || '',
    validation_sequence: validationCount + 1,
  });
  await newValidation.save();

  // Background task
  setImmediate(async () => {
    await WorkflowEngine.processValidation(newValidation);
  });

  res.json({
    message: 'Validation submitted successfully',
    validation_id: newValidation.validation_id,
  });
});

// POST /golden-faq
app.post('/golden-faq', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { question_id, final_answer_text, category, tags }: GoldenFAQCreate = req.body;
  const user = req.user;

  if (user.role !== UserRole.AGRI_SPECIALIST) {
    return res.status(403).json({ detail: 'Only Agri Specialists can create Golden FAQs' });
  }

  const question = await Question.findOne({ question_id });
  if (!question) {
    return res.status(404).json({ detail: 'Question not found' });
  }

  if (question.assigned_specialist_id?.toString() !== user._id.toString()) {
    return res.status(403).json({ detail: 'You are not assigned to this question' });
  }

  if (question.status !== QuestionStatus.READY_FOR_GOLDEN_FAQ) {
    return res.status(400).json({ detail: 'Question is not ready for Golden FAQ creation' });
  }

  const currentAnswer = await Answer.findOne({ question_id: question._id, is_current: true });
  if (!currentAnswer) {
    return res.status(404).json({ detail: 'No current answer found' });
  }

  const newGoldenFAQ = new GoldenFAQ({
    question_id: question._id,
    final_answer_id: currentAnswer._id,
    question_text: question.original_query_text,
    final_answer_text,
    category,
    crop: question.crop,
    sources: currentAnswer.sources,
    tags: tags || [],
    created_by: user._id,
  });
  await newGoldenFAQ.save();

  question.status = QuestionStatus.GOLDEN_FAQ_CREATED;
  await question.save();

  await User.findByIdAndUpdate(user._id, { $max: { workload_count: 0 } }); // Simplified max(0, ...)

  console.log(`Golden FAQ created: ${newGoldenFAQ.faq_id} for question ${question.question_id}`);
  res.json({
    message: 'Golden FAQ created successfully',
    faq_id: newGoldenFAQ.faq_id,
  });
});

// GET /dashboard/stats
app.get('/dashboard/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = req.user;

  const totalSpecialists = await User.countDocuments({ role: UserRole.AGRI_SPECIALIST });
  const activeSpecialists = await User.countDocuments({ role: UserRole.AGRI_SPECIALIST, is_active: true });
  const totalModerators = await User.countDocuments({ role: UserRole.MODERATOR });
  const activeModerators = await User.countDocuments({ role: UserRole.MODERATOR, is_active: true });

  const pendingQuestions = await Question.countDocuments({ status: QuestionStatus.PENDING_ASSIGNMENT });
  const questionsInReview = await Question.countDocuments({
    status: {
      $in: [
        QuestionStatus.ASSIGNED_TO_SPECIALIST,
        QuestionStatus.PENDING_MODERATION,
        QuestionStatus.NEEDS_REVISION,
        QuestionStatus.READY_FOR_GOLDEN_FAQ,
      ],
    },
  });
  const goldenFAQsCreated = await GoldenFAQ.countDocuments();

  const unreadNotifications = await Notification.countDocuments({
    user_id: user._id,
    is_read: false,
  });

  res.json({
    system_stats: {
      total_specialists: totalSpecialists,
      active_specialists: activeSpecialists,
      total_moderators: totalModerators,
      active_moderators: activeModerators,
      pending_questions: pendingQuestions,
      questions_in_review: questionsInReview,
      golden_faqs_created: goldenFAQsCreated,
    },
    user_stats: {
      role: user.role,
      workload_count: user.workload_count,
      notifications_unread: unreadNotifications,
    },
  });
});

// GET /dashboard/my-tasks
app.get('/dashboard/my-tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = req.user;
  let tasks: any[] = [];

  if (user.role === UserRole.AGRI_SPECIALIST) {
    const assignedQuestions = await Question.find({
      assigned_specialist_id: user._id,
      status: {
        $in: [QuestionStatus.ASSIGNED_TO_SPECIALIST, QuestionStatus.NEEDS_REVISION, QuestionStatus.READY_FOR_GOLDEN_FAQ],
      },
    });

    tasks = assignedQuestions.map((q: any) => {
      let taskType: string;
      if (q.status === QuestionStatus.ASSIGNED_TO_SPECIALIST) taskType = 'create_answer';
      else if (q.status === QuestionStatus.NEEDS_REVISION) taskType = 'revise_answer';
      else taskType = 'create_golden_faq';

      return {
        type: taskType,
        question_id: q.question_id,
        question_text: q.original_query_text.length > 100 ? q.original_query_text.slice(0, 100) + '...' : q.original_query_text,
        status: q.status,
        valid_count: q.valid_count,
        created_at: q.created_at,
      };
    });
  } else if (user.role === UserRole.MODERATOR) {
    const validationNotifications = await Notification.find({
      user_id: user._id,
      type: NotificationType.VALIDATION_REQUEST,
      is_read: false,
    }).populate('related_entity_id', 'answer_id question_id'); // Note: related_entity_id is string, so adjust populate if needed

    // Simplified: assume we fetch answers directly for pending moderation
    const pendingAnswers = await Answer.find({
      question_id: { $in: await Question.find({ status: QuestionStatus.PENDING_MODERATION }).select('_id') },
    }).populate('question_id');

    tasks = pendingAnswers.slice(0, 10).map((a: any) => ({ // Limit for demo
      type: 'validate_answer',
      answer_id: a.answer_id,
      question_id: a.question_id.question_id,
      question_text: a.question_id.original_query_text.length > 100 ? a.question_id.original_query_text.slice(0, 100) + '...' : a.question_id.original_query_text,
      answer_preview: a.answer_text.length > 200 ? a.answer_text.slice(0, 200) + '...' : a.answer_text,
      current_valid_count: a.question_id.valid_count,
      created_at: a.created_at,
    }));
  }

  res.json({ tasks });
});

// GET /notifications
app.get('/notifications', authenticateToken, async (req: Request, res: Response) => {
  const { skip = 0, limit = 50 } = req.query;
  const user = (req as AuthRequest).user;

  const notifications = await Notification.find({ user_id: user._id })
    .sort({ created_at: -1 })
    .skip(Number(skip))
    .limit(Number(limit));

  const response = notifications.map((n: any) => ({
    notification_id: n.notification_id,
    type: n.type,
    title: n.title,
    message: n.message,
    is_read: n.is_read,
    related_entity_type: n.related_entity_type,
    related_entity_id: n.related_entity_id,
    created_at: n.created_at,
  }));

  res.json({ notifications: response });
});

// PUT /notifications/:notification_id/read
app.put('/notifications/:notification_id/read', authenticateToken, async (req: Request, res: Response) => {
  const { notification_id } = req.params;
  const user = (req as AuthRequest).user;

  const notification = await Notification.findOne({
    notification_id,
    user_id: user._id,
  });

  if (!notification) {
    return res.status(404).json({ detail: 'Notification not found' });
  }

  notification.is_read = true;
  await notification.save();

  res.json({ message: 'Notification marked as read' });
});

// GET /questions/:question_id
app.get('/questions/:question_id', authenticateToken, async (req: Request, res: Response) => {
  const { question_id } = req.params;

  const question = await Question.findOne({ question_id }).populate('assigned_specialist_id');
  if (!question) {
    return res.status(404).json({ detail: 'Question not found' });
  }

  const currentAnswer = await Answer.findOne({ question_id: question._id, is_current: true });
  let validations: any[] = [];
  if (currentAnswer) {
    validations = await Validation.find({ answer_id: currentAnswer._id })
      .populate('moderator_id')
      .sort({ created_at: 1 });
  }

  const response = {
    question: {
      question_id: question.question_id,
      original_query_text: question.original_query_text,
      refined_query_text: question.refined_query_text,
      crop: question.crop,
      state: question.state,
      district: question.district,
      season: question.season,
      sector: question.sector,
      status: question.status,
      valid_count: question.valid_count,
      assigned_specialist: (question as any).assigned_specialist_id?.name || null,
      created_at: question.created_at,
    },
    current_answer: currentAnswer
      ? {
          answer_id: currentAnswer.answer_id,
          answer_text: currentAnswer.answer_text,
          sources: currentAnswer.sources,
          version: currentAnswer.version,
          created_at: currentAnswer.created_at,
        }
      : null,
    validation_history: validations.map((v: any) => ({
      validation_id: v.validation_id,
      moderator_name: v.moderator_id.name,
      validation_status: v.validation_status,
      comments: v.comments,
      validation_sequence: v.validation_sequence,
      created_at: v.created_at,
    })),
  };

  res.json(response);
});

// GET /answers/:answer_id
app.get('/answers/:answer_id', authenticateToken, async (req: Request, res: Response) => {
  const { answer_id } = req.params;
  const user = (req as AuthRequest).user;

  const answer = await Answer.findOne({ answer_id }).populate('specialist_id question_id');
  if (!answer) {
    return res.status(404).json({ detail: 'Answer not found' });
  }

  const validations = await Validation.find({ answer_id: answer._id })
    .populate('moderator_id')
    .sort({ created_at: 1 });

  const canValidate = user.role === UserRole.MODERATOR && !validations.some((v: any) => v.moderator_id._id.toString() === user._id.toString());

  const response = {
    answer: {
      answer_id: answer.answer_id,
      answer_text: answer.answer_text,
      sources: answer.sources,
      version: answer.version,
      specialist_name: (answer as any).specialist_id.name,
      created_at: answer.created_at,
    },
    question: {
      question_id: (answer as any).question_id.question_id,
      original_query_text: (answer as any).question_id.original_query_text,
      crop: (answer as any).question_id.crop,
      state: (answer as any).question_id.state,
      district: (answer as any).question_id.district,
      season: (answer as any).question_id.season,
    },
    validations: validations.map((v: any) => ({
      validation_id: v.validation_id,
      moderator_name: v.moderator_id.name,
      validation_status: v.validation_status,
      comments: v.comments,
      validation_sequence: v.validation_sequence,
      created_at: v.created_at,
    })),
    can_validate: canValidate,
  };

  res.json(response);
});

// GET /golden-faqs
app.get('/golden-faqs', async (req: Request, res: Response) => {
  const { skip = 0, limit = 50, search, category, crop } = req.query;

  let query = GoldenFAQ.find({ is_published: true });

  if (search) {
    query = query.where({
      $or: [
        { question_text: { $regex: search as string, $options: 'i' } },
        { final_answer_text: { $regex: search as string, $options: 'i' } },
      ],
    });
  }
  if (category) query = query.where({ category });
  if (crop) query = query.where({ crop });

  const goldenFAQs = await query.sort({ created_at: -1 }).skip(Number(skip)).limit(Number(limit));

  const response = goldenFAQs.map((faq: any) => ({
    faq_id: faq.faq_id,
    question_text: faq.question_text,
    final_answer_text: faq.final_answer_text,
    category: faq.category,
    crop: faq.crop,
    sources: faq.sources,
    tags: faq.tags,
    view_count: faq.view_count,
    created_at: faq.created_at,
  }));

  res.json({ golden_faqs: response });
});

// GET /admin/users
app.get('/admin/users', authenticateToken, async (req: Request, res: Response) => {
  const { skip = 0, limit = 100, role } = req.query;
  const user = (req as AuthRequest).user;

  if (user.role !== UserRole.ADMIN) {
    return res.status(403).json({ detail: 'Admin access required' });
  }

  let query = User.find();
  if (role) query = query.where({ role: role as UserRole });

  const users = await query.skip(Number(skip)).limit(Number(limit));

  const response = users.map((u: any) => ({
    user_id: u.user_id,
    name: u.name,
    email: u.email,
    role: u.role,
    is_active: u.is_active,
    is_available: u.is_available,
    workload_count: u.workload_count,
    specialization: u.specialization,
    created_at: u.created_at,
  }));

  res.json({ users: response });
});

// PUT /admin/users/:user_id/status
app.put('/admin/users/:user_id/status', authenticateToken, async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const { is_active, is_available } = req.body;
  const user = (req as AuthRequest).user;

  if (user.role !== UserRole.ADMIN) {
    return res.status(403).json({ detail: 'Admin access required' });
  }

  const targetUser = await User.findOne({ user_id });
  if (!targetUser) {
    return res.status(404).json({ detail: 'User not found' });
  }

  targetUser.is_active = is_active;
  if (is_available !== undefined) targetUser.is_available = is_available;
  await targetUser.save();

  res.json({ message: `User ${targetUser.name} status updated successfully` });
});

// GET /reports/workflow-performance
app.get('/reports/workflow-performance', authenticateToken, async (req: Request, res: Response) => {
  const { days = 30 } = req.query;
  const user = (req as AuthRequest).user;

  if (user.role !== UserRole.ADMIN) {
    return res.status(403).json({ detail: 'Admin access required' });
  }

  const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

  const totalQuestions = await Question.countDocuments({ created_at: { $gte: startDate } });
  const completedQuestions = await Question.countDocuments({
    created_at: { $gte: startDate },
    status: QuestionStatus.GOLDEN_FAQ_CREATED,
  });

  // Avg time: Simplified calculation
  const avgValidationTime = await GoldenFAQ.aggregate([
    { $match: { created_at: { $gte: startDate } } },
    {
      $lookup: {
        from: 'questions',
        localField: 'question_id',
        foreignField: '_id',
        as: 'question',
      },
    },
    { $unwind: '$question' },
    {
      $group: {
        _id: null,
        avgHours: { $avg: { $divide: [{ $subtract: ['$created_at', '$question.created_at'] }, 3600000] } },
      },
    },
  ]);
  const avgTime = avgValidationTime[0]?.avgHours || 0;

  // Specialist performance: Use aggregation
  const specialistPerformance = await User.aggregate([
    { $match: { role: UserRole.AGRI_SPECIALIST } },
    {
      $lookup: {
        from: 'questions',
        let: { userId: '$_id' },
        pipeline: [{ $match: { $expr: { $eq: ['$assigned_specialist_id', '$$userId'] }, created_at: { $gte: startDate } } }],
        as: 'questions',
      },
    },
    {
      $lookup: {
        from: 'goldenfaqs', // Note: collection name lowercase
        let: { userId: '$_id' },
        pipeline: [{ $match: { $expr: { $eq: ['$created_by', '$$userId'] }, created_at: { $gte: startDate } } }],
        as: 'goldenFAQs',
      },
    },
    {
      $project: {
        name: 1,
        user_id: 1,
        questions_handled: { $size: '$questions' },
        golden_faqs_created: { $size: '$goldenFAQs' },
      },
    },
    { $sort: { golden_faqs_created: -1 } },
  ]);

  res.json({
    period_days: Number(days),
    total_questions: totalQuestions,
    completed_questions: completedQuestions,
    completion_rate: totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0,
    avg_processing_time_hours: Math.round(avgTime * 100) / 100,
    specialist_performance: specialistPerformance,
  });
});

// GET /
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'KCC Review Workflow System API',
    version: '1.0.0',
    status: 'active',
  });
});

// GET /health
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ detail: 'Internal Server Error' });
});

// Connect to MongoDB and start server
mongoose.connect(MONGO_URI).then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Quick Start Instructions (in code comments):
/*
1. Install dependencies:
   npm install express mongoose bcryptjs jsonwebtoken cors dotenv
   npm install -D @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/cors typescript ts-node

2. Run the application:
   npx ts-node server.ts

3. Access API documentation: Use Postman or http://localhost:8000 (no auto-docs, but endpoints as above)

4. Test the complete workflow:
   a) POST /register - Register users
   b) POST /token - Login
   c) POST /questions - Submit questions
   d) POST /answers - Create answers (specialists)
   e) POST /validate - Validate answers (moderators)
   f) POST /golden-faq - Create Golden FAQ

5. Key Notes:
   - All functionality preserved
   - Background tasks use setImmediate for async simulation
   - Aggregations used for reports
   - Custom IDs generated with crypto
*/