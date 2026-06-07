const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const RewardRedemption = require('../models/RewardRedemption');
const { sendEmail } = require('../utils/mailer');

exports.placeOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes, points_used, discount_amount } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in the order' });
    }

    if (points_used && points_used > 0) {
      if (req.user.reward_points < points_used) {
        return res.status(400).json({ message: `Insufficient reward points. You have ${req.user.reward_points} points.` });
      }
    }

    let subtotal_amount = 0;
    const resolvedItems = [];

    for (const item of items) {
      const p = await Product.findById(item.product);
      if (!p) return res.status(404).json({ message: `Product not found: ${item.product}` });
      if (p.stock_quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${p.name}. Available: ${p.stock_quantity}` });
      }
      
      const itemSubtotal = p.price * item.quantity;
      subtotal_amount += itemSubtotal;

      resolvedItems.push({
        product_id: p._id,
        quantity: item.quantity,
        price_at_time: p.price,
        subtotal: itemSubtotal
      });

      await Product.findByIdAndUpdate(p._id, { 
        $inc: { stock_quantity: -item.quantity, sold: item.quantity } 
      });
    }

    const appliedDiscount = discount_amount || (points_used ? points_used : 0);
    const total_amount = Math.max(0, subtotal_amount - appliedDiscount);

    const order = await Order.create({
      user_id: req.user._id,
      items: resolvedItems,
      subtotal_amount,
      discount_amount: appliedDiscount,
      total_amount,
      payment_method: paymentMethod || 'cash_on_delivery',
      shipping_address: shippingAddress,
      delivery_notes: notes || '',
      order_status: 'pending',
      payment_status: 'pending',
    });

    if (points_used && points_used > 0) {
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id, 
        { $inc: { reward_points: -points_used } }, 
        { new: true }
      );

      await RewardRedemption.create({
        user_id: req.user._id,
        order_id: order._id,
        points_used,
        discount_amount: appliedDiscount
      });

      await RewardTransaction.create({
        user_id: req.user._id,
        points: -points_used,
        reason: 'order_discount',
        reference_type: 'order',
        reference_id: order._id,
        balance_after: updatedUser ? updatedUser.reward_points : 0
      });
    }

    const populated = await Order.findById(order._id).populate('items.product_id', 'name price');

    const emailSubject = `EcoTrade - Order Confirmation #${order._id}`;
    const emailHtml = `
      <h3>Thank you for your order, ${req.user.full_name || 'EcoTrade Customer'}!</h3>
      <p>Your order <strong>#${order._id}</strong> has been successfully placed.</p>
      <h4>Order Details:</h4>
      <ul>
        ${resolvedItems.map(item => `<li>Product ID: ${item.product_id} x ${item.quantity} - Rs. ${item.subtotal}</li>`).join('')}
      </ul>
      <p>Subtotal: Rs. ${subtotal_amount}</p>
      <p>Discount: Rs. ${appliedDiscount} (${points_used || 0} points used)</p>
      <p><strong>Total Amount: Rs. ${total_amount}</strong></p>
      <p>Shipping Address: ${typeof shippingAddress === 'object' ? JSON.stringify(shippingAddress) : shippingAddress}</p>
      <p>Payment Method: ${paymentMethod || 'cash_on_delivery'}</p>
      <br/>
      <p>EcoTrade Team</p>
    `;

    await sendEmail({
      to: req.user.email,
      subject: emailSubject,
      text: `Order Confirmation #${order._id}. Total Amount: Rs. ${total_amount}`,
      html: emailHtml
    });

    res.status(201).json(populated);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user._id })
      .populate('items.product_id', 'name price image_urls')
      .sort('-createdAt');
    res.json(orders);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { order_status: status } : {};
    const orders = await Order.find(filter)
      .populate('user_id', 'full_name email')
      .populate('items.product_id', 'name price')
      .sort('-createdAt');
    res.json({ orders, total: orders.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const update = {};
    if (orderStatus) {
      update.order_status = orderStatus;
      if (orderStatus === 'confirmed') update.confirmed_at = new Date();
      if (orderStatus === 'shipped') update.shipped_at = new Date();
      if (orderStatus === 'delivered') update.delivered_at = new Date();
      if (orderStatus === 'cancelled') update.cancelled_at = new Date();
    }
    if (paymentStatus) {
      update.payment_status = paymentStatus;
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
