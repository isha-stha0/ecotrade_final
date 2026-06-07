const User = require('../models/User');
const Product = require('../models/Product');
const CollectorProfile = require('../models/CollectorProfile');
const Report = require('../models/Report');
const ScheduledReport = require('../models/ScheduledReport');
const ScrapRequest = require('../models/ScrapRequest');
const Order = require('../models/Order');
const reportScheduler = require('../services/reportScheduler');

// ──────────────────────────────────────────────────────────────
// USERS
// ──────────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).sort('-createdAt');
    res.json({ users, total: users.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.is_active = !user.is_active;
    await user.save();
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.changeUserRole = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ──────────────────────────────────────────────────────────────
// COLLECTOR PROFILES
// ──────────────────────────────────────────────────────────────
exports.getAllCollectorProfiles = async (req, res) => {
  try {
    const profiles = await CollectorProfile.find()
      .populate('user_id', 'full_name email phone');
    res.json(profiles);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateCollectorProfile = async (req, res) => {
  try {
    const { approved_by_admin, service_area_km, vehicle_type, is_available } = req.body;
    const update = {};
    if (approved_by_admin !== undefined) update.approved_by_admin = approved_by_admin;
    if (service_area_km !== undefined) update.service_area_km = parseFloat(service_area_km);
    if (vehicle_type) update.vehicle_type = vehicle_type;
    if (is_available !== undefined) update.is_available = is_available;

    const profile = await CollectorProfile.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user_id', 'full_name email phone');
    if (!profile) return res.status(404).json({ message: 'Collector profile not found' });
    res.json(profile);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ──────────────────────────────────────────────────────────────
// REPORTS
// ──────────────────────────────────────────────────────────────
exports.generateReport = async (req, res) => {
  try {
    const { report_type, title, date_range_start, date_range_end } = req.body;
    if (!report_type) return res.status(400).json({ message: 'Report type is required' });

    const start = date_range_start
      ? new Date(date_range_start)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const end = date_range_end ? new Date(date_range_end) : new Date();
    const dateFilter = { createdAt: { $gte: start, $lte: end } };

    let reportData = {};

    if (report_type === 'scrap_summary') {
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
      reportData = { stats, start, end };

    } else if (report_type === 'sales_summary') {
      const stats = await Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$order_status',
            count: { $sum: 1 },
            total_revenue: { $sum: '$total_amount' },
          },
        },
      ]);
      reportData = { stats, start, end };

    } else if (report_type === 'user_activity') {
      const newUsersCount = await User.countDocuments(dateFilter);
      const totalActiveUsers = await User.countDocuments({ is_active: true });
      reportData = { new_users_count: newUsersCount, total_active_users: totalActiveUsers, start, end };

    } else if (report_type === 'collector_performance') {
      const stats = await ScrapRequest.aggregate([
        { $match: { ...dateFilter, collector_id: { $ne: null } } },
        {
          $group: {
            _id: '$collector_id',
            total_assignments: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          },
        },
      ]);
      reportData = { stats, start, end };

    } else if (report_type === 'recycling_impact') {
      const [totalWeight, totalCompleted] = await Promise.all([
        ScrapRequest.aggregate([
          { $match: { ...dateFilter, status: 'completed' } },
          { $group: { _id: null, total_kg: { $sum: '$quantity_actual' } } },
        ]),
        ScrapRequest.countDocuments({ ...dateFilter, status: 'completed' }),
      ]);
      reportData = {
        total_kg_recycled: totalWeight[0]?.total_kg || 0,
        total_completed_requests: totalCompleted,
        start,
        end,
      };

    } else {
      reportData = { message: 'General report snapshot', generatedAt: new Date() };
    }

    const report = await Report.create({
      report_type,
      title: title || `Analytics Report — ${report_type.replace(/_/g, ' ')}`,
      date_range_start: start,
      date_range_end: end,
      generated_by: req.user._id,
      data: reportData,
    });

    res.status(201).json(report);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('generated_by', 'full_name')
      .sort('-createdAt');
    res.json(reports);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ──────────────────────────────────────────────────────────────
// SCHEDULED REPORTS
// ──────────────────────────────────────────────────────────────
exports.createScheduledReport = async (req, res) => {
  try {
    const {
      report_type,
      title,
      description,
      schedule_type,
      cron_pattern,
      execution_time,
      day_of_week,
      day_of_month,
      date_range_type,
      custom_start_offset,
      recipients,
      include_charts,
      include_csv_attachment,
      email_subject,
      email_body_template,
    } = req.body;

    if (!report_type || !title || !schedule_type || !cron_pattern) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ message: 'At least one recipient email is required' });
    }

    const scheduledReport = new ScheduledReport({
      report_type,
      title,
      description,
      schedule_type,
      cron_pattern,
      execution_time,
      day_of_week,
      day_of_month,
      date_range_type,
      custom_start_offset,
      recipients,
      include_charts,
      include_csv_attachment,
      email_subject,
      email_body_template,
      created_by: req.user._id,
    });

    await scheduledReport.save();

    // Register with scheduler
    reportScheduler.registerScheduledReport(scheduledReport);

    res.status(201).json(scheduledReport);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getScheduledReports = async (req, res) => {
  try {
    const reports = await ScheduledReport.find()
      .populate('created_by', 'full_name email')
      .populate('updated_by', 'full_name email')
      .sort('-createdAt');

    res.json(reports);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getScheduledReportById = async (req, res) => {
  try {
    const report = await ScheduledReport.findById(req.params.id)
      .populate('created_by', 'full_name email')
      .populate('updated_by', 'full_name email');

    if (!report) {
      return res.status(404).json({ message: 'Scheduled report not found' });
    }

    res.json(report);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateScheduledReport = async (req, res) => {
  try {
    const {
      title,
      description,
      schedule_type,
      cron_pattern,
      execution_time,
      day_of_week,
      day_of_month,
      date_range_type,
      custom_start_offset,
      recipients,
      include_charts,
      include_csv_attachment,
      email_subject,
      email_body_template,
      is_active,
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (schedule_type !== undefined) updateData.schedule_type = schedule_type;
    if (cron_pattern !== undefined) updateData.cron_pattern = cron_pattern;
    if (execution_time !== undefined) updateData.execution_time = execution_time;
    if (day_of_week !== undefined) updateData.day_of_week = day_of_week;
    if (day_of_month !== undefined) updateData.day_of_month = day_of_month;
    if (date_range_type !== undefined) updateData.date_range_type = date_range_type;
    if (custom_start_offset !== undefined) updateData.custom_start_offset = custom_start_offset;
    if (recipients !== undefined) updateData.recipients = recipients;
    if (include_charts !== undefined) updateData.include_charts = include_charts;
    if (include_csv_attachment !== undefined) updateData.include_csv_attachment = include_csv_attachment;
    if (email_subject !== undefined) updateData.email_subject = email_subject;
    if (email_body_template !== undefined) updateData.email_body_template = email_body_template;
    if (is_active !== undefined) updateData.is_active = is_active;

    updateData.updated_by = req.user._id;

    const scheduledReport = await ScheduledReport.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('created_by', 'full_name email')
      .populate('updated_by', 'full_name email');

    if (!scheduledReport) {
      return res.status(404).json({ message: 'Scheduled report not found' });
    }

    // Re-register with scheduler
    reportScheduler.registerScheduledReport(scheduledReport);

    res.json(scheduledReport);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.deleteScheduledReport = async (req, res) => {
  try {
    const scheduledReport = await ScheduledReport.findByIdAndDelete(req.params.id);

    if (!scheduledReport) {
      return res.status(404).json({ message: 'Scheduled report not found' });
    }

    // Unregister from scheduler
    reportScheduler.unregisterScheduledReport(req.params.id);

    res.json({ message: 'Scheduled report deleted', deletedReport: scheduledReport });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.executeScheduledReportNow = async (req, res) => {
  try {
    const scheduledReport = await ScheduledReport.findById(req.params.id);

    if (!scheduledReport) {
      return res.status(404).json({ message: 'Scheduled report not found' });
    }

    // Execute immediately in background
    reportScheduler.executeScheduledReport(req.params.id);

    res.json({ message: 'Report execution initiated', scheduledReport });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getSchedulerStatus = async (req, res) => {
  try {
    const status = reportScheduler.getStatus();
    const scheduledReports = await ScheduledReport.find({ is_active: true });

    res.json({
      scheduler: status,
      activeReports: scheduledReports.length,
      lastReports: await Report.find()
        .sort('-createdAt')
        .limit(5)
        .populate('generated_by', 'full_name'),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ──────────────────────────────────────────────────────────────
// SEED
// ──────────────────────────────────────────────────────────────
exports.seedProducts = async (req, res) => {
  try {
    const products = [
      { name: 'Recycled Paper Notebook', description: 'Made from 100% recycled paper', category: 'Stationery', price: 150, stock: 50, madeFrom: 'Recycled Paper', ecoImpact: 'Saves 2kg CO2', sold: 24 },
      { name: 'Eco Shopping Bag', description: 'Reusable bag from recycled plastic', category: 'Bags', price: 200, stock: 100, madeFrom: 'Recycled Plastic', ecoImpact: 'Replaces 500 plastic bags', sold: 78 },
      { name: 'Glass Flower Vase', description: 'Artisan vase from recycled glass', category: 'Home Decor', price: 450, stock: 30, madeFrom: 'Recycled Glass', ecoImpact: 'Repurposes 1kg glass', sold: 12 },
      { name: 'Aluminum Pen Holder', description: 'Sleek desk organizer from recycled aluminum', category: 'Office', price: 300, stock: 60, madeFrom: 'Recycled Aluminum', ecoImpact: 'Saves 5kg bauxite mining', sold: 35 },
      { name: 'Recycled Cardboard Box Set', description: 'Set of 3 storage boxes', category: 'Storage', price: 350, stock: 40, madeFrom: 'Recycled Cardboard', ecoImpact: 'Saves 3 trees', sold: 19 },
      { name: 'Eco Glass Candle Holder', description: 'Beautiful candle holder from glass bottles', category: 'Home Decor', price: 250, stock: 45, madeFrom: 'Recycled Glass Bottles', ecoImpact: 'Upcycles 2 bottles', sold: 41 },
      { name: 'Paper Seed Pots Set of 6', description: 'Biodegradable seed pots from recycled paper pulp', category: 'Gardening', price: 180, stock: 75, madeFrom: 'Recycled Paper Pulp', ecoImpact: 'Fully biodegradable', sold: 53 },
      { name: 'Upcycled Tin Planter', description: 'Planter made from used tin cans', category: 'Gardening', price: 120, stock: 90, madeFrom: 'Recycled Tin Cans', ecoImpact: 'Saves metal from landfill', sold: 67 },
    ];
    const count = await Product.countDocuments();
    if (count === 0) await Product.insertMany(products);
    res.json({ message: `${count === 0 ? products.length : count} products ready` });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
