const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { getFileUrl } = require('../utils/cloudinary');
const { sendEmail } = require('../utils/mailer');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const MAX_SECURITY_FAILURES = 5;

const recordSecurityFailure = async (user, field, reason) => {
  user[field] = (user[field] || 0) + 1;
  if (user[field] >= MAX_SECURITY_FAILURES) {
    user.is_active = false;
    user.deactivation_reason = reason;
  }
  await user.save();
  return !user.is_active;
};

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
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.is_active) return res.status(403).json({ message: 'Account deactivated' });
    if (!(await user.comparePassword(password))) {
      const deactivated = await recordSecurityFailure(user, 'failed_login_attempts', 'Too many incorrect password attempts');
      return res.status(deactivated ? 403 : 401).json({ message: deactivated ? 'Account deactivated after too many incorrect password attempts. Contact an administrator.' : 'Invalid email or password' });
    }

    user.last_login_at = new Date();
    user.failed_login_attempts = 0;
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
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    const genericMessage = 'If an account exists for that email, a reset code has been sent.';
    if (!user) return res.json({ message: genericMessage });
    if (!user.is_active) return res.status(403).json({ message: 'Account deactivated. Contact an administrator to unlock it.' });

    const latestRequest = await PasswordReset.findOne({ user_id: user._id, purpose: 'forgot' }).sort('-createdAt');
    const secondsSinceLastRequest = latestRequest
      ? Math.floor((Date.now() - latestRequest.createdAt.getTime()) / 1000)
      : 60;
    if (secondsSinceLastRequest < 60) {
      return res.status(429).json({ message: `Please wait ${60 - secondsSinceLastRequest} seconds before requesting another code.`, retry_after_seconds: 60 - secondsSinceLastRequest });
    }

    // Invalidate earlier codes and issue a short-lived, one-time verification code.
    await PasswordReset.updateMany(
      { user_id: user._id, is_used: false },
      { $set: { is_used: true } },
    );
    const code = crypto.randomInt(100000, 1000000).toString();
    const tokenHash = crypto.createHash('sha256').update(code).digest('hex');
    const expires_at = new Date(Date.now() + 5 * 60 * 1000);

    const resetRecord = await PasswordReset.create({
      user_id: user._id,
      token: tokenHash,
      expires_at,
      purpose: 'forgot',
    });

    const emailText = `Hello ${user.full_name || ''},\n\nYour EcoTrade password reset code is: ${code}\n\nThis code expires in 5 minutes. If you did not request this, you can ignore this email.`;
    const emailHtml = `<p>Hello ${user.full_name || ''},</p><p>Your EcoTrade password reset code is:</p><p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #05401C;">${code}</p><p>This code expires in 5 minutes. If you did not request this, you can ignore this email.</p>`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'EcoTrade password reset code',
        text: emailText,
        html: emailHtml,
      });
    } catch (emailError) {
      await PasswordReset.deleteOne({ _id: resetRecord._id });
      return res.status(503).json({ message: 'Unable to send reset email. Please try again later.' });
    }

    res.json({ message: genericMessage });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.requestChangePasswordOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.is_active) return res.status(403).json({ message: 'Account deactivated. Contact an administrator to unlock it.' });
    const latest = await PasswordReset.findOne({ user_id: user._id, purpose: 'change' }).sort('-createdAt');
    const elapsed = latest ? Math.floor((Date.now() - latest.createdAt.getTime()) / 1000) : 60;
    if (elapsed < 60) return res.status(429).json({ message: `Please wait ${60 - elapsed} seconds before requesting another code.`, retry_after_seconds: 60 - elapsed });
    await PasswordReset.updateMany({ user_id: user._id, purpose: 'change', is_used: false }, { $set: { is_used: true } });
    const code = crypto.randomInt(100000, 1000000).toString();
    const resetRecord = await PasswordReset.create({
      user_id: user._id,
      token: crypto.createHash('sha256').update(code).digest('hex'),
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
      purpose: 'change',
    });
    try {
      await sendEmail({
        to: user.email,
        subject: 'EcoTrade change password code',
        text: `Your EcoTrade password change code is: ${code}. It expires in 5 minutes.`,
        html: `<p>Your EcoTrade password change code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 5 minutes.</p>`,
      });
    } catch (emailError) {
      await PasswordReset.deleteOne({ _id: resetRecord._id });
      throw emailError;
    }
    res.json({ message: 'A verification code was sent to your email.' });
  } catch (e) { res.status(503).json({ message: 'Unable to send verification email. Please try again later.' }); }
};

