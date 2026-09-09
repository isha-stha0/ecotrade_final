const User = require('../models/User');
const Scrap = require('../models/Scrap');
const Product = require('../models/Product');
const Order = require('../models/Order');

exports.getUserDashboard = async (req, res) => {
  try {
    const [myScraps, myOrders, totalOrders] = await Promise.all([
      Scrap.find({ user_id: req.user._id }).sort('-createdAt').limit(5),
      Order.find({ user_id: req.user._id }).populate('items.product_id','name price').sort('-createdAt').limit(5),
      Order.countDocuments({ user_id: req.user._id }),
    ]);
    res.json({ user: req.user, myScraps, myOrders, totalOrders });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const [totalUsers, totalScraps, totalProducts, totalOrders, pendingScraps] = await Promise.all([
      User.countDocuments(), 
      Scrap.countDocuments(),
      Product.countDocuments({ isActive: true }), 
      Order.countDocuments(),
      Scrap.countDocuments({ status: 'pending' })
    ]);
    
    const recentScraps = await Scrap.find().populate('user_id','full_name').sort('-createdAt').limit(5);
    const recentOrders = await Order.find().populate('user_id','full_name').sort('-createdAt').limit(5);
    
    const scrapByCategory = await Scrap.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, quantity: { $sum: '$quantity_estimated' } } }
    ]);
    
    res.json({ 
      stats: { totalUsers, totalScraps, totalProducts, totalOrders, pendingScraps }, 
      recentScraps, 
      recentOrders, 
      scrapByCategory 
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
