import mongoose, { Schema, model } from 'mongoose';

const orderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
});

const orderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalPrice: {
    type: Number,
    required: true, 
    min: 0,
  },
  couponApplied: {
    type: Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending',
  },
  
}, {timestamps: true});

export default mongoose.model('Order', orderSchema);