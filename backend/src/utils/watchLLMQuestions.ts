// // watchLLMQuestions.ts
// import mongoose from "mongoose";
// import axios from "axios";
// import LlmQuestionModel from "../models/LlmQuestion.model";

// export function watchLLMQuestions() {
//   const url= process.env.BACKEND_URL!
//   const changeStream = LlmQuestionModel.watch([], { fullDocument: "updateLookup" });

//   changeStream.on("change", async (change) => {
//     if (change.operationType === "insert") {
//       const newDoc = change.fullDocument;
//       console.log("📘 New LLMQuestion inserted:", newDoc._id);

//       try {
//         // Call your service here
//         await axios.post(`${url}/api/questions/llmService`, {
//           questionId: newDoc._id,
//           crop: newDoc.crop,
//           query: newDoc.original_query_text,
//         });
//         console.log("✅ Service called successfully for new question");
//       } catch (err) {
//         console.error("❌ Error calling service:", err.message);
//       }
//     }
//   });
// }
