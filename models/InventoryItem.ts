import mongoose, { Schema } from 'mongoose';

const InventoryUsageSchema = new Schema({
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
}, { _id: false });

const InventoryItemSchema = new Schema({
  name: { type: String, required: true, trim: true },
  unit: { type: String, required: true, trim: true, default: 'pcs' },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  lowStockThreshold: { type: Number, min: 0, default: 0 },
  costPerUnit: { type: Number, min: 0, default: 0 },
  active: { type: Boolean, default: true },
  usage: { type: [InventoryUsageSchema], default: [] },
}, { timestamps: true });

InventoryItemSchema.index({ name: 1 }, { unique: true });

export const InventoryItem = mongoose.models.InventoryItem || mongoose.model('InventoryItem', InventoryItemSchema);
