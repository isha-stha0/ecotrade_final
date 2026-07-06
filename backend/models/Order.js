const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    product_id: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      alias: 'product',
    },
    quantity:      { type: Number, required: true, min: 1 },
    price_at_time: { type: Number, required: true, alias: 'price' },        // Price snapshot at purchase
    subtotal:      { type: Number },                        // quantity × price_at_time
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      alias: 'user',
    },
    items: [orderItemSchema],
    subtotal_amount:  { type: Number },
    points_used:      { type: Number, default: 0 },
    discount_amount:  { type: Number, default: 0 },
    total_amount:     { type: Number, required: true, alias: 'totalAmount' },
    order_status: {
      type: String,
      enum: ['pending', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      alias: 'orderStatus',
    },
    payment_status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      alias: 'paymentStatus',
    },
    payment_method: {
      type: String,
      enum: ['cash_on_delivery', 'cod', 'esewa', 'khalti', 'bank_transfer', 'reward_points'],
      default: 'cash_on_delivery',
      alias: 'paymentMethod',
    },
    delivery_collector_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      alias: 'deliveryCollector',
    },
    shipping_address: { type: Schema.Types.Mixed, required: true, alias: 'shippingAddress' },
    tracking_number:  { type: String },
    delivery_notes:   { type: String, alias: 'notes' },

    // Status timestamps
    confirmed_at: { type: Date, default: null },
    assigned_for_delivery_at: { type: Date, default: null },
    shipped_at:   { type: Date, default: null },
    delivered_at: { type: Date, default: null },
    cancelled_at: { type: Date, default: null },
  },
  { timestamps: true }                                          // createdAt = order_date
);

orderSchema.index({ user_id: 1 });
orderSchema.index({ order_status: 1 });
orderSchema.index({ delivery_collector_id: 1 });

orderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    let subtotal = 0;
    this.items.forEach(item => {
      const p = item.price_at_time || item.price;
      const qty = item.quantity;
      if (p && qty) {
        item.subtotal = p * qty;
        subtotal += item.subtotal;
      }
    });
    if (!this.subtotal_amount) {
      this.subtotal_amount = subtotal;
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
