const mongoose = require('mongoose');
const { Schema } = mongoose;

const productCategorySchema = new Schema(
  {
    name:        { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String },
    icon_url:    { type: String },
    is_active:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.ProductCategory || mongoose.model('ProductCategory', productCategorySchema);
