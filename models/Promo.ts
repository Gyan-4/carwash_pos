import mongoose, { Schema } from 'mongoose';

const PromoSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  eligibleVehicleTypes: [{ type: String, enum: ['motorcycle', 'sedan', 'suv', 'truck'] }],
  eligibleVehicleSizes: [{ type: String, enum: ['small', 'medium', 'large', 'xl', 'xxl'] }],
  eligibleServiceIds: [{ type: String }],
  eligibleCategories: [{ type: String }],
  eligiblePlatforms: [{ type: String }],
  requiresVerification: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const Promo = mongoose.models.Promo || mongoose.model('Promo', PromoSchema);
