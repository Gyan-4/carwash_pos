import mongoose, { Schema } from 'mongoose';

const QueueSchema = new Schema({
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true, unique: true },
  transactionNo: { type: String, required: true, trim: true },
  plate: { type: String, required: true, trim: true, uppercase: true },
  customerName: { type: String, default: 'Walk-in Customer', trim: true },
  vehicleType: { type: String, enum: ['motorcycle', 'sedan', 'suv', 'truck'], required: true },
  vehicleSize: { type: String, enum: ['small', 'medium', 'large', 'xl', 'xxl'] },
  services: { type: [String], default: [] },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['waiting', 'washing', 'completed'], default: 'waiting', index: true },
  washer: { type: String, default: 'Unassigned', trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startedAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });

QueueSchema.index({ status: 1, createdAt: 1 });
QueueSchema.index({ plate: 1, createdAt: -1 });

export const Queue = mongoose.models.Queue || mongoose.model('Queue', QueueSchema);
