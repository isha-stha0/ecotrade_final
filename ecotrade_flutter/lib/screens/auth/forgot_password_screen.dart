import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../services/api_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  final String initialEmail;

  const ForgotPasswordScreen({super.key, this.initialEmail = ''});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  static const darkGreen = Color(0xFF05401C);
  static const lightGreen = Color(0xFF44A81D);

  final _requestForm = GlobalKey<FormState>();
  final _resetForm = GlobalKey<FormState>();
  late final TextEditingController _email;
  final _code = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  bool _codeSent = false;
  bool _codeVerified = false;
  bool _loading = false;
  bool _showPassword = false;
  int _resendSeconds = 0;
  Timer? _resendTimer;

  @override
  void initState() {
    super.initState();
    _email = TextEditingController(text: widget.initialEmail);
  }

  @override
  void dispose() {
    _email.dispose();
    _code.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    _resendTimer?.cancel();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    final email = value?.trim() ?? '';
    if (email.isEmpty) return 'Enter your email';
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      return 'Enter a valid email';
    }
    return null;
  }

  void _message(String message, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: error ? Colors.red : darkGreen,
    ));
  }

  Future<void> _requestCode() async {
    if (!_requestForm.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final message = await ApiService().forgotPassword(_email.text.trim());
      if (!mounted) return;
      setState(() {
        _codeSent = true;
        _codeVerified = false;
      });
      _startResendCooldown();
      _message(message);
    } catch (e) {
      if (mounted) _message(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _startResendCooldown() {
    _resendTimer?.cancel();
    setState(() => _resendSeconds = 60);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || _resendSeconds <= 1) {
        timer.cancel();
        if (mounted) setState(() => _resendSeconds = 0);
      } else {
        setState(() => _resendSeconds--);
      }
    });
  }

  Future<void> _verifyCode() async {
    if (!_resetForm.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final message = await ApiService()
          .verifyResetCode(_email.text.trim(), _code.text.trim());
      if (!mounted) return;
      setState(() => _codeVerified = true);
      _message(message);
    } catch (e) {
      if (mounted) _message(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resetPassword() async {
    if (!_resetForm.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final message = await ApiService().resetPassword(
        _email.text.trim(),
        _password.text,
      );
      if (!mounted) return;
      _message(message);
      Navigator.of(context).pop();
    } catch (e) {
      if (mounted) _message(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  InputDecoration _decoration(String label, IconData icon, {Widget? suffix}) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: darkGreen.withValues(alpha: .65)),
      suffixIcon: suffix,
      filled: true,
      fillColor: Colors.grey.shade50,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: lightGreen, width: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: darkGreen,
        elevation: 0,
        title: const Text('Reset password'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.lock_reset_rounded, size: 72, color: lightGreen),
              const SizedBox(height: 18),
              Text(
                _codeVerified
                    ? 'Choose a new password'
                    : (_codeSent
                        ? 'Check your email'
                        : 'Forgot your password?'),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: darkGreen,
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                _codeVerified
                    ? 'Your email is verified. Create a strong new password.'
                    : (_codeSent
                        ? 'Enter the six-digit code we sent. It expires in 5 minutes.'
                        : 'Enter your account email and we will send you a reset code.'),
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: darkGreen.withValues(alpha: .7), height: 1.4),
              ),
              const SizedBox(height: 32),
              Form(
                key: _requestForm,
                child: TextFormField(
                  controller: _email,
                  enabled: !_codeSent && !_loading,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  validator: _validateEmail,
                  decoration: _decoration('Email', Icons.email_outlined),
                ),
              ),
              if (_codeSent && !_codeVerified) ...[
                const SizedBox(height: 18),
                Form(
                  key: _resetForm,
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _code,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(6),
                        ],
                        decoration:
                            _decoration('6-digit code', Icons.pin_outlined),
                        validator: (value) => value?.length == 6
                            ? null
                            : 'Enter the 6-digit code',
                      ),
                    ],
                  ),
                ),
              ],
              if (_codeVerified) ...[
                const SizedBox(height: 18),
                Form(
                  key: _resetForm,
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _password,
                        obscureText: !_showPassword,
                        decoration: _decoration(
                          'New password',
                          Icons.lock_outline,
                          suffix: IconButton(
                            onPressed: () =>
                                setState(() => _showPassword = !_showPassword),
                            icon: Icon(_showPassword
                                ? Icons.visibility_off
                                : Icons.visibility),
                          ),
                        ),
                        validator: (value) => (value?.length ?? 0) < 8
                            ? 'Use at least 8 characters'
                            : null,
                      ),
                      const SizedBox(height: 18),
                      TextFormField(
                        controller: _confirmPassword,
                        obscureText: !_showPassword,
                        decoration:
                            _decoration('Confirm password', Icons.lock_outline),
                        validator: (value) => value != _password.text
                            ? 'Passwords do not match'
                            : null,
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 28),
              SizedBox(
                height: 54,
                child: ElevatedButton(
                  onPressed: _loading
                      ? null
                      : (_codeVerified
                          ? _resetPassword
                          : (_codeSent ? _verifyCode : _requestCode)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: darkGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : Text(_codeVerified
                          ? 'Change password'
                          : (_codeSent ? 'Verify code' : 'Send OTP')),
                ),
              ),
              if (_codeSent && !_codeVerified)
                TextButton(
                  onPressed:
                      _loading || _resendSeconds > 0 ? null : _requestCode,
                  child: Text(
                      _resendSeconds > 0
                          ? 'Resend OTP in ${_resendSeconds}s'
                          : 'Resend OTP',
                      style: const TextStyle(color: lightGreen)),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
