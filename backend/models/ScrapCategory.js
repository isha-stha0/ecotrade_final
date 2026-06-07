const mongoose = require('mongoose');
const { Schema } = mongoose;

const scrapCategorySchema = new Schema(
  {
    name:          { type: String, required: true, trim: true, maxlength: 100 },
    description:   { type: String },
    price_per_kg:  { type: Number, default: 0 },               // Base rate for reward calculation
    points_per_kg: { type: Number, default: 0 },               // Points awarded per kg
    icon_url:      { type: String },
    is_active:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.ScrapCategory || mongoose.model('ScrapCategory', scrapCategorySchema);
