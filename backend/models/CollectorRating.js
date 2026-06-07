const mongoose = require('mongoose');
const { Schema } = mongoose;

const collectorRatingSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collector_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scrap_request_id: {
      type: Schema.Types.ObjectId,
      ref: 'ScrapRequest',
      required: true,
      unique: true,
    },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

collectorRatingSchema.index({ collector_id: 1 });

module.exports = mongoose.models.CollectorRating || mongoose.model('CollectorRating', collectorRatingSchema);
