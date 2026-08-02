const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const RewardRedemption = require('../models/RewardRedemption');
const { sendEmail } = require('../utils/mailer');
const { generatePaymentURL, processPaymentCallback, ESEWA_CONFIG } = require('../services/esewaService');
const { createNotification, notifyRoles } = require('../services/notificationService');
const { labelForStatus, shortId } = require('../utils/notificationText');

const decodeEsewaData = (encoded) => {
  if (!encoded) return null;
  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(normalized, 'base64').toString('utf8');
  return JSON.parse(json);
};

const verifyEsewaSignature = (data) => {
  if (!data?.signature || !data?.signed_field_names) return false;
  const signedFields = data.signed_field_names.split(',');
  const signedPayload = signedFields.map((field) => `${field}=${data[field]}`).join(',');
  const expected = require('crypto')
    .createHmac('sha256', ESEWA_CONFIG.SECRET_KEY)
    .update(signedPayload)
    .digest('base64');
  return expected === data.signature;
};

const orderIdFromTransaction = (transactionUUID) => {
  const match = transactionUUID?.match(/^ECOTRADE-(.+)-\d+$/);
  return match?.[1] || null;
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

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

    const requestedPoints = Math.floor((points_used || 0) / 500) * 500;
    const maxPointsForOrder = Math.floor(subtotal_amount / 10) * 500;
    const effectivePointsUsed = Math.min(requestedPoints, maxPointsForOrder);
    const appliedDiscount = (effectivePointsUsed / 500) * 10;
    const total_amount = Math.max(0, subtotal_amount - appliedDiscount);

    const order = await Order.create({
      user_id: req.user._id,
      items: resolvedItems,
      subtotal_amount,
      points_used: effectivePointsUsed,
      discount_amount: appliedDiscount,
      total_amount,
      payment_method: paymentMethod || 'cash_on_delivery',
      shipping_address: shippingAddress,
      delivery_notes: notes || '',
      order_status: 'pending',
      payment_status: 'pending',
    });

    if (effectivePointsUsed > 0) {
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id, 
        { $inc: { reward_points: -effectivePointsUsed } }, 
        { new: true }
      );

      await RewardRedemption.create({
        user_id: req.user._id,
        order_id: order._id,
        points_used: effectivePointsUsed,
        discount_amount: appliedDiscount
      });

      await RewardTransaction.create({
        user_id: req.user._id,
        points: -effectivePointsUsed,
        reason: 'order_discount',
        reference_type: 'order',
        reference_id: order._id,
        balance_after: updatedUser ? updatedUser.reward_points : 0
      });
    }

    const populated = await Order.findById(order._id).populate('items.product_id', 'name price');

    await Promise.all([
      createNotification({ recipientId: req.user._id, title: 'Order received', message: `Order #${shortId(order._id)} is underway. We will notify you as it is prepared and delivered.`, type: 'order_update', referenceType: 'order', referenceId: order._id }),
      notifyRoles(['admin'], { title: 'New product order', message: `${req.user.full_name} placed order #${shortId(order._id)} for Rs. ${order.total_amount}.`, type: 'order_update', referenceType: 'order', referenceId: order._id }),
    ]);

    const emailSubject = `EcoTrade - Order Confirmation #${order._id}`;
    const emailHtml = `
      <h3>Thank you for your order, ${req.user.full_name || 'EcoTrade Customer'}!</h3>
      <p>Your order <strong>#${order._id}</strong> has been successfully placed.</p>
      <h4>Order Details:</h4>
      <ul>
        ${resolvedItems.map(item => `<li>Product ID: ${item.product_id} x ${item.quantity} - Rs. ${item.subtotal}</li>`).join('')}
      </ul>
      <p>Subtotal: Rs. ${subtotal_amount}</p>
      <p>Discount: Rs. ${appliedDiscount} (${effectivePointsUsed} points used)</p>
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
      .populate('user_id', 'full_name email phone')
      .populate('delivery_collector_id', 'full_name phone')
      .populate('items.product_id', 'name price')
      .sort('-createdAt');
    res.json({ orders, total: orders.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMyDeliveries = async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ message: 'Collector only' });
    }
    const orders = await Order.find({ delivery_collector_id: req.user._id })
      .populate('user_id', 'full_name email phone')
      .populate('items.product_id', 'name price image_urls')
      .sort('-createdAt');
    res.json({ orders, total: orders.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.assignDeliveryCollector = async (req, res) => {
  try {
    const { collectorId } = req.body;
    if (!collectorId) return res.status(400).json({ message: 'collectorId is required' });

    const collector = await User.findById(collectorId);
    if (!collector || collector.role !== 'collector') {
      return res.status(400).json({ message: 'Selected user is not a collector' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        delivery_collector_id: collectorId,
        assigned_for_delivery_at: new Date(),
        order_status: 'confirmed',
      },
      { new: true }
    )
      .populate('user_id', 'full_name email phone')
      .populate('delivery_collector_id', 'full_name phone')
      .populate('items.product_id', 'name price');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    await Promise.all([
      createNotification({ recipientId: collectorId, title: 'New delivery assigned', message: `Order #${shortId(order._id)} has been assigned to you for delivery.`, type: 'order_update', referenceType: 'order', referenceId: order._id }),
      createNotification({ recipientId: order.user_id._id || order.user_id, title: 'Delivery assigned', message: `A driver has been assigned to order #${shortId(order._id)}.`, type: 'order_update', referenceType: 'order', referenceId: order._id }),
    ]);
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateMyDeliveryStatus = async (req, res) => {
  try {
    if (req.user.role !== 'collector') {
      return res.status(403).json({ message: 'Collector only' });
    }
    const { orderStatus } = req.body;
    if (!['shipped', 'delivered'].includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid delivery status' });
    }

    const update = { order_status: orderStatus };
    if (orderStatus === 'shipped') update.shipped_at = new Date();
    if (orderStatus === 'delivered') update.delivered_at = new Date();

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, delivery_collector_id: req.user._id },
      update,
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Assigned order not found' });
    await Promise.all([
      createNotification({ recipientId: order.user_id, title: 'Order status updated', message: `Order #${shortId(order._id)} is ${labelForStatus(orderStatus)}.`, type: 'order_update', referenceType: 'order', referenceId: order._id }),
      notifyRoles(['admin'], { title: 'Delivery status updated', message: `Order #${shortId(order._id)} is ${labelForStatus(orderStatus)}.`, type: 'order_update', referenceType: 'order', referenceId: order._id }),
    ]);
    res.json(order);
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
    if (orderStatus) {
      await createNotification({ recipientId: order.user_id, title: 'Order status updated', message: `Order #${shortId(order._id)} is ${labelForStatus(orderStatus)}.`, type: 'order_update', referenceType: 'order', referenceId: order._id });
      if (order.delivery_collector_id) await createNotification({ recipientId: order.delivery_collector_id, title: 'Delivery update', message: `Order #${shortId(order._id)} is ${labelForStatus(orderStatus)}.`, type: 'order_update', referenceType: 'order', referenceId: order._id });
    }
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// eSewa Payment Integration
exports.initiateEsewaPayment = async (req, res) => {
  try {
    const { items, shippingAddress, notes, points_used, discount_amount } = req.body;
    
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

    // Validate and resolve all items
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
    }

    const requestedPoints = Math.floor((points_used || 0) / 500) * 500;
    const maxPointsForOrder = Math.floor(subtotal_amount / 10) * 500;
    const effectivePointsUsed = Math.min(requestedPoints, maxPointsForOrder);
    const appliedDiscount = (effectivePointsUsed / 500) * 10;
    const total_amount = Math.max(0, subtotal_amount - appliedDiscount);

    // Create pending order
    const order = await Order.create({
      user_id: req.user._id,
      items: resolvedItems,
      subtotal_amount,
      points_used: effectivePointsUsed,
      discount_amount: appliedDiscount,
      total_amount,
      payment_method: 'esewa',
      shipping_address: shippingAddress,
      delivery_notes: notes || '',
      order_status: 'pending',
      payment_status: 'pending',
    });

    // Generate eSewa payment URL
    const paymentData = generatePaymentURL({
      orderId: order._id,
      amount: total_amount,
      customerName: req.user.full_name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
    });

    const paymentUrl = `${req.protocol}://${req.get('host')}/api/orders/esewa/pay/${order._id}?transaction_uuid=${encodeURIComponent(paymentData.transactionUUID)}`;

    res.json({
      order: order,
      payment_url: paymentUrl,
      transaction_uuid: paymentData.transactionUUID,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.renderEsewaPaymentForm = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).send('Order not found');

    const paymentData = generatePaymentURL({
      orderId: order._id,
      amount: order.total_amount,
      transactionUUID: req.query.transaction_uuid,
    });

    const inputs = Object.entries(paymentData.fields)
      .map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}" />`)
      .join('\n');

    res.send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Redirecting to eSewa</title>
    <style>
      body { font-family: Arial, sans-serif; display: grid; min-height: 100vh; place-items: center; background: #f7faf7; color: #163b2b; }
      .card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.08); text-align: center; }
      button { background: #2e7d32; color: white; border: 0; padding: 12px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>Redirecting to eSewa...</h2>
      <p>If it does not open automatically, click the button below.</p>
      <form id="esewa-form" action="${escapeHtml(ESEWA_CONFIG.PAYMENT_URL)}" method="POST">
        ${inputs}
        <button type="submit">Continue to eSewa</button>
      </form>
    </div>
    <script>document.getElementById('esewa-form').submit();</script>
  </body>
</html>`);
  } catch (e) {
    res.status(500).send(e.message);
  }
};

exports.verifyEsewaPayment = async (req, res) => {
  try {
    let { ref_id, transaction_uuid, orderId, data } = req.body;

    if (data) {
      const decoded = decodeEsewaData(data);
      if (!verifyEsewaSignature(decoded)) {
        return res.status(400).json({ message: 'Invalid eSewa payment signature' });
      }
      if (decoded.status !== 'COMPLETE') {
        return res.status(400).json({ message: `eSewa payment is ${decoded.status || 'not complete'}` });
      }
      ref_id = decoded.transaction_code;
      transaction_uuid = decoded.transaction_uuid;
      orderId = orderIdFromTransaction(transaction_uuid);
    }

    if (!ref_id || !transaction_uuid || !orderId) {
      return res.status(400).json({ message: 'Missing payment verification data' });
    }

    // Verify payment with eSewa when the legacy callback format is used.
    const paymentResult = data ? { success: true } : await processPaymentCallback({ ref_id, transaction_uuid });

    if (!paymentResult.success) {
      return res.status(400).json({ message: 'Payment verification failed', details: paymentResult });
    }

    // Update order with payment confirmation
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    order.payment_status = 'paid';
    order.order_status = 'placed';
    await order.save();

    await Promise.all([
      createNotification({ recipientId: order.user_id, title: 'Payment confirmed', message: `Payment for order #${shortId(order._id)} was received. Your order is underway.`, type: 'order_update', referenceType: 'order', referenceId: order._id }),
      notifyRoles(['admin'], { title: 'Paid product order', message: `Order #${shortId(order._id)} was paid and is ready to process.`, type: 'order_update', referenceType: 'order', referenceId: order._id }),
    ]);

    // Deduct reward points if used
    if (order.points_used > 0) {
      const updatedUser = await User.findByIdAndUpdate(
        order.user_id,
        { $inc: { reward_points: -order.points_used } },
        { new: true }
      );

      await RewardRedemption.create({
        user_id: order.user_id,
        order_id: order._id,
        points_used: order.points_used,
        discount_amount: order.discount_amount,
      });

      await RewardTransaction.create({
        user_id: order.user_id,
        points: -order.points_used,
        reason: 'order_discount',
        reference_type: 'order',
        reference_id: order._id,
        balance_after: updatedUser ? updatedUser.reward_points : 0,
      });
    }

    // Send confirmation email
    const populated = await Order.findById(order._id).populate('items.product_id', 'name price');
    const emailSubject = `EcoTrade - Payment Confirmed #${order._id}`;
    const emailHtml = `
      <h3>Payment Confirmed!</h3>
      <p>Dear ${order.user.full_name || 'Customer'},</p>
      <p>Your payment has been successfully processed.</p>
      <h4>Order Details:</h4>
      <ul>
        ${populated.items.map(item => `<li>${item.product_id.name} x ${item.quantity} - Rs. ${item.subtotal}</li>`).join('')}
      </ul>
      <p><strong>Total Amount Paid: Rs. ${order.total_amount}</strong></p>
      <p>Payment Reference: ${ref_id}</p>
      <p>Your order is now confirmed and will be processed soon.</p>
      <br/>
      <p>EcoTrade Team</p>
    `;

    await sendEmail({
      to: order.user.email,
      subject: emailSubject,
      text: `Payment confirmed for order #${order._id}. Reference: ${ref_id}`,
      html: emailHtml,
    });

    res.json({
      success: true,
      message: 'Payment verified and order confirmed',
      order,
      transaction_id: ref_id,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.handleEsewaFailure = async (req, res) => {
  try {
    const { orderId, failure_reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.payment_status = 'failed';
    order.order_status = 'cancelled';
    await order.save();

    // Return stock to products
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { stock_quantity: item.quantity, sold: -item.quantity },
      });
    }

    res.json({
      success: false,
      message: 'Payment failed',
      order,
      reason: failure_reason,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
