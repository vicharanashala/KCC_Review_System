import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const subscriptionSchema = new Schema<ISubscription>({
  userId: { type: String, required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: String,
    auth: String,
  },
});

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
