const mongoose = require('mongoose');
const { Schema } = mongoose;

const feedbackSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedback_type: {
      type: String,
      enum: ['app_experience', 'collector_service', 'product_quality', 'general'],
      default: 'general',
    },
    comment:        { type: String },
    admin_response: { type: String },
    response_status: {
      type: String,
      enum: ['not_replied', 'replied'],
      default: 'not_replied',
    },
    responded_at: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
