import mongoose, { Schema } from "mongoose";
import { IQuestion } from "../interfaces/question.interface";
import { QuestionStatus } from "../interfaces/enums";
import { v4 as uuidv4 } from "uuid";
import userModel from "./user.model";

export interface ILLMQuestion {
  _id?: string;
  crop?: string;
  state?: string;
  district?: string;
  query_type?: string;
  season?: string;
  sector?: string;
  original_query_text: string;
  KccAns?: string;
  assigned_moderator?: string | mongoose.Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
}

const LLMQuestionSchema = new Schema<ILLMQuestion>({
  crop: { type: String },
  state: { type: String },
  district: { type: String },
  query_type: { type: String },
  season: { type: String },
  sector: { type: String },
  original_query_text: { type: String, required: true },
  assigned_moderator: { type: Schema.Types.ObjectId, ref: "User" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  KccAns: { type: String },
});

LLMQuestionSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

LLMQuestionSchema.post("save", async function (doc) {
  console.log("post mongo called", doc);
  // if (doc.isNew) {
    console.log("its new ");
    try {
      console.log("inside try");
      // Find the available moderator with least workload
      const users = await userModel.find();
      const moderator = await userModel
        .findOne({ role: "moderator", is_active: true, is_available: true })
        .sort({ workload_count: 1 })
        .exec();
      console.log("moderator ", moderator);
      if (!moderator) {
        console.warn("No available moderator found for assignment");
        return;
      }

      // Update the LLMQuestion with the assigned moderator
      // doc.assigned_moderator = moderator._id;
      // console.log("question assigned to ",doc.assigned_moderator)

      // await doc.save();
      // moderator.workload_count += 1;
      // await moderator.save();
      await mongoose
        .model("LLMQuestion")
        .findByIdAndUpdate(
          doc._id,
          { assigned_moderator: moderator._id },
          { new: true }
        );

      // Step 3: Update workload
      await userModel.findByIdAndUpdate(moderator._id, {
        $inc: { workload_count: 1 },
      });

      console.log(
        `Question ${doc._id} assigned to moderator ${moderator.name}`
      );
    } catch (err) {
      console.error("Error assigning moderator:", err);
    }
  // }
});

export default mongoose.model<ILLMQuestion>("LLMQuestion", LLMQuestionSchema);
