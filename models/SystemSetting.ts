import mongoose, { Schema } from 'mongoose';

const SystemSettingSchema = new Schema({
  key: { type: String, required: true, unique: true, trim: true },
  storeName: { type: String, default: 'Car Wash POS' },
  address: { type: String, default: '' },
  contactNumber: { type: String, default: '' },
  receiptFooter: { type: String, default: 'Thank you for choosing us!' },
  stampsRequired: { type: Number, default: 11, min: 1 },
  riderDiscountPercent: { type: Number, default: 20, min: 0, max: 100 },
  paymentMethods: {
    cash: { type: Boolean, default: true },
    gcash: { type: Boolean, default: true },
    card: { type: Boolean, default: true },
  },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const SystemSetting = mongoose.models.SystemSetting || mongoose.model('SystemSetting', SystemSettingSchema);
