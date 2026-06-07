import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onRegister;
  const LoginScreen({super.key, required this.onRegister});
  @override State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _pass  = TextEditingController();
  bool _loading = false, _showPass = false;

  void _fill(String e, String p) { _email.text = e; _pass.text = p; }

  Future<void> _login() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await context.read<AuthProvider>().login(_email.text.trim(), _pass.text);
      if (mounted) Navigator.of(context).pushReplacementNamed('/main');
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: AppColors.red));
    } finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(child: SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(key: _form, child: Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
        const SizedBox(height: 40),
        Container(width: 72, height: 72,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [AppColors.green500, AppColors.green700]),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: AppColors.green500.withOpacity(0.4), blurRadius: 24, offset: const Offset(0,8))],
          ),
          child: const Icon(Icons.eco_rounded, color: Colors.white, size: 36)),
        const SizedBox(height: 20),
        const Text('Welcome Back', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.textPrimary, letterSpacing: -0.5)),
        const SizedBox(height: 6),
        const Text('Sign in to EcoTrade', style: TextStyle(fontSize: 14, color: AppColors.textMuted)),
        const SizedBox(height: 36),
        EcoTextField(label: 'Email', hint: 'you@example.com', controller: _email,
          keyboardType: TextInputType.emailAddress,
          prefixIcon: const Icon(Icons.email_outlined, color: AppColors.textMuted, size: 20),
          validator: (v) => v!.isEmpty ? 'Enter email' : null),
        const SizedBox(height: 16),
        EcoTextField(label: 'Password', hint: '••••••••', controller: _pass,
          obscureText: !_showPass,
          prefixIcon: const Icon(Icons.lock_outline, color: AppColors.textMuted, size: 20),
          suffixIcon: IconButton(
            icon: Icon(_showPass ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: AppColors.textMuted, size: 20),
            onPressed: () => setState(() => _showPass = !_showPass)),
          validator: (v) => v!.isEmpty ? 'Enter password' : null),
        const SizedBox(height: 28),
        EcoButton(text: 'Sign In', onPressed: _login, loading: _loading, width: double.infinity),
        const SizedBox(height: 16),
        GestureDetector(
          onTap: widget.onRegister,
          child: RichText(text: const TextSpan(children: [
            TextSpan(text: "Don't have an account? ", style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
            TextSpan(text: 'Create one', style: TextStyle(color: AppColors.green400, fontSize: 14, fontWeight: FontWeight.w600)),
          ]))),
        const SizedBox(height: 32),
        // Demo credentials
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('DEMO CREDENTIALS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.green400, letterSpacing: 0.08)),
            const SizedBox(height: 10),
            _DemoBtn('Admin', 'admin@ecotrade.com', 'admin123', () => _fill('admin@ecotrade.com', 'admin123')),
            const SizedBox(height: 6),
            _DemoBtn('User', 'user@ecotrade.com', 'user1234', () => _fill('user@ecotrade.com', 'user1234')),
          ]),
        ),
      ])),
    )),
  );
}

class _DemoBtn extends StatelessWidget {
  final String label, email, pass;
  final VoidCallback onTap;
  const _DemoBtn(this.label, this.email, this.pass, this.onTap);
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: AppColors.bgSecondary, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.border)),
      child: Row(children: [
        Text('$label: ', style: const TextStyle(color: AppColors.green400, fontSize: 12, fontWeight: FontWeight.w700)),
        Text('$email / $pass', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
      ]),
    ),
  );
}
