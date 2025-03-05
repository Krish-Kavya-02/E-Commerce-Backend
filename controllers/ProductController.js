import Product from '../models/Product.js';


const getProducts = async (req, res) => {
    try {
      const { category, minPrice, maxPrice, search } = req.query;
  
      // Build query object
      const query = {};
      if (category) query.category = category;
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }
      if (search) query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
  
      const products = await Product.find(query).populate('sellerId', 'username email');
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create a product (seller only)
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    // Basic validation (Mongoose will handle required fields and enum)
    if (!name || !description || !price || !category || stock === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const product = new Product({
     
      name,
      description,
      price,
      category,
      sellerId: req.user._id,
      stock,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
};

// Update a product (seller only)
const updateProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      // Check if the requesting user is the seller
      if (product.sellerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this product' });
      }
  
      // Extract fields from request body
      const { name, description, price, category, stock } = req.body;
  
      // Update fields only if they are explicitly provided
      if (name !== undefined) product.name = name;
      if (description !== undefined) product.description = description;
      if (price !== undefined) product.price = price;
      if (stock !== undefined) product.stock = stock;
  
      // Handle category separately: only update if explicitly provided and valid
      if (category !== undefined) {
        if (!Array.isArray(category)) {
          return res.status(400).json({ message: 'Category must be an array of strings' });
        }
        // Validate each category against the enum
        const validCategories = ['electronics', 'apparel', 'cosmetics', 'footwear', 'toys', 'snacks', 'essentials'];
        const invalidCategories = category.filter(cat => !validCategories.includes(cat));
        if (invalidCategories.length > 0) {
          return res.status(400).json({
            message: `Invalid categories provided: ${invalidCategories.join(', ')}`,
          });
        }
        product.category = category;
      }
  
      await product.save();
      res.status(200).json(product);
    } catch (error) {
      res.status(400).json({ message: 'Invalid data', error: error.message });
    }
};

// Delete a product (seller only)
const deleteProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      if (product.sellerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this product' });
      }
  
      await product.deleteOne();
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

export default {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};