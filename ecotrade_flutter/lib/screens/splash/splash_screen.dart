import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_provider.dart';
import '../../utils/app_theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _logo, _text, _spin;
  late Animation<double> _scale, _fade, _slide;

  @override
  void initState() {
    super.initState();
    _spin = AnimationController(vsync: this, duration: const Duration(seconds: 6))..repeat();
    _logo = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _text = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _scale = CurvedAnimation(parent: _logo, curve: Curves.elasticOut).drive(Tween(begin: 0.0, end: 1.0));
    _fade  = CurvedAnimation(parent: _text, curve: Curves.easeIn).drive(Tween(begin: 0.0, end: 1.0));
    _slide = CurvedAnimation(parent: _text, curve: Curves.easeOut).drive(Tween(begin: 24.0, end: 0.0));
    _run();
  }

  Future<void> _run() async {
    await Future.delayed(const Duration(milliseconds: 300));
    _logo.forward();
    await Future.delayed(const Duration(milliseconds: 500));
    _text.forward();
    await Future.delayed(const Duration(milliseconds: 1800));
    if (!mounted) return;
    final auth = context.read<AuthProvider>();
    Navigator.of(context).pushReplacementNamed(auth.isLoggedIn ? '/main' : '/login');
  }

  @override void dispose() { _logo.dispose(); _text.dispose(); _spin.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.bg,
    body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      const Spacer(flex: 2),
      AnimatedBuilder(
        animation: Listenable.merge([_logo, _spin]),
        builder: (_, __) => Opacity(
          opacity: _scale.value.clamp(0.0, 1.0),
          child: Transform.scale(scale: _scale.value,
            child: SizedBox(width: 150, height: 150, child: Stack(alignment: Alignment.center, children: [
              Transform.rotate(angle: _spin.value * 6.2832,
                child: CustomPaint(size: const Size(140, 140), painter: _ArcPainter())),
              ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: Image.asset(
                  'assets/images/ecotrade_logo.jpg',
                  width: 118,
                  height: 104,
                  fit: BoxFit.contain,
                ),
              ),
            ])),
          ),
        ),
      ),
      const SizedBox(height: 32),
      AnimatedBuilder(
        animation: _text,
        builder: (_, __) => Opacity(opacity: _fade.value,
          child: Transform.translate(offset: Offset(0, _slide.value),
            child: Column(children: [
              RichText(text: const TextSpan(children: [
                TextSpan(text: 'Eco', style: TextStyle(fontSize: 44, fontWeight: FontWeight.w800, color: AppColors.textPrimary, fontFamily: 'Plus Jakarta Sans', letterSpacing: -1.5)),
                TextSpan(text: 'Trade', style: TextStyle(fontSize: 44, fontWeight: FontWeight.w800, color: AppColors.green400, fontFamily: 'Plus Jakarta Sans', letterSpacing: -1.5)),
              ])),
              const SizedBox(height: 8),
              const Text('Smart Recycling Marketplace', style: TextStyle(fontSize: 14, color: AppColors.textMuted, fontWeight: FontWeight.w500)),
            ]),
          ),
        ),
      ),
      const Spacer(flex: 2),
      AnimatedBuilder(
        animation: _text,
        builder: (_, __) => Opacity(opacity: _fade.value,
          child: Padding(padding: const EdgeInsets.only(bottom: 52), child: Column(children: [
            SizedBox(width: 100, child: LinearProgressIndicator(
              backgroundColor: AppColors.border,
              valueColor: const AlwaysStoppedAnimation(AppColors.green500), minHeight: 2)),
            const SizedBox(height: 12),
            const Text("Nepal's Green Marketplace 🌱", style: TextStyle(fontSize: 11, color: AppColors.textDim)),
          ])),
        ),
      ),
    ])),
  );
}

class _ArcPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2, cy = size.height / 2, r = size.width / 2 - 4;
    final rect = Rect.fromCircle(center: Offset(cx, cy), radius: r);
    for (int i = 0; i < 3; i++) {
      canvas.drawArc(rect, i * 2.094 - 0.87, 1.74, false, Paint()
        ..color = [AppColors.green500, AppColors.green600, AppColors.green400][i]
        ..strokeWidth = 3 ..style = PaintingStyle.stroke ..strokeCap = StrokeCap.round);
    }
  }
  @override bool shouldRepaint(_) => false;
}
