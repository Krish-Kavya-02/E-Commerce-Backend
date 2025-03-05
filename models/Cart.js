import { Schema, model } from 'mongoose';

const cartItemSchema = new Schema({
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
});

const cartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  totalPrice: {
    type: Number,
    default: 0,
    min: 0,
  },

}, {timestamps: true});


export default model('Cart', cartSchema);