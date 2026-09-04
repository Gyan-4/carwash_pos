import mongoose, { Schema } from 'mongoose';

const AuditLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  role: { type: String, enum: ['cashier', 'manager'], required: true },
  action: { type: String, required: true },
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
  transactionNo: { type: String },
  reason: { type: String, required: true, trim: true },
  previousStatus: { type: String },
  newStatus: { type: String },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ transactionId: 1, createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
