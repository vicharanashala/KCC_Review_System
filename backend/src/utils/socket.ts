import { Server } from 'socket.io';
import Notification from '../models/notification.model';
import Validation from '../models/validation.model';
import PeerValidation from '../models/peerValidation.model';
import Question from '../models/question.model';
import Answer from '../models/answer.model';
import GoldenFAQ from '../models/goldenFAQ.model';
import SystemStats from '../models/systemStats.model';
import userModel from '../models/user.model';
import logger from '../utils/logger.utils';
/**
 * Setup all MongoDB change streams and Socket.IO real-time events.
 */
export default function setupSocket(io: Server) {
  io.on('connection', (socket) => {
    //console.log(`🟢 Connected: ${socket.id}`);
    logger.info(`Connected: ${socket.id}`)
    socket.on('register', (userId: string) => {
      socket.join(userId);
      logger.info(` User ${userId} joined private room`)
      //console.log(`👤 User ${userId} joined private room`);
    });

    socket.on('disconnect', () => {
     // console.log(`🔴 Disconnected: ${socket.id}`);
      logger.info(`Disconnected: ${socket.id}`)
    });
  });

  // ⚡ Utility function to handle and emit change events
  const handleChange = (collection: string, change: any, roomId?: string) => {
    const { operationType, fullDocument, documentKey } = change;

    switch (operationType) {
      case 'insert':
        //io.to('68d377d46e1851cb375d4451').emit('notification:insert', fullDocument)
        io.emit(`${collection}:insert`, fullDocument);
        if (roomId) io.to(roomId).emit(`${collection}:insert`, fullDocument);
        console.log(`🟢 [${collection}] Inserted: ${documentKey._id} and User:${roomId}`);
        break;

      case 'update':
        io.emit(`${collection}:update`, fullDocument);
        if (roomId) io.to(roomId).emit(`${collection}:update`, fullDocument);
        console.log(`🟡 [${collection}] Updated: ${documentKey._id}`);
        break;

      case 'replace':
        io.emit(`${collection}:replace`, fullDocument);
        if (roomId) io.to(roomId).emit(`${collection}:replace`, fullDocument);
        console.log(`🟠 [${collection}] Replaced: ${documentKey._id}`);
        break;

      case 'delete':
        io.emit(`${collection}:delete`, documentKey);
        if (roomId) io.to(roomId).emit(`${collection}:delete`, documentKey);
        console.log(`🔴 [${collection}] Deleted: ${documentKey._id}`);
        break;

      case 'invalidate':
        console.warn(`⚠️ [${collection}] Change stream invalidated — reconnecting may be required.`);
        break;

      default:
        console.log(`ℹ️ [${collection}] Unknown operation: ${operationType}`);
    }
  };

  // 📨 --- Notifications ---
  Notification.watch([], { fullDocument: 'updateLookup' }).on('change', (change) => {
    const doc = change.fullDocument;
    if (change.operationType === 'insert' || change.operationType === 'update')
    {
     // check if the task has been assigned to a user
     if (doc?.user_id) {
     // const roomId = doc.user_id.toString();
       const roomId = doc.user_id.toString();
       // emit task assignment notification
       io.to(roomId).emit("notification:insert", {
         title: "New Notification Cretaed",
         message: `New Task is Added To You`,
         type: "task_assigned",
         created_at: new Date(),
         user_id: roomId,
       });
 
      // console.log(`📩 Notification assigned to user ${roomId}`);
     }
   }
  });
  userModel.watch([], { fullDocument: 'updateLookup' }).on('change', (change) => {
    const doc = change.fullDocument;
    if (change.operationType === 'insert' || change.operationType === 'update')
     {
      // check if the task has been assigned to a user
      if (doc?._id) {
        const roomId = doc._id.toString();
  
        // emit task assignment notification
        io.to(roomId).emit("notification:insert", {
          title: "Incentives or Penalities updated",
          message: `New Task is Added To You`,
          type: "task_assigned",
          created_at: new Date(),
          user_id: roomId,
        });
  
       // console.log(`📩 Question assigned to user ${doc._id}`);
      }
    }
  });

  // 🧾 --- Question ---
  Question.watch([], { fullDocument: 'updateLookup' }).on('change', (change) => {
    const doc = change.fullDocument;
    if (change.operationType === 'insert' || change.operationType === 'update')
     {
      // check if the task has been assigned to a user
      if (doc?.assigned_to) {
        const roomId = doc.assigned_specialist_id.toString();
  
        // emit task assignment notification
        io.to(roomId).emit("notification:insert", {
          title: "New Question Assigned",
          message: `New Task is Added To You`,
          type: "task_assigned",
          created_at: new Date(),
          user_id: roomId,
        });
  
       // console.log(`📩 Question assigned to user ${doc.assigned_specialist_id}`);
      }
    }
  });

  // 👥 --- Peer Validations ---
  PeerValidation.watch([], { fullDocument: 'updateLookup' }).on('change', (change) => {
    const doc = change.fullDocument;
    if (change.operationType === 'insert' || change.operationType === 'update')
    {
     // check if the task has been assigned to a user
     if (doc?.reviewer_id) {
       const roomId = doc.reviewer_id.toString();
 
       // emit task assignment notification
       io.to(roomId).emit("notification:insert", {
         title: "Answer Validation Assigned",
         message: `New Task is Added To You`,
         type: "task_assigned",
         created_at: new Date(),
         user_id: roomId,
       });
 
      // console.log(`📩 Question assigned to user ${roomId}`);
     }
   }
  });

  // 🧠 --- Answers ---
  Answer.watch([], { fullDocument: 'updateLookup' }).on('change', (change) => {
    const doc = change.fullDocument;
    if (change.operationType === 'insert' || change.operationType === 'update')
    {
     // check if the task has been assigned to a user
     if (doc?.specialist_id) {
       const roomId = doc.specialist_id.toString();
 
       // emit task assignment notification
       io.to(roomId).emit("notification:insert", {
         title: " Answer Validation Assigned",
         message: `New Task is Added To You`,
         type: "task_assigned",
         created_at: new Date(),
         user_id: roomId,
       });
 
       //console.log(`📩 Answer Validation assigned to user ${roomId}`);
     }
   }
  });

  // ❓ --- Validation ---
  Validation.watch([], { fullDocument: 'updateLookup' }).on('change', (change) => {
    const doc = change.fullDocument;
    if (change.operationType === 'insert' || change.operationType === 'update') {
      // check if the task has been assigned to a user
      if (doc?.moderator_id) {
        const roomId = doc.moderator_id.toString();
  
        // emit task assignment notification
        io.to(roomId).emit("notification:insert", {
          title: "Final Review Assigned",
          message: `New Task is Added To You`,
          type: "task_assigned",
          created_at: new Date(),
          user_id: roomId,
        });
  
        //console.log(`📩 Final Review Assigned to user ${roomId}`);
      }
    }
  });

  // 🏆 --- Golden FAQ ---
  GoldenFAQ.watch([], { fullDocument: 'updateLookup' }).on('change', (change) => {
    const doc = change.fullDocument;
    if (change.operationType === 'insert' || change.operationType === 'update')
    {
     // check if the task has been assigned to a user
     if (doc?.assigned_to) {
       const roomId = doc.final_answer_id.toString();
 
       // emit task assignment notification
       io.to(roomId).emit("notification:insert", {
         title: "New Task Assigned",
         message: `New Task is Added To You`,
         type: "task_assigned",
         created_at: new Date(),
         user_id: roomId,
       });
 
      // console.log(`📩 Task assigned to user ${roomId}`);
     }
   }
  });

  // 📊 --- System Stats ---
  SystemStats.watch([], { fullDocument: 'updateLookup' }).on('change', (change) => {
    const doc = change.fullDocument;
    if (change.operationType === 'insert' || change.operationType === 'update')
    {
     // check if the task has been assigned to a user
     if (doc?.assigned_to) {
       const roomId = doc.assigned_specialist_id.toString();
 
       // emit task assignment notification
       io.to(roomId).emit("notification:insert", {
         title: "New Question Assigned",
         message: `New Task is Added To You`,
         type: "task_assigned",
         created_at: new Date(),
         user_id: roomId,
       });
 
       //console.log(`📩 Question assigned to user ${roomId}`);
     }
   }
  });

  console.log('⚡ Socket.IO + MongoDB change streams initialized successfully.');
}
