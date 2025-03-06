import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Product from '../models/Product.js'; 
import Coupon from '../models/Coupon.js';

export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { couponCode } = req.body;

    
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

  
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    let totalPrice = cart.items.reduce((sum, item) => 
      sum + item.productId.price * item.quantity, 0);

  
    let couponApplied = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon || coupon.expirationDate < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired coupon' });
      }
    
      const sellerIds = [...new Set(cart.items.map(item => item.productId.sellerId.toString()))];
      if (!sellerIds.includes(coupon.sellerId.toString())) {
        return res.status(400).json({ message: 'Coupon not applicable to items in cart' });
      }
      const discount = (totalPrice * coupon.discount) / 100;
      totalPrice -= discount;
      couponApplied = coupon._id; 
    }

    
    if (user.balance < totalPrice) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

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

    const orderItems = cart.items.map(item => ({
      productId: item.productId._id,
      quantity: item.quantity,
      price: item.productId.price,
    }));

    const order = new Order({
      userId,
      items: orderItems,
      totalPrice,
      couponApplied, 
      status: 'complete', 
    });

    await order.save();
    user.balance -= totalPrice;
    await user.save();
    await Cart.findOneAndDelete({ userId });


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