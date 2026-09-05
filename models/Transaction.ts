import mongoose, { Schema } from 'mongoose';

const TransactionSchema = new Schema({
  transactionNo: { type: String, required: true, unique: true },
  customerName: { type: String, default: '' },
  plate: { type: String, required: true, trim: true },
  vehicleType: { type: String, enum: ['motorcycle', 'sedan', 'suv', 'truck'], required: true },
  vehicleSize: { type: String, enum: ['small', 'medium', 'large', 'xl', 'xxl'] },
  services: [{ id: String, name: String, category: String, price: Number }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  promoId: { type: Schema.Types.ObjectId, ref: 'Promo' },
  promoName: { type: String, default: '' },
  promoType: { type: String, enum: ['percentage', 'fixed'] },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'gcash', 'card'], default: 'cash' },
  amountPaid: { type: Number, default: 0 },
  change: { type: Number, default: 0 },
  shiftId: { type: Schema.Types.ObjectId, ref: 'Shift' },
  status: { type: String, enum: ['completed', 'voided', 'deleted'], default: 'completed' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  voidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  voidedAt: { type: Date },
  voidReason: { type: String },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date },
  deleteReason: { type: String },
}, { timestamps: true });

TransactionSchema.index({ shiftId: 1, createdAt: -1 });

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
