import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import axios from 'axios';
import mongoose from 'mongoose';

// Helper function to calculate total price
const calculateTotalPrice = async (items) => {
  const populatedItems = await Promise.all(
    items.map(async (item) => {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      return product.price * item.quantity;
    })
  );
  return populatedItems.reduce((sum, price) => sum + price, 0);
};

const sendWebhook = async (eventData) => {
    if (!process.env.WEBHOOK_URL) {
      console.warn('WEBHOOK_URL not set in environment variables');
      return;
    }
  
    try {
      await axios.post(process.env.WEBHOOK_URL, eventData, {
        timeout: 5000, // 5-second timeout to avoid hanging
        headers: { 'Content-Type': 'application/json' },
      });
      console.log(`Webhook sent: ${eventData.event}`);
    } catch (error) {
      console.error(`Webhook error for ${eventData.event}:`, error.message);
      // Non-blocking: Errors are logged but don’t affect the response
    }
  };

export const addToCart = async (req, res) => {
    try {
      const userId = req.user._id; // From JWT middleware
  
      const { productId, quantity } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(productId) || !quantity || quantity < 1) {
        return res.status(400).json({ message: 'Valid product ID and quantity (min 1) are required' });
      }
  
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${productId}` });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
  
      let cart = await Cart.findOne({ userId });
      if (!cart) {
        cart = new Cart({ userId, items: [], totalPrice: 0 });
      }
  
      const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        if (cart.items[itemIndex].quantity > product.stock) {
          return res.status(400).json({ message: 'Quantity exceeds available stock' });
        }
      } else {
        cart.items.push({ productId, quantity });
      }
  
      cart.totalPrice = await calculateTotalPrice(cart.items);
      await cart.save();

      await sendWebhook({
        event: 'cart_updated',
        userId: userId.toString(),
        cartId: cart._id.toString(),
        action: 'item_added',
        productId: productId.toString(),
        quantity,
        timestamp: Date.now(),
      });
  
      res.status(200).json({
        message: 'Item added to cart successfully',
        cart: { id: cart._id, items: cart.items, totalPrice: cart.totalPrice },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error adding to cart', error: error.message });
    }
  };

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId) || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Valid product ID and quantity (min 1) are required' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: `Product not found: ${productId}` });
    }
    if (quantity > product.stock) {
      return res.status(400).json({ message: 'Quantity exceeds available stock' });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.totalPrice = await calculateTotalPrice(cart.items);
    await cart.save();

    await sendWebhook({
        event: 'cart_updated',
        userId: userId.toString(),
        cartId: cart._id.toString(),
        action: 'quantity_updated',
        productId: productId.toString(),
        quantity,
        timestamp: Date.now(),
    });

    res.status(200).json({
      message: 'Cart item updated successfully',
      cart: { id: cart._id, items: cart.items, totalPrice: cart.totalPrice },
    });

    } catch (error) {
    res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1);
    cart.totalPrice = cart.items.length > 0 ? await calculateTotalPrice(cart.items) : 0;
    await cart.save();

    await sendWebhook({
      event: 'cart_updated',
      userId: userId.toString(),
      cartId: cart._id.toString(),
      action: 'item_removed',
      productId: productId.toString(),
      timestamp: Date.now(),
    });

    res.status(200).json({
      message: 'Item removed from cart successfully',
      cart: { id: cart._id, items: cart.items, totalPrice: cart.totalPrice },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error removing from cart', error: error.message });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ userId }).populate('items.productId', 'name price stock');

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        message: 'Cart is empty',
        cart: { id: null, items: [], totalPrice: 0, remainingBalance: 0 },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Cart retrieved successfully',
      cart: {
        id: cart._id,
        items: cart.items.map(item => ({
          product: item.productId
            ? { id: item.productId._id, name: item.productId.name, price: item.productId.price, stock: item.productId.stock }
            : null,
          quantity: item.quantity,
        })),
        totalPrice: cart.totalPrice,
        remainingBalance: user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOneAndDelete({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await sendWebhook({
        event: 'cart_cleared',
        userId: userId.toString(),
        cartId: cart._id.toString(),
        timestamp: Date.now(),
    });

    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
};