const mongoose = require('mongoose');
const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    report_type: {
      type: String,
      enum: ['scrap_summary', 'sales_summary', 'user_activity', 'reward_summary', 'collector_performance', 'recycling_impact'],
      required: true,
    },
    title:            { type: String, maxlength: 255 },
    date_range_start: { type: Date },
    date_range_end:   { type: Date },
    generated_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema);
