import mongoose, { Schema } from 'mongoose';

const TransactionSchema = new Schema({
  ticketNo: { type: String, required: true },
  plate: { type: String, required: true, uppercase: true },
  clientName: { type: String, default: 'Walk-in Client' },
  vehicleType: { type: String, required: true },
  serviceName: { type: String, required: true },
  addons: [{ type: String }],
  subtotal: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'gcash', 'maya', 'card'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const QueueSchema = new Schema({
  ticketNo: { type: String, required: true },
  plate: { type: String, required: true, uppercase: true },
  clientName: { type: String, default: 'Walk-in Client' },
  vehicle: { type: String, required: true },
  service: { type: String, required: true },
  status: { type: String, enum: ['waiting', 'washing', 'completed'], default: 'waiting' },
  washer: { type: String, default: 'Unassigned' },
  createdAt: { type: Date, default: Date.now }
});

const ClientSchema = new Schema({
  plate: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, default: 'Walk-in Client' },
  vehicle: { type: String },
  stamps: { type: Number, default: 1 },
  totalVisits: { type: Number, default: 1 },
  lastVisit: { type: Date, default: Date.now }
});

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
export const Queue = mongoose.models.Queue || mongoose.model('Queue', QueueSchema);
export const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema);