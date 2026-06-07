import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/cart_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';
import 'cart_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final ProductModel product;
  const ProductDetailScreen({super.key, required this.product});
  @override State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _qty = 1;

  String get emoji {
    switch (widget.product.category) {
      case 'Stationery': return '📓'; case 'Bags': return '👜'; case 'Home Decor': return '🏺';
      case 'Office': return '🖊️'; case 'Storage': return '📦'; case 'Gardening': return '🌱';
      default: return '♻️';
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    return Scaffold(
      appBar: AppBar(title: Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [IconButton(icon: const Icon(Icons.shopping_cart_outlined),
          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen())))]),
      body: SingleChildScrollView(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(height: 220, width: double.infinity,
          decoration: BoxDecoration(gradient: LinearGradient(colors: [AppColors.green500.withOpacity(0.08), AppColors.bgCard])),
          child: Center(child: Text(emoji, style: const TextStyle(fontSize: 100)))),
        Padding(padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            _Tag(p.category),
            if (p.madeFrom != null && p.madeFrom!.isNotEmpty) ...[const SizedBox(width: 8), _Tag('♻️ ${p.madeFrom!}', color: AppColors.green400)],
          ]),
          const SizedBox(height: 12),
          Text(p.name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.textPrimary, letterSpacing: -0.3)),
          const SizedBox(height: 8),
          Text(p.description, style: const TextStyle(fontSize: 14, color: AppColors.textMuted, height: 1.7)),
          if (p.ecoImpact != null && p.ecoImpact!.isNotEmpty) ...[
            const SizedBox(height: 14),
            Container(padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.green500.withOpacity(0.06), borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.green500.withOpacity(0.15))),
              child: Row(children: [const Icon(Icons.eco, color: AppColors.green400, size: 16), const SizedBox(width: 8), Text(p.ecoImpact!, style: const TextStyle(fontSize: 13, color: AppColors.green400, fontWeight: FontWeight.w500))])),
          ],
          const SizedBox(height: 20),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('NPR ${p.price.toStringAsFixed(0)}', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: AppColors.textPrimary, fontFamily: 'monospace')),
            Row(children: [const Icon(Icons.inventory_2_outlined, size: 14, color: AppColors.textMuted), const SizedBox(width: 4), Text('${p.stock} in stock', style: const TextStyle(fontSize: 13, color: AppColors.textMuted))]),
          ]),
          const SizedBox(height: 20),
          Row(children: [
            const Text('Quantity', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
            const Spacer(),
            Container(
              decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
              child: Row(children: [
                IconButton(icon: const Icon(Icons.remove, size: 16, color: AppColors.textPrimary), onPressed: () { if (_qty > 1) setState(() => _qty--); }),
                Text('$_qty', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.textPrimary)),
                IconButton(icon: const Icon(Icons.add, size: 16, color: AppColors.textPrimary), onPressed: () { if (_qty < p.stock) setState(() => _qty++); }),
              ]),
            ),
          ]),
          const SizedBox(height: 20),
          EcoButton(text: p.stock > 0 ? 'Add to Cart' : 'Out of Stock',
            icon: Icons.shopping_cart_outlined, width: double.infinity,
            onPressed: p.stock > 0 ? () {
              context.read<CartProvider>().addItem(p, qty: _qty);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Added to cart! 🛍️'), backgroundColor: AppColors.green600));
              Navigator.pop(context);
            } : null),
        ])),
      ])),
    );
  }
}

class _Tag extends StatelessWidget {
  final String text; final Color? color;
  const _Tag(this.text, {this.color});
  @override Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(color: (color ?? AppColors.textMuted).withOpacity(0.1), borderRadius: BorderRadius.circular(100), border: Border.all(color: (color ?? AppColors.textMuted).withOpacity(0.25))),
    child: Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color ?? AppColors.textMuted)),
  );
}
