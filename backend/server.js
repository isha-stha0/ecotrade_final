const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import Report Scheduler
const reportScheduler = require('./services/reportScheduler');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploads directory statically for local storage fallback
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Core Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/scrap',         require('./routes/scrap'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/dashboard',     require('./routes/dashboard'));

// New Module Routes
app.use('/api/cart',          require('./routes/cart'));
app.use('/api/feedback',      require('./routes/feedback'));
app.use('/api/complaints',    require('./routes/complaints'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/rewards',       require('./routes/rewards'));

app.get('/api/health', (_, res) => res.json({ status: 'OK', time: new Date() }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');

    // Initialize email mailer and load scheduled reports
    reportScheduler.initializeMailer();
    reportScheduler.loadScheduledReports();

    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });
