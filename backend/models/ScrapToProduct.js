const mongoose = require('mongoose');
const { Schema } = mongoose;

const scrapToProductSchema = new Schema(
  {
    scrap_request_id: {
      type: Schema.Types.ObjectId,
      ref: 'ScrapRequest',
      required: true,
    },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity_used_kg: { type: Number },                         // How many kg of scrap were used
    units_produced:   { type: Number },                         // Units of product made
    processed_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',                                              // Admin who recorded this
    },
    notes: { type: String },
  },
  { timestamps: true }                                          // createdAt = processed_at
);

scrapToProductSchema.index({ scrap_request_id: 1 });
scrapToProductSchema.index({ product_id: 1 });

module.exports = mongoose.models.ScrapToProduct || mongoose.model('ScrapToProduct', scrapToProductSchema);
