const Cart = require('../models/Cart');

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user_id: req.user._id }).populate('items.product_id', 'name price image_urls stock_quantity');
    if (!cart) {
      cart = await Cart.create({ user_id: req.user._id, items: [] });
    }
    res.json(cart);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.addItemToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    let cart = await Cart.findOne({ user_id: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user_id: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product_id.toString() === product_id);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += parseInt(quantity || 1);
    } else {
      cart.items.push({ product_id, quantity: parseInt(quantity || 1) });
    }

    await cart.save();
    const populated = await cart.populate('items.product_id', 'name price image_urls stock_quantity');
    res.json(populated);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.removeItemFromCart = async (req, res) => {
  try {
    const { product_id } = req.body;
    let cart = await Cart.findOne({ user_id: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.product_id.toString() !== product_id);
    await cart.save();

    const populated = await cart.populate('items.product_id', 'name price image_urls stock_quantity');
    res.json(populated);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user_id: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared successfully', cart });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
