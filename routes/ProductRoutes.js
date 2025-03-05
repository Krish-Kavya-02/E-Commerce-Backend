import express from 'express';
import { authMiddleware } from '../middlewares/AuthMiddleware.js';
import { restrictTo } from '../middlewares/Role.js';
import productController from '../controllers/ProductController.js';

const router = express.Router();


router.get('/getallproducts',authMiddleware, productController.getProducts);


router.post(
  '/create',
  authMiddleware,
  restrictTo('seller'),
  productController.createProduct
);

router.put('/update/:id', authMiddleware, restrictTo('seller'), productController.updateProduct);

router.delete(
  '/delete/:id',
  authMiddleware,
  restrictTo('seller'),
  productController.deleteProduct
);

export default router;