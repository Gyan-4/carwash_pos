import mongoose, { Schema } from 'mongoose';

const InventoryMovementSchema = new Schema({
  itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  itemName: { type: String, required: true },
  type: { type: String, enum: ['sale', 'restock', 'adjustment', 'void', 'restore'], required: true },
  quantity: { type: Number, required: true },
  beforeQuantity: { type: Number, required: true },
  afterQuantity: { type: Number, required: true },
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
  transactionNo: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, default: '' },
}, { timestamps: true });

InventoryMovementSchema.index({ createdAt: -1 });
InventoryMovementSchema.index({ itemId: 1, createdAt: -1 });

export const InventoryMovement = mongoose.models.InventoryMovement || mongoose.model('InventoryMovement', InventoryMovementSchema);
