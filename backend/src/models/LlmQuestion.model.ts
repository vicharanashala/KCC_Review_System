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
  isDone?:boolean;
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
  isDone:{type:Boolean,default:false},
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  KccAns: { type: String },
});

LLMQuestionSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

LLMQuestionSchema.post("save", async function (doc) {
    try {
      const users = await userModel.find();
      const moderator = await userModel
        .findOne({ role: "moderator", is_active: true, is_available: true })
        .sort({ workload_count: 1 })
        .exec();
      if (!moderator) {
        console.warn("No available moderator found for assignment");
        return;
      }

      await mongoose
        .model("LLMQuestion")
        .findByIdAndUpdate(
          doc._id,
          { assigned_moderator: moderator._id },
          { new: true }
        );

      await userModel.findByIdAndUpdate(moderator._id, {
        $inc: { workload_count: 1 },
      });

    } catch (err) {
      console.error("Error assigning moderator:", err);
    }
});

export default mongoose.model<ILLMQuestion>("LLMQuestion", LLMQuestionSchema);
