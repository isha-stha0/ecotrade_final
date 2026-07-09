const mongoose = require('mongoose');
const { Schema } = mongoose;

const scrapRequestSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      alias: 'user',
    },
    collector_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      alias: 'collector',
    },
    scrap_category_id: {
      type: Schema.Types.ObjectId,
      ref: 'ScrapCategory',
      default: null,
    },
    sector_type: {
      type: String,
      enum: ['household', 'school_college', 'hotel_restaurant', 'retail_shop', 'office', 'other'],
      default: 'household',
    },
    quantity_estimated: { type: Number, required: true, alias: 'quantity' },       // User-submitted estimate (kg)
    quantity_actual:    { type: Number, default: null },        // Verified by collector
    pickup_address:     { type: String, required: true, alias: 'location' },
    pickup_location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    preferred_pickup_time: { type: Date, default: null },
    description:         { type: String, default: '' },
    photos:             [{ type: String }],                     // Array of image URLs
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'assigned', 'collected', 'at_center', 'processed', 'completed', 'cancelled', 'recycling'],
      default: 'pending',
    },
    rejection_reason:    { type: String, default: null },
    cancellation_reason: { type: String, default: null },
    points_awarded:      { type: Number, default: 0, alias: 'pointsAwarded' },
    admin_notes:         { type: String, alias: 'adminNotes' },

    // Status timestamps
    approved_at:   { type: Date, default: null },
    assigned_at:   { type: Date, default: null },
    collected_at:  { type: Date, default: null },
    completed_at:  { type: Date, default: null },

    // Backward compatibility fields
    category:      { type: String },
    unit:          { type: String, enum: ['kg','pieces','liters'], default: 'kg' },
  },
  { timestamps: true, collection: 'scraprequests' }
);

scrapRequestSchema.index({ user_id: 1 });
scrapRequestSchema.index({ collector_id: 1 });
scrapRequestSchema.index({ status: 1 });

scrapRequestSchema.methods.calculatePoints = function() {
  const pts = { paper:10, plastic:15, glass:12, aluminum:20, electronics:25, other:5 };
  const cat = this.category || 'other';
  const qty = this.quantity_estimated || this.quantity || 0;
  return Math.floor((pts[cat] || 5) * qty);
};

module.exports = mongoose.model('ScrapRequest', scrapRequestSchema);
