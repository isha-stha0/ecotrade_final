import 'package:flutter/material.dart';
import '../utils/app_theme.dart';
import '../models/models.dart';

// ── EcoButton ────────────────────────────────────────────────
class EcoButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool loading, outline;
  final IconData? icon;
  final double? width;
  const EcoButton({super.key, required this.text, this.onPressed, this.loading = false, this.outline = false, this.icon, this.width});

  @override
  Widget build(BuildContext context) {
    Widget child = loading
        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
        : Row(mainAxisSize: MainAxisSize.min, children: [
            if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
            Text(text),
          ]);

    if (outline) {
      return SizedBox(width: width, child: OutlinedButton(
        onPressed: loading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.green400,
          side: const BorderSide(color: AppColors.green500),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: child,
      ));
    }
    return SizedBox(width: width, child: ElevatedButton(
      onPressed: loading ? null : onPressed, child: child,
    ));
  }
}

// ── EcoCard ──────────────────────────────────────────────────
class EcoCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  const EcoCard({super.key, required this.child, this.padding, this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bgCard, borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: child,
    ),
  );
}

// ── StatusBadge ──────────────────────────────────────────────
class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge(this.status, {super.key});

  Color get color {
    switch (status.toLowerCase()) {
      case 'pending': return AppColors.yellow;
      case 'approved': case 'delivered': case 'completed': return AppColors.green400;
      case 'rejected': case 'cancelled': return AppColors.red;
      case 'collected': case 'recycling': case 'processing': return AppColors.purple;
      case 'confirmed': case 'shipped': return AppColors.blue;
      default: return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
    decoration: BoxDecoration(
      color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(100),
      border: Border.all(color: color.withOpacity(0.3)),
    ),
    child: Text(status.toUpperCase(),
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.05)),
  );
}

// ── StatCard ─────────────────────────────────────────────────
class StatCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const StatCard({super.key, required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) => EcoCard(
    child: Row(children: [
      Container(width: 44, height: 44,
        decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, color: color, size: 20)),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textPrimary, fontFamily: 'monospace')),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w500)),
      ])),
    ]),
  );
}

// ── ProductCard ──────────────────────────────────────────────
class ProductCard extends StatelessWidget {
  final ProductModel product;
  final VoidCallback? onTap, onAddToCart;
  const ProductCard({super.key, required this.product, this.onTap, this.onAddToCart});

  String get emoji {
    switch (product.category) {
      case 'Stationery': return '📓'; case 'Bags': return '👜';
      case 'Home Decor': return '🏺'; case 'Office': return '🖊️';
      case 'Storage': return '📦'; case 'Gardening': return '🌱';
      default: return '♻️';
    }
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Image area
        Container(
          height: 130,
          decoration: BoxDecoration(
            color: AppColors.green500.withOpacity(0.06),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: Stack(children: [
            Center(child: Text(emoji, style: const TextStyle(fontSize: 52))),
            if (product.madeFrom != null && product.madeFrom!.isNotEmpty)
              Positioned(top: 8, left: 8, child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: AppColors.green500.withOpacity(0.15), borderRadius: BorderRadius.circular(100), border: Border.all(color: AppColors.green500.withOpacity(0.3))),
                child: Text('♻️ ${product.madeFrom}', style: const TextStyle(fontSize: 9, color: AppColors.green400, fontWeight: FontWeight.w600)),
              )),
            if (product.stock <= 0)
              Positioned.fill(child: Container(
                decoration: BoxDecoration(color: Colors.black54, borderRadius: const BorderRadius.vertical(top: Radius.circular(16))),
                child: const Center(child: StatusBadge('out of stock')),
              )),
          ]),
        ),
        // Info
        Padding(
          padding: const EdgeInsets.all(12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(product.category, style: const TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.w600, letterSpacing: 0.05)),
            const SizedBox(height: 4),
            Text(product.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary), maxLines: 2, overflow: TextOverflow.ellipsis),
            if (product.ecoImpact != null && product.ecoImpact!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text('🌱 ${product.ecoImpact}', style: const TextStyle(fontSize: 10, color: AppColors.green400)),
            ],
            const SizedBox(height: 10),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('NPR ${product.price.toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary, fontFamily: 'monospace')),
              GestureDetector(
                onTap: product.stock > 0 ? onAddToCart : null,
                child: Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(color: product.stock > 0 ? AppColors.green500 : AppColors.textDim, borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.add, color: Colors.white, size: 18),
                ),
              ),
            ]),
          ]),
        ),
      ]),
    ),
  );
}

// ── EmptyState ───────────────────────────────────────────────
class EmptyState extends StatelessWidget {
  final String emoji, title, subtitle;
  final String? buttonLabel;
  final VoidCallback? onButton;
  const EmptyState({super.key, required this.emoji, required this.title, required this.subtitle, this.buttonLabel, this.onButton});

  @override
  Widget build(BuildContext context) => Center(child: Padding(
    padding: const EdgeInsets.all(40),
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Container(width: 80, height: 80,
        decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(40), border: Border.all(color: AppColors.border)),
        child: Center(child: Text(emoji, style: const TextStyle(fontSize: 32)))),
      const SizedBox(height: 16),
      Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
      const SizedBox(height: 8),
      Text(subtitle, style: const TextStyle(fontSize: 13, color: AppColors.textMuted), textAlign: TextAlign.center),
      if (buttonLabel != null) ...[
        const SizedBox(height: 20),
        EcoButton(text: buttonLabel!, onPressed: onButton),
      ],
    ]),
  ));
}

// ── EcoLoading ───────────────────────────────────────────────
class EcoLoading extends StatelessWidget {
  const EcoLoading({super.key});
  @override
  Widget build(BuildContext context) => const Center(
    child: CircularProgressIndicator(color: AppColors.green500, strokeWidth: 2));
}

// ── EcoTextField ─────────────────────────────────────────────
class EcoTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType? keyboardType;
  final Widget? prefixIcon, suffixIcon;
  final String? Function(String?)? validator;
  final int maxLines;
  final void Function(String)? onChanged;

  const EcoTextField({super.key, required this.label, this.hint, this.controller,
    this.obscureText = false, this.keyboardType, this.prefixIcon, this.suffixIcon,
    this.validator, this.maxLines = 1, this.onChanged});

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 0.04)),
    const SizedBox(height: 6),
    TextFormField(
      controller: controller, obscureText: obscureText,
      keyboardType: keyboardType, maxLines: maxLines,
      validator: validator, onChanged: onChanged,
      style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
      decoration: InputDecoration(hintText: hint, prefixIcon: prefixIcon, suffixIcon: suffixIcon),
    ),
  ]);
}
