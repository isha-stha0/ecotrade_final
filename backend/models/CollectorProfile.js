const mongoose = require('mongoose');
const { Schema } = mongoose;

const collectorProfileSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    vehicle_type:       { type: String, enum: ['bicycle', 'motorcycle', 'van', 'truck', 'on_foot'], default: 'motorcycle' },
    service_area_km:    { type: Number, default: 5 },           // Radius in km collector can serve
    is_available:       { type: Boolean, default: true },       // Is collector on duty?
    total_collections:  { type: Number, default: 0 },
    average_rating:     { type: Number, default: 0, min: 0, max: 5 },
    id_proof_url:       { type: String },                       // URL to identity document
    approved_by_admin:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.CollectorProfile || mongoose.model('CollectorProfile', collectorProfileSchema);
