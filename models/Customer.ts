import mongoose, { Schema } from 'mongoose';

const VehicleSchema = new Schema({
  plate: { type: String, required: true, trim: true, uppercase: true },
  vehicleType: { type: String, enum: ['motorcycle', 'sedan', 'suv', 'truck'], required: true },
  vehicleSize: { type: String, enum: ['small', 'medium', 'large', 'xl', 'xxl'] },
  visitCount: { type: Number, default: 0 },
  lastVisitAt: { type: Date },
}, { _id: false });

const CustomerSchema = new Schema({
  name: { type: String, required: true, trim: true },
  normalizedName: { type: String, required: true, index: true },
  vehicles: { type: [VehicleSchema], default: [] },
  totalVisits: { type: Number, default: 0 },
  lastVisitAt: { type: Date },
}, { timestamps: true });

CustomerSchema.index({ normalizedName: 1 });
CustomerSchema.index({ 'vehicles.plate': 1 });

export const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
