const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');

const userSchema = new Schema(
  {
    full_name:     { type: String, required: true, trim: true, maxlength: 100, alias: 'name' },
    email:         { type: String, required: true, unique: true, trim: true, lowercase: true },
    password_hash: { type: String, required: true, alias: 'password' },           // bcrypt hash
    phone:         { type: String, trim: true, maxlength: 20 },
    address:       { type: String },
    location: {
      lat: { type: Number },                                    // GPS latitude
      lng: { type: Number },                                    // GPS longitude
    },
    role:          { type: String, enum: ['user', 'collector', 'admin', 'customer', 'contributor'], default: 'user' },
    profile_photo: { type: String },                           // URL to profile image
    reward_points: { type: Number, default: 0, min: 0, alias: 'ecoPoints' },       // Current redeemable balance
    totalScraps:   { type: Number, default: 0, min: 0 },       // Kept for backward compatibility
    is_active:     { type: Boolean, default: true, alias: 'isActive' },
    is_verified:   { type: Boolean, default: false },          // Email/phone verified
    last_login_at: { type: Date },
  },
  { timestamps: true }                                         // adds createdAt, updatedAt
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash') && !this.isModified('password')) return next();
  const pwd = this.password || this.password_hash;
  if (pwd) {
    const isHashed = pwd.startsWith('$2a$') || pwd.startsWith('$2b$') || pwd.length === 60;
    if (!isHashed) {
      this.password_hash = await bcrypt.hash(pwd, 12);
    }
  }
  next();
});

userSchema.methods.comparePassword = function(p) {
  return bcrypt.compare(p, this.password_hash || this.password);
};

userSchema.methods.toJSON = function() {
  const o = this.toObject({ virtuals: true });
  delete o.password;
  delete o.password_hash;
  return o;
};

module.exports = mongoose.model('User', userSchema);
