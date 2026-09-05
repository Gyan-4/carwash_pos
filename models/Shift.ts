import mongoose, { Schema } from 'mongoose';

const ShiftSchema = new Schema({
  cashierId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cashierName: { type: String, required: true, trim: true },
  openedAt: { type: Date, required: true, default: Date.now },
  openingCash: { type: Number, required: true, min: 0 },
  cashIn: { type: Number, default: 0, min: 0 },
  cashOut: { type: Number, default: 0, min: 0 },
  closedAt: { type: Date },
  actualCash: { type: Number, min: 0 },
  expectedCash: { type: Number, min: 0 },
  variance: { type: Number },
  status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  closingNote: { type: String, default: '', trim: true },
}, { timestamps: true });

ShiftSchema.index({ cashierId: 1, status: 1 });
ShiftSchema.index({ openedAt: -1 });

export const Shift = mongoose.models.Shift || mongoose.model('Shift', ShiftSchema);
