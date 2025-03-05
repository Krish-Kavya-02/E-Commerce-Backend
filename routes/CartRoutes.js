import express from 'express';
import { authMiddleware } from '../middlewares/AuthMiddleware.js';
import { restrictTo } from '../middlewares/Role.js';
import { 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  getCart, 
  clearCart 
} from '../controllers/CartController.js';

const router = express.Router();

// Add item to cart (buyer only)
router.post(
  '/',
  authMiddleware,
  restrictTo('buyer'),
  addToCart
);

// Update cart item quantity (buyer only)
router.put(
  '/item',
  authMiddleware,
  restrictTo('buyer'),
  updateCartItem
);

// Remove item from cart (buyer only)
router.delete(
  '/item/:productId',
  authMiddleware,
  restrictTo('buyer'),
  removeFromCart
);

// Get cart details (buyer only)
router.get(
  '/',
  authMiddleware,
  restrictTo('buyer'),
  getCart
);

// Clear cart (buyer only)
router.delete(
  '/',
  authMiddleware,
  restrictTo('buyer'),
  clearCart
);

export default router;