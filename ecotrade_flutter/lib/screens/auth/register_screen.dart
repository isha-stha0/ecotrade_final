import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';

class RegisterScreen extends StatefulWidget {
  final VoidCallback onLogin;
  const RegisterScreen({super.key, required this.onLogin});
  @override State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController(), _email = TextEditingController();
  final _phone = TextEditingController(), _pass = TextEditingController();
  final _confirm = TextEditingController();
  bool _loading = false, _showPass = false;
  String _role = 'customer';

  Future<void> _register() async {
    if (!_form.currentState!.validate()) return;
    if (_pass.text != _confirm.text) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Passwords do not match'), backgroundColor: AppColors.red));
      return;
    }
    setState(() => _loading = true);
    try {
      await context.read<AuthProvider>().register({'name': _name.text.trim(), 'email': _email.text.trim(), 'password': _pass.text, 'role': _role, 'phone': _phone.text.trim()});
      if (mounted) Navigator.of(context).pushReplacementNamed('/main');
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.red));
    } finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(child: SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(key: _form, child: Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
        const SizedBox(height: 24),
        Container(width: 64, height: 64,
          decoration: BoxDecoration(gradient: const LinearGradient(colors: [AppColors.green500, AppColors.green700]), borderRadius: BorderRadius.circular(18),
            boxShadow: [BoxShadow(color: AppColors.green500.withOpacity(0.4), blurRadius: 20, offset: const Offset(0,6))]),
          child: const Icon(Icons.eco_rounded, color: Colors.white, size: 30)),
        const SizedBox(height: 16),
        const Text('Join EcoTrade', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.textPrimary, letterSpacing: -0.5)),
        const SizedBox(height: 6),
        const Text('Start making a difference today', style: TextStyle(fontSize: 14, color: AppColors.textMuted)),
        const SizedBox(height: 32),
        EcoTextField(label: 'Full Name', hint: 'Your name', controller: _name,
          prefixIcon: const Icon(Icons.person_outline, color: AppColors.textMuted, size: 20),
          validator: (v) => v!.isEmpty ? 'Required' : null),
        const SizedBox(height: 14),
        EcoTextField(label: 'Email', hint: 'you@example.com', controller: _email,
          keyboardType: TextInputType.emailAddress,
          prefixIcon: const Icon(Icons.email_outlined, color: AppColors.textMuted, size: 20),
          validator: (v) => v!.isEmpty ? 'Required' : null),
        const SizedBox(height: 14),
        EcoTextField(label: 'Phone (Optional)', hint: '+977 9800000000', controller: _phone,
          keyboardType: TextInputType.phone,
          prefixIcon: const Icon(Icons.phone_outlined, color: AppColors.textMuted, size: 20)),
        const SizedBox(height: 14),
        // Role selector
        const Align(alignment: Alignment.centerLeft, child: Text('I want to', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 0.04))),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(child: _RoleCard('customer', '🛍️ Buy Products', 'Shop eco items', _role == 'customer', () => setState(() => _role = 'customer'))),
          const SizedBox(width: 10),
          Expanded(child: _RoleCard('contributor', '♻️ Submit Scrap', 'Earn EcoPoints', _role == 'contributor', () => setState(() => _role = 'contributor'))),
        ]),
        const SizedBox(height: 14),
        EcoTextField(label: 'Password', hint: 'Min 6 characters', controller: _pass,
          obscureText: !_showPass,
          prefixIcon: const Icon(Icons.lock_outline, color: AppColors.textMuted, size: 20),
          suffixIcon: IconButton(icon: Icon(_showPass ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: AppColors.textMuted, size: 20), onPressed: () => setState(() => _showPass = !_showPass)),
          validator: (v) => v!.length < 6 ? 'Min 6 characters' : null),
        const SizedBox(height: 14),
        EcoTextField(label: 'Confirm Password', hint: '••••••••', controller: _confirm,
          obscureText: true,
          prefixIcon: const Icon(Icons.lock_outline, color: AppColors.textMuted, size: 20),
          validator: (v) => v!.isEmpty ? 'Required' : null),
        const SizedBox(height: 28),
        EcoButton(text: 'Create Account 🌱', onPressed: _register, loading: _loading, width: double.infinity),
        const SizedBox(height: 16),
        GestureDetector(
          onTap: widget.onLogin,
          child: RichText(text: const TextSpan(children: [
            TextSpan(text: 'Already have an account? ', style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
            TextSpan(text: 'Sign in', style: TextStyle(color: AppColors.green400, fontSize: 14, fontWeight: FontWeight.w600)),
          ]))),
        const SizedBox(height: 24),
      ])),
    )),
  );
}

class _RoleCard extends StatelessWidget {
  final String value, label, desc;
  final bool selected;
  final VoidCallback onTap;
  const _RoleCard(this.value, this.label, this.desc, this.selected, this.onTap);
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: selected ? AppColors.green500.withOpacity(0.1) : AppColors.bgCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: selected ? AppColors.green500.withOpacity(0.4) : AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: selected ? AppColors.green400 : AppColors.textPrimary)),
        const SizedBox(height: 2),
        Text(desc, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
      ]),
    ),
  );
}
