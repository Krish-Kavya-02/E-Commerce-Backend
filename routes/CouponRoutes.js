import express from 'express';
import { authMiddleware } from '../middlewares/AuthMiddleware.js';
import { restrictTo } from '../middlewares/Role.js';
import { 
  createCoupon, 
  getActiveCoupons, 
  getAllCoupons, 
  getSellerCoupons, 
  verifyCoupon 
} from '../controllers/CouponController.js';

const router = express.Router();

// Create a coupon (seller only)
router.post(
  '/',
  authMiddleware,
  restrictTo('seller'),
  createCoupon
);

// Get all active coupons (public)
router.get(
  '/active',
  getActiveCoupons
);

// Get all coupons (admin only)
router.get(
  '/',
  authMiddleware,
  restrictTo('admin'),
  getAllCoupons
);

// Get coupons by seller (seller or admin)
router.get(
  '/seller/:sellerId',
  authMiddleware,
  getSellerCoupons
);

// Verify a coupon code (public)
router.get(
  '/verify/:code',
  authMiddleware,
  verifyCoupon
);

export default router;