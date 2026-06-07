const mongoose = require('mongoose');
const { Schema } = mongoose;

const sectorOrganizationSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    org_name: { type: String, required: true, trim: true, maxlength: 150 },
    org_type: {
      type: String,
      enum: ['school', 'college', 'hotel', 'restaurant', 'retail_shop', 'office', 'other'],
      required: true,
    },
    contact_person: { type: String, maxlength: 100 },
    phone:          { type: String, maxlength: 20 },
    address:        { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    is_verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

sectorOrganizationSchema.index({ org_type: 1 });

module.exports = mongoose.models.SectorOrganization || mongoose.model('SectorOrganization', sectorOrganizationSchema);