exports.verifyChangePasswordOtp = async (req, res) => {
  try {
    const token = req.body.token?.trim();
    if (!/^\d{6}$/.test(token || '')) return res.status(400).json({ message: 'Enter the 6-digit code' });
    const user = await User.findById(req.user._id);
    if (!user?.is_active) return res.status(403).json({ message: 'Account deactivated. Contact an administrator to unlock it.' });
    const record = await PasswordReset.findOne({ user_id: user._id, purpose: 'change', token: crypto.createHash('sha256').update(token).digest('hex'), expires_at: { $gt: new Date() }, is_used: false });
    if (!record) {
      const deactivated = await recordSecurityFailure(user, 'failed_otp_attempts', 'Too many invalid password change OTP attempts');
      return res.status(deactivated ? 403 : 400).json({ message: deactivated ? 'Account deactivated after too many invalid OTP attempts. Contact an administrator.' : 'Invalid or expired code' });
    }
    record.verified_at = new Date();
    await record.save();
    user.failed_otp_attempts = 0;
    await user.save();
    res.json({ message: 'Code verified. You can now change your password.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.changePasswordWithOtp = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
    const user = await User.findById(req.user._id);
    if (!user?.is_active) return res.status(403).json({ message: 'Account deactivated. Contact an administrator to unlock it.' });
    const record = await PasswordReset.findOne({ user_id: user._id, purpose: 'change', verified_at: { $ne: null }, expires_at: { $gt: new Date() }, is_used: false });
    if (!record) return res.status(400).json({ message: 'Verify the email code before changing your password' });
    user.password_hash = newPassword;
    user.failed_login_attempts = 0;
    await user.save();
    record.is_used = true;
    await record.save();
    await PasswordReset.updateMany({ user_id: user._id, purpose: 'change', is_used: false }, { $set: { is_used: true } });
    res.json({ message: 'Password changed successfully' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.verifyResetCode = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const token = req.body.token?.trim();
    if (!email || !/^\d{6}$/.test(token || '')) return res.status(400).json({ message: 'Enter your email and 6-digit code' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid or expired password reset code' });
    if (!user.is_active) return res.status(403).json({ message: 'Account deactivated. Contact an administrator to unlock it.' });
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await PasswordReset.findOne({ user_id: user._id, purpose: 'forgot', token: tokenHash, expires_at: { $gt: new Date() }, is_used: false });
    if (!resetRecord) {
      const deactivated = await recordSecurityFailure(user, 'failed_otp_attempts', 'Too many invalid password reset OTP attempts');
      return res.status(deactivated ? 403 : 400).json({ message: deactivated ? 'Account deactivated after too many invalid OTP attempts. Contact an administrator.' : 'Invalid or expired password reset code' });
    }
    resetRecord.verified_at = new Date();
    await resetRecord.save();
    user.failed_otp_attempts = 0;
    await user.save();
    res.json({ message: 'Code verified. Choose a new password.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    if (!email || !newPassword) return res.status(400).json({ message: 'Email and new password are required' });
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid or expired password reset code' });

    const resetRecord = await PasswordReset.findOne({
      user_id: user._id,
      purpose: 'forgot',
      expires_at: { $gt: new Date() },
      is_used: false,
      verified_at: { $ne: null },
    });
    if (!resetRecord) return res.status(400).json({ message: 'Verify your reset code before changing the password' });

    user.password_hash = newPassword;
    await user.save();

    resetRecord.is_used = true;
    await resetRecord.save();

    // Invalidate every other outstanding reset request for this account.
    await PasswordReset.updateMany(
      { user_id: user._id, is_used: false },
      { $set: { is_used: true } },
    );

    res.json({ message: 'Password has been reset successfully.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
