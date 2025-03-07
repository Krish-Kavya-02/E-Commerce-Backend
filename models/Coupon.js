import { Schema, model } from 'mongoose';

const couponSchema = new Schema({
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  expirationDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});


couponSchema.pre('save', function (next) {
  if (this.expirationDate < Date.now()) {
    this.isActive = false;
  }
  next();
});

export default model('Coupon', couponSchema);