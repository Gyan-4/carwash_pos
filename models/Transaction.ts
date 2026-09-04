import mongoose, { Schema } from 'mongoose';

const TransactionSchema = new Schema({
  transactionNo: { type: String, required: true, unique: true },
  customerName: { type: String, default: '' },
  plate: { type: String, required: true, trim: true },
  vehicleType: { type: String, enum: ['motorcycle', 'sedan', 'suv', 'truck'], required: true },
  vehicleSize: { type: String, enum: ['small', 'medium', 'large', 'xl', 'xxl'] },
  services: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['completed', 'voided', 'deleted'], default: 'completed' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  voidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  voidedAt: { type: Date },
  voidReason: { type: String },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date },
  deleteReason: { type: String },
}, { timestamps: true });

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
