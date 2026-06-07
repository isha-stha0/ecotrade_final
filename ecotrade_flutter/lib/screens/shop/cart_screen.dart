import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/cart_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';
import 'checkout_screen.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    return Scaffold(
      appBar: AppBar(title: Text('Cart (${cart.count})'),
        actions: [if (cart.items.isNotEmpty) TextButton(onPressed: cart.clear, child: const Text('Clear', style: TextStyle(color: AppColors.red)))]),
      body: cart.items.isEmpty
        ? const EmptyState(emoji: '🛍️', title: 'Cart is empty', subtitle: 'Add some eco-friendly products!')
        : Column(children: [
            Expanded(child: ListView.builder(
              padding: const EdgeInsets.all(16), itemCount: cart.items.length,
              itemBuilder: (_, i) {
                final item = cart.items[i];
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
                  child: Row(children: [
                    Container(width: 56, height: 56, decoration: BoxDecoration(color: AppColors.green500.withOpacity(0.08), borderRadius: BorderRadius.circular(10)), child: const Center(child: Text('♻️', style: TextStyle(fontSize: 26)))),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(item.product.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                      Text('NPR ${item.product.price.toStringAsFixed(0)} each', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                    ])),
                    Column(children: [
                      Row(children: [
                        _QtyBtn(Icons.remove, () => cart.updateQty(item.product.id, item.quantity - 1)),
                        Padding(padding: const EdgeInsets.symmetric(horizontal: 10), child: Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.textPrimary))),
                        _QtyBtn(Icons.add, () => cart.updateQty(item.product.id, item.quantity + 1)),
                      ]),
                      const SizedBox(height: 4),
                      Text('NPR ${item.subtotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary, fontFamily: 'monospace')),
                    ]),
                  ]),
                );
              },
            )),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(color: AppColors.bgSecondary, border: Border(top: BorderSide(color: AppColors.border))),
              child: Column(children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Total', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                  Text('NPR ${cart.total.toStringAsFixed(0)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.green400, fontFamily: 'monospace')),
                ]),
                const SizedBox(height: 14),
                EcoButton(text: 'Proceed to Checkout', width: double.infinity, icon: Icons.arrow_forward,
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CheckoutScreen()))),
              ]),
            ),
          ]),
    );
  }
}

class _QtyBtn extends StatelessWidget {
  final IconData icon; final VoidCallback onTap;
  const _QtyBtn(this.icon, this.onTap);
  @override Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(width: 28, height: 28,
      decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(6), border: Border.all(color: AppColors.border)),
      child: Icon(icon, size: 14, color: AppColors.textPrimary)),
  );
}
