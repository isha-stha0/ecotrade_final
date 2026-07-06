import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onRegister;
  const LoginScreen({super.key, required this.onRegister});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _pass = TextEditingController();
  bool _loading = false, _showPass = false;

  static const Color darkGreen = Color(0xFF05401C);
  static const Color lightGreen = Color(0xFF44A81D);

  void _fill(String e, String p) {
    _email.text = e;
    _pass.text = p;
  }

  Future<void> _login() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await context.read<AuthProvider>().login(_email.text.trim(), _pass.text);
      if (mounted) Navigator.of(context).pushReplacementNamed('/main');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28.0, vertical: 40.0),
          child: Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Image.asset(
                  'assets/images/ecotrade_logo.jpg',
                  width: 280,
                  height: 230,
                  fit: BoxFit.contain,
                ),
                const SizedBox(height: 10),
                const Text(
                  'Welcome Back',
                  style: TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w800,
                    color: darkGreen,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Sign in to EcoTrade',
                  style: TextStyle(
                    fontSize: 16,
                    color: darkGreen.withOpacity(0.7),
                  ),
                ),
                const SizedBox(height: 40),
                // Email field – now with explicit black text style
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(
                      color: Colors.black), // <-- FIX: black input text
                  decoration: InputDecoration(
                    labelText: 'Email',
                    hintText: 'you@example.com',
                    hintStyle: TextStyle(color: darkGreen.withOpacity(0.5)),
                    labelStyle: const TextStyle(color: darkGreen),
                    prefixIcon: Icon(
                      Icons.email_outlined,
                      color: darkGreen.withOpacity(0.6),
                    ),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide:
                          BorderSide(color: darkGreen.withOpacity(0.15)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: lightGreen, width: 2),
                    ),
                    errorBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Colors.red),
                    ),
                    focusedErrorBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Colors.red, width: 2),
                    ),
                  ),
                  validator: (v) => v!.isEmpty ? 'Enter email' : null,
                ),
                const SizedBox(height: 18),
                // Password field – also with black text
                TextFormField(
                  controller: _pass,
                  obscureText: !_showPass,
                  style: const TextStyle(
                      color: Colors.black), // <-- FIX: black input text
                  decoration: InputDecoration(
                    labelText: 'Password',
                    hintText: '••••••••',
                    hintStyle: TextStyle(color: darkGreen.withOpacity(0.5)),
                    labelStyle: const TextStyle(color: darkGreen),
                    prefixIcon: Icon(
                      Icons.lock_outline,
                      color: darkGreen.withOpacity(0.6),
                    ),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _showPass
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: darkGreen.withOpacity(0.6),
                      ),
                      onPressed: () => setState(() => _showPass = !_showPass),
                    ),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide:
                          BorderSide(color: darkGreen.withOpacity(0.15)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: lightGreen, width: 2),
                    ),
                    errorBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Colors.red),
                    ),
                    focusedErrorBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Colors.red, width: 2),
                    ),
                  ),
                  validator: (v) => v!.isEmpty ? 'Enter password' : null,
                ),
                const SizedBox(height: 32),
                // Sign In button
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _login,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: darkGreen,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      disabledBackgroundColor: darkGreen.withOpacity(0.6),
                    ),
                    child: _loading
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text(
                            'Sign In',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 20),
                // Register link
                GestureDetector(
                  onTap: widget.onRegister,
                  child: RichText(
                    text: TextSpan(
                      style: TextStyle(
                        fontSize: 15,
                        color: darkGreen.withOpacity(0.7),
                      ),
                      children: [
                        const TextSpan(text: "Don't have an account? "),
                        TextSpan(
                          text: 'Create one',
                          style: TextStyle(
                            color: lightGreen,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 36),
                // Demo credentials card
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: lightGreen.withOpacity(0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'DEMO CREDENTIALS',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: lightGreen,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _DemoBtn(
                        'Admin',
                        'admin@ecotrade.com',
                        'admin123',
                        () => _fill('admin@ecotrade.com', 'admin123'),
                      ),
                      const SizedBox(height: 8),
                      _DemoBtn(
                        'User',
                        'user@ecotrade.com',
                        'user1234',
                        () => _fill('user@ecotrade.com', 'user1234'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DemoBtn extends StatelessWidget {
  final String label, email, pass;
  final VoidCallback onTap;
  const _DemoBtn(this.label, this.email, this.pass, this.onTap);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          children: [
            Text(
              '$label: ',
              style: const TextStyle(
                color: Color(0xFF05401C),
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
            Expanded(
              child: Text(
                '$email / $pass',
                style: TextStyle(
                  color: Colors.grey.shade700,
                  fontSize: 13,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
