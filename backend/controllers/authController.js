const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { getFileUrl } = require('../utils/cloudinary');
const { sendEmail } = require('../utils/mailer');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, lat, lng } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });

    let profilePhotoUrl = '';
    if (req.file) {
      profilePhotoUrl = getFileUrl(req.file, req);
    }

    const location = (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;

    const user = await User.create({
      full_name: name,
      email,
      password_hash: password,
      phone,
      address,
      location,
      role: role || 'user',
      profile_photo: profilePhotoUrl,
    });

    res.status(201).json({ token: sign(user._id), user });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.is_active) return res.status(403).json({ message: 'Account deactivated' });

    user.last_login_at = new Date();
    await user.save();

    res.json({ token: sign(user._id), user });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getProfile = (req, res) => res.json(req.user);

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, lat, lng } = req.body;
    const update = {};
    if (name) update.full_name = name;
    if (phone) update.phone = phone;
    if (address) update.address = address;
    if (lat !== undefined && lng !== undefined) {
      update.location = { lat: parseFloat(lat), lng: parseFloat(lng) };
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const profilePhotoUrl = getFileUrl(req.file, req);
    const user = await User.findByIdAndUpdate(req.user._id, { profile_photo: profilePhotoUrl }, { new: true });
    res.json({ message: 'Photo uploaded successfully', profile_photo: profilePhotoUrl, user });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect' });
    user.password_hash = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found with this email' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 3600000);

    await PasswordReset.create({ user_id: user._id, token, expires_at });

    const resetUrl = `http://localhost:5000/api/auth/reset-password?token=${token}`;
    const emailText = `Hello,\n\nYou requested a password reset. Please click on the link below or copy it to your browser to reset your password within 1 hour:\n\n${resetUrl}\n`;
    const emailHtml = `<p>Hello,</p><p>You requested a password reset. Please click the button below to reset your password within 1 hour:</p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">Reset Password</a>`;

    await sendEmail({
      to: user.email,
      subject: 'EcoTrade - Password Reset Request',
      text: emailText,
      html: emailHtml,
    });

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const resetRecord = await PasswordReset.findOne({ token, expires_at: { $gt: new Date() }, is_used: false });
    if (!resetRecord) return res.status(400).json({ message: 'Invalid or expired password reset token' });

    const user = await User.findById(resetRecord.user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password_hash = newPassword;
    await user.save();

    resetRecord.is_used = true;
    await resetRecord.save();

    res.json({ message: 'Password has been reset successfully.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
