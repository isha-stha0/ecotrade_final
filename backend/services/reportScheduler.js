const cron = require('node-cron');
const { json2csv } = require('json2csv');
const nodemailer = require('nodemailer');
const ScheduledReport = require('../models/ScheduledReport');
const Report = require('../models/Report');
const ScrapRequest = require('../models/ScrapRequest');
const Order = require('../models/Order');
const User = require('../models/User');
const CollectorProfile = require('../models/CollectorProfile');
const { getSmtpConfig } = require('../utils/smtpConfig');

/**
 * Report Scheduler Service
 * Manages scheduled report generation and email delivery
 */

class ReportScheduler {
  constructor() {
    this.scheduledTasks = new Map();
    this.mailer = null;
  }

  /**
   * Initialize email transporter
   */
  initializeMailer() {
    const smtp = getSmtpConfig();
    this.mailer = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });
  }

  /**
   * Calculate date range based on configuration
   */
  getDateRange(report) {
    const end = new Date();
    let start;

    switch (report.date_range_type) {
      case 'last_7_days':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_30_days':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last_90_days':
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        start = new Date(end.getTime() - report.custom_start_offset * 24 * 60 * 60 * 1000);
        break;
      case 'month_to_date':
        start = new Date(end.getFullYear(), end.getMonth(), 1);
        break;
      default:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  /**
   * Generate report data based on type
   */
  async generateReportData(reportType, dateRange) {
    const { start, end } = dateRange;
    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    try {
      if (reportType === 'scrap_summary') {
        const stats = await ScrapRequest.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              total_weight: { $sum: '$quantity_estimated' },
            },
          },
        ]);
        return { stats, start, end, type: 'scrap_summary' };
      } else if (reportType === 'sales_summary') {
        const stats = await Order.aggregate([
          { $match: { ...dateFilter, payment_status: 'paid' } },
          {
            $group: {
              _id: '$order_status',
              count: { $sum: 1 },
              total_revenue: { $sum: '$total_amount' },
            },
          },
        ]);
        return { stats, start, end, type: 'sales_summary' };
      } else if (reportType === 'user_activity') {
        const new_users_count = await User.countDocuments({
          createdAt: { $gte: start, $lte: end },
        });
        const total_active_users = await User.countDocuments({ is_active: true });
        return {
          new_users_count,
          total_active_users,
          start,
          end,
          type: 'user_activity',
        };
      } else if (reportType === 'collector_performance') {
        const stats = await CollectorProfile.aggregate([
          {
            $lookup: {
              from: 'scraprequests',
              localField: 'user_id',
              foreignField: 'assigned_collector_id',
              as: 'assignments',
            },
          },
          {
            $unwind: {
              path: '$assignments',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              'assignments.createdAt': { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: '$user_id',
              total_assignments: { $sum: 1 },
              completed: {
                $sum: {
                  $cond: [{ $eq: ['$assignments.status', 'completed'] }, 1, 0],
                },
              },
            },
          },
        ]);
        return { stats, start, end, type: 'collector_performance' };
      } else if (reportType === 'recycling_impact') {
        const stats = await ScrapRequest.aggregate([
          { $match: { ...dateFilter, status: 'completed' } },
          {
            $group: {
              _id: null,
              total_kg_recycled: { $sum: '$quantity_actual' },
              total_completed_requests: { $sum: 1 },
            },
          },
        ]);
        const data = stats[0] || { total_kg_recycled: 0, total_completed_requests: 0 };
        return { ...data, start, end, type: 'recycling_impact' };
      }
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error);
      throw error;
    }
  }

  /**
   * Convert data to CSV format
   */
  async generateCSV(data) {
    try {
      let csvData = [];

      if (data.stats && Array.isArray(data.stats)) {
        csvData = data.stats;
      } else if (Array.isArray(data)) {
        csvData = data;
      } else {
        csvData = [data];
      }

      if (csvData.length === 0) {
        return null;
      }

      const csv = json2csv({ data: csvData });
      return csv;
    } catch (error) {
      console.error('Error generating CSV:', error);
      return null;
    }
  }

  /**
   * Send email with report
   */
  async sendReportEmail(scheduledReport, reportData, csvContent) {
    try {
      if (!this.mailer) this.initializeMailer();
      const smtp = getSmtpConfig();

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${scheduledReport.report_type}_${timestamp}.csv`;

      // Build email subject
      const subject = scheduledReport.email_subject || `Scheduled Report: ${scheduledReport.title}`;

      // Build email body
      let htmlBody = scheduledReport.email_body_template || `
        <h2>Scheduled Report: ${scheduledReport.title}</h2>
        <p>Report Type: <strong>${scheduledReport.report_type.replace(/_/g, ' ')}</strong></p>
        <p>Generated: <strong>${new Date().toLocaleString()}</strong></p>
        <p>Period: ${scheduledReport.date_range_start?.toLocaleDateString()} - ${scheduledReport.date_range_end?.toLocaleDateString()}</p>
        <hr />
        <p>Please find the attached report file for detailed data.</p>
      `;

      // Prepare attachments
      const attachments = [];
      if (scheduledReport.include_csv_attachment && csvContent) {
        attachments.push({
          filename,
          content: csvContent,
          contentType: 'text/csv',
        });
      }

      // Send email to each recipient
      for (const recipient of scheduledReport.recipients) {
        await this.mailer.sendMail({
          from: process.env.EMAIL_FROM || `"EcoTrade Support" <${smtp.user}>`,
          to: recipient,
          subject,
          html: htmlBody,
          attachments,
        });
      }

      return true;
    } catch (error) {
      console.error('Error sending report email:', error);
      throw error;
    }
  }

  /**
   * Execute scheduled report
   */
  async executeScheduledReport(scheduledReportId) {
    const session = await ScheduledReport.startSession();
    session.startTransaction();

    try {
      const scheduledReport = await ScheduledReport.findById(scheduledReportId).session(session);

      if (!scheduledReport || !scheduledReport.is_active) {
        return;
      }

      console.log(`[ReportScheduler] Executing: ${scheduledReport.title}`);

      // Calculate date range
      const dateRange = this.getDateRange(scheduledReport);

      // Generate report data
      const reportData = await this.generateReportData(
        scheduledReport.report_type,
        dateRange
      );

      // Save report to database
      const newReport = new Report({
        report_type: scheduledReport.report_type,
        title: `${scheduledReport.title} (Auto-generated)`,
        data: reportData,
        generated_by: scheduledReport.created_by,
      });
      await newReport.save({ session });

      // Generate CSV if needed
      let csvContent = null;
      if (scheduledReport.include_csv_attachment) {
        csvContent = await this.generateCSV(reportData);
      }

      // Send email
      if (scheduledReport.recipients.length > 0) {
        await this.sendReportEmail(scheduledReport, reportData, csvContent);
      }

      // Update scheduled report status
      scheduledReport.last_execution = new Date();
      scheduledReport.last_execution_status = 'success';
      scheduledReport.last_execution_error = null;
      scheduledReport.execution_count += 1;

      // Calculate next execution
      const cronParser = require('cron-parser');
      const interval = cronParser.parseExpression(scheduledReport.cron_pattern);
      scheduledReport.next_execution = interval.next().toDate();

      await scheduledReport.save({ session });

      await session.commitTransaction();
      console.log(`[ReportScheduler] Completed: ${scheduledReport.title}`);
    } catch (error) {
      await session.abortTransaction();
      console.error(`[ReportScheduler] Failed to execute scheduled report:`, error);

      // Update error status
      try {
        const scheduledReport = await ScheduledReport.findById(scheduledReportId);
        if (scheduledReport) {
          scheduledReport.last_execution = new Date();
          scheduledReport.last_execution_status = 'failed';
          scheduledReport.last_execution_error = error.message;
          await scheduledReport.save();
        }
      } catch (updateError) {
        console.error('Error updating scheduled report status:', updateError);
      }
    } finally {
      await session.endSession();
    }
  }

  /**
   * Register a scheduled report with cron
   */
  registerScheduledReport(scheduledReport) {
    try {
      const taskId = scheduledReport._id.toString();

      // Cancel existing task if running
      if (this.scheduledTasks.has(taskId)) {
        this.scheduledTasks.get(taskId).stop();
      }

      // Create and register cron task
      const task = cron.schedule(scheduledReport.cron_pattern, () => {
        this.executeScheduledReport(scheduledReport._id);
      });

      this.scheduledTasks.set(taskId, task);
      console.log(
        `[ReportScheduler] Registered: ${scheduledReport.title} (${scheduledReport.cron_pattern})`
      );
    } catch (error) {
      console.error(`[ReportScheduler] Failed to register scheduled report:`, error);
    }
  }

  /**
   * Unregister a scheduled report
   */
  unregisterScheduledReport(scheduledReportId) {
    const taskId = scheduledReportId.toString();

    if (this.scheduledTasks.has(taskId)) {
      this.scheduledTasks.get(taskId).stop();
      this.scheduledTasks.delete(taskId);
      console.log(`[ReportScheduler] Unregistered: ${taskId}`);
    }
  }

  /**
   * Load all active scheduled reports
   */
  async loadScheduledReports() {
    try {
      const activeReports = await ScheduledReport.find({ is_active: true });

      console.log(`[ReportScheduler] Loading ${activeReports.length} active reports`);

      activeReports.forEach((report) => {
        this.registerScheduledReport(report);
      });

      console.log('[ReportScheduler] All reports loaded');
    } catch (error) {
      console.error('[ReportScheduler] Error loading scheduled reports:', error);
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopAllTasks() {
    this.scheduledTasks.forEach((task) => task.stop());
    this.scheduledTasks.clear();
    console.log('[ReportScheduler] All tasks stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      activeTasksCount: this.scheduledTasks.size,
      tasks: Array.from(this.scheduledTasks.keys()),
    };
  }
}

// Export singleton instance
module.exports = new ReportScheduler();
