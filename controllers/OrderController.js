import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Product from '../models/Product.js'; // For stock management
import Coupon from '../models/Coupon.js';
import axios from 'axios';

export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { couponCode } = req.body;

    // Fetch cart and populate product details
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate total price
    let totalPrice = cart.items.reduce((sum, item) => 
      sum + item.productId.price * item.quantity, 0);

    // Apply coupon if provided
    let couponApplied = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon || coupon.expirationDate < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired coupon' });
      }
      // Optional: Check if coupon applies to any product in cart
      const sellerIds = [...new Set(cart.items.map(item => item.productId.sellerId.toString()))];
      if (!sellerIds.includes(coupon.sellerId.toString())) {
        return res.status(400).json({ message: 'Coupon not applicable to items in cart' });
      }
      const discount = (totalPrice * coupon.discount) / 100;
      totalPrice -= discount;
      couponApplied = coupon._id; // Matches schema
    }

    // Check user balance
    if (user.balance < totalPrice) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Check and update stock
    for (const item of cart.items) {
      const product = await Product.findById(item.productId._id);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product ? product.name : 'item'}` 
        });
      }
      product.stock -= item.quantity;
      await product.save();
    }

    // Create order items
    const orderItems = cart.items.map(item => ({
      productId: item.productId._id,
      quantity: item.quantity,
      price: item.productId.price,
    }));

    // Create and save order
    const order = new Order({
      userId,
      items: orderItems,
      totalPrice, // Matches schema
      couponApplied, // Matches schema
      status: 'pending', // Matches schema default
    });

    await order.save();
    user.balance -= totalPrice;
    await user.save();
    await Cart.findOneAndDelete({ userId });

    // Webhook notification (commented out, but kept for reference)
    // if (process.env.WEBHOOK_URL) {
    //   await axios.post(process.env.WEBHOOK_URL, {
    //     event: 'order_created',
    //     orderId: order._id,
    //     userId,
    //     totalPrice,
    //   }).catch(err => console.error('Webhook failed:', err.message));
    // }

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ userId })
      .populate('items.productId', 'name price')
      .populate('couponApplied', 'code discount');

    if (!orders || orders.length === 0) {
      return res.status(200).json({ message: 'No orders found', orders: [] });
    }

    res.status(200).json({ message: 'Orders retrieved successfully', orders });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};