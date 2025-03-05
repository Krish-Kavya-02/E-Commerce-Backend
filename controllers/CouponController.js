import Coupon from '../models/Coupon.js';
import mongoose from 'mongoose';

export const createCoupon = async (req, res) => {
  try {
    const { code, discount, expirationDate } = req.body;
    const sellerId = req.user._id; // Get sellerId from JWT

    // Validate required fields (sellerId is now from JWT, so no need to check it here)
    if (!code || !discount || !expirationDate) {
      return res.status(400).json({ message: 'Code, discount, and expiration date are required' });
    }

    // Validate discount
    if (typeof discount !== 'number' || discount < 0 || discount > 100) {
      return res.status(400).json({ message: 'Discount must be a number between 0 and 100' });
    }

    // Validate expiration date
    const parsedDate = new Date(expirationDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid expiration date' });
    }

    const newCoupon = new Coupon({
      sellerId, // Automatically set from req.user._id
      code,
      discount,
      expirationDate: parsedDate,
    });

    const savedCoupon = await newCoupon.save();
    res.status(201).json({
      message: 'Coupon created successfully',
      coupon: savedCoupon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    res.status(500).json({ message: 'Error creating coupon', error: error.message });
  }
};

export const getActiveCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ 
      isActive: true,
      expirationDate: { $gte: Date.now() }
    })
      .populate('sellerId', 'username email')
      .sort({ expirationDate: 1 });

    res.status(200).json({
      message: coupons.length ? 'Active coupons retrieved' : 'No active coupons found',
      coupons,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons', error: error.message });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate('sellerId', 'username email')
      .sort({ expirationDate: 1 });

    res.status(200).json({
      message: coupons.length ? 'Coupons retrieved' : 'No coupons found',
      coupons,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons', error: error.message });
  }
};

export const getSellerCoupons = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: 'Invalid seller ID' });
    }

    if (sellerId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these coupons' });
    }

    const coupons = await Coupon.find({ sellerId })
      .populate('sellerId', 'username email')
      .sort({ expirationDate: 1 });

    res.status(200).json({
      message: coupons.length ? 'Seller coupons retrieved' : 'No coupons found for this seller',
      coupons,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seller coupons', error: error.message });
  }
};

export const verifyCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      expirationDate: { $gte: Date.now() }
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or expired coupon' });
    }

    res.status(200).json({
      message: 'Coupon is valid',
      coupon: {
        code: coupon.code,
        discount: coupon.discount,
        expirationDate: coupon.expirationDate,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying coupon', error: error.message });
  }
};