const mongoose = require('mongoose');
const { Schema } = mongoose;

const scheduledReportSchema = new Schema(
  {
    report_type: {
      type: String,
      enum: ['scrap_summary', 'sales_summary', 'user_activity', 'collector_performance', 'recycling_impact'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 255,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    // Scheduling configuration
    schedule_type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    // Cron pattern for flexibility (e.g., "0 9 * * 1" for Monday 9 AM)
    cron_pattern: {
      type: String,
      required: true,
    },
    // Time of day for execution (HH:mm format)
    execution_time: {
      type: String,
      default: '09:00',
    },
    // Day of week for weekly (0-6, 0 is Sunday)
    day_of_week: {
      type: Number,
      min: 0,
      max: 6,
    },
    // Day of month for monthly (1-31)
    day_of_month: {
      type: Number,
      min: 1,
      max: 31,
    },
    // Date range configuration
    date_range_type: {
      type: String,
      enum: ['last_7_days', 'last_30_days', 'last_90_days', 'custom', 'month_to_date'],
      default: 'last_30_days',
    },
    custom_start_offset: {
      type: Number,
      default: 30, // days back from execution date
    },
    // Email recipients
    recipients: [
      {
        type: String,
        validate: {
          validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
          message: 'Invalid email format',
        },
      },
    ],
    // Email settings
    include_charts: {
      type: Boolean,
      default: true,
    },
    include_csv_attachment: {
      type: Boolean,
      default: true,
    },
    email_subject: {
      type: String,
      default: null,
    },
    email_body_template: {
      type: String,
      default: null,
    },
    // Status and tracking
    is_active: {
      type: Boolean,
      default: true,
    },
    last_execution: {
      type: Date,
    },
    last_execution_status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    last_execution_error: {
      type: String,
    },
    next_execution: {
      type: Date,
    },
    execution_count: {
      type: Number,
      default: 0,
    },
    // Management
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updated_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Calculate next execution time before saving
scheduledReportSchema.pre('save', async function (next) {
  try {
    const cronParser = require('cron-parser');
    const interval = cronParser.parseExpression(this.cron_pattern);
    this.next_execution = interval.next().toDate();
    next();
  } catch (error) {
    next(error);
  }
});

// Index for efficient querying
scheduledReportSchema.index({ is_active: 1, next_execution: 1 });
scheduledReportSchema.index({ created_by: 1 });
scheduledReportSchema.index({ report_type: 1 });

module.exports = mongoose.models.ScheduledReport || mongoose.model('ScheduledReport', scheduledReportSchema);
