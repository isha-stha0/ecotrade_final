const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    product_category_id: {
      type: Schema.Types.ObjectId,
      ref: 'ProductCategory',
      required: false,
    },
    source_material: {
      type: String,
      enum: ['plastic', 'paper', 'glass', 'metal', 'mixed', 'other'],
      required: false,
    },
    name:             { type: String, required: true, trim: true, maxlength: 150 },
    description:      { type: String },
    price:            { type: Number, required: true, min: 0 },
    stock_quantity:   { type: Number, default: 0, min: 0, alias: 'stock' },
    weight_kg:        { type: Number },                         // Product weight for shipping
    image_urls:       [{ type: String }],                       // Array of product image URLs
    is_eco_certified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'published', 'out_of_stock', 'discontinued'],
      default: 'draft',
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',                                              // Admin who listed this product
    },
    // Backward compatibility fields
    category:         { type: String },
    madeFrom:         { type: String, default: '' },
    ecoImpact:        { type: String, default: '' },
    tags:             [{ type: String }],
    rating:           { type: Number, default: 0 },
    isActive:         { type: Boolean, default: true },
    sold:             { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ status: 1 });
productSchema.index({ source_material: 1 });
productSchema.index({ product_category_id: 1 });

module.exports = mongoose.model('Product', productSchema);
