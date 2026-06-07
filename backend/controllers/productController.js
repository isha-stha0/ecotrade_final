const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const { getFileUrl } = require('../utils/cloudinary');

exports.getAllProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const filter = { isActive: true };
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    let sortOpt = '-createdAt';
    if (sort === 'price-asc') sortOpt = 'price';
    if (sort === 'price-desc') sortOpt = '-price';
    if (sort === 'popular') sortOpt = '-sold';

    const products = await Product.find(filter).sort(sortOpt);
    res.json({ products, total: products.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getProductCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.find({ is_active: true });
    if (categories.length === 0) {
      return res.json([
        { name: 'Stationery' },
        { name: 'Bags' },
        { name: 'Home Decor' },
        { name: 'Office' },
        { name: 'Storage' },
        { name: 'Gardening' }
      ]);
    }
    res.json(categories);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getProductDetails = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, madeFrom, ecoImpact, source_material, product_category_id } = req.body;

    const urls = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        urls.push(getFileUrl(file, req));
      });
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price || 0),
      stock_quantity: parseInt(stock || 0),
      category: category || 'Other',
      madeFrom: madeFrom || '',
      ecoImpact: ecoImpact || '',
      source_material: source_material || 'other',
      product_category_id: product_category_id || null,
      image_urls: urls,
      created_by: req.user._id,
      status: 'published',
    });

    res.status(201).json(product);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, madeFrom, ecoImpact, source_material, product_category_id, isActive } = req.body;
    
    const update = {};
    if (name) update.name = name;
    if (description) update.description = description;
    if (price) update.price = parseFloat(price);
    if (stock) update.stock_quantity = parseInt(stock);
    if (category) update.category = category;
    if (madeFrom) update.madeFrom = madeFrom;
    if (ecoImpact) update.ecoImpact = ecoImpact;
    if (source_material) update.source_material = source_material;
    if (product_category_id) update.product_category_id = product_category_id;
    if (isActive !== undefined) update.isActive = isActive === 'true' || isActive === true;

    if (req.files && req.files.length > 0) {
      const urls = [];
      req.files.forEach(file => {
        urls.push(getFileUrl(file, req));
      });
      update.image_urls = urls;
    }

    const p = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
