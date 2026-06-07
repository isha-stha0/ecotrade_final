import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../services/cart_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});
  @override State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _form = GlobalKey<FormState>();
  final _street = TextEditingController(), _city = TextEditingController(text: 'Kathmandu'), _zip = TextEditingController();
  String _payment = 'cod';
  bool _loading = false;

  Future<void> _place() async {
    if (!_form.currentState!.validate()) return;
    final cart = context.read<CartProvider>();
    if (cart.items.isEmpty) return;
    setState(() => _loading = true);
    try {
      await ApiService().placeOrder({
        'items': cart.items.map((i) => {'product': i.product.id, 'quantity': i.quantity}).toList(),
        'shippingAddress': {'street': _street.text, 'city': _city.text, 'zip': _zip.text, 'country': 'Nepal'},
        'paymentMethod': _payment,
      });
      cart.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order placed successfully! 🎉'), backgroundColor: AppColors.green600));
        Navigator.of(context)..pop()..pop();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.red));
    } finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(key: _form, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          EcoCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [Icon(Icons.location_on_outlined, color: AppColors.green400, size: 18), SizedBox(width: 8), Text('Shipping Address', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary))]),
            const SizedBox(height: 16),
            EcoTextField(label: 'Street Address *', hint: '123 Main St, Ward 5', controller: _street, validator: (v) => v!.isEmpty ? 'Required' : null),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: EcoTextField(label: 'City *', controller: _city, validator: (v) => v!.isEmpty ? 'Required' : null)),
              const SizedBox(width: 12),
              Expanded(child: EcoTextField(label: 'ZIP', hint: '44600', controller: _zip, keyboardType: TextInputType.number)),
            ]),
          ])),
          const SizedBox(height: 16),
          EcoCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [Icon(Icons.payment_outlined, color: AppColors.green400, size: 18), SizedBox(width: 8), Text('Payment Method', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary))]),
            const SizedBox(height: 12),
            ...[
              {'v':'cod','l':'Cash on Delivery','i':'💵','d':'Pay when you receive'},
              {'v':'esewa','l':'eSewa','i':'📱','d':'Digital wallet'},
              {'v':'khalti','l':'Khalti','i':'💜','d':'Mobile payment'},
            ].map((m) => GestureDetector(
              onTap: () => setState(() => _payment = m['v']!),
              child: Container(margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _payment == m['v'] ? AppColors.green500.withOpacity(0.08) : AppColors.bgSecondary,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: _payment == m['v'] ? AppColors.green500.withOpacity(0.3) : AppColors.border),
                ),
                child: Row(children: [
                  Text(m['i']!, style: const TextStyle(fontSize: 22)),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(m['l']!, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _payment == m['v'] ? AppColors.green400 : AppColors.textPrimary)),
                    Text(m['d']!, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  ])),
                  if (_payment == m['v']) const Icon(Icons.check_circle, color: AppColors.green500, size: 18),
                ]),
              ),
            )),
          ])),
          const SizedBox(height: 16),
          EcoCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Order Summary', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            const SizedBox(height: 12),
            ...cart.items.map((i) => Padding(padding: const EdgeInsets.only(bottom: 6),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Expanded(child: Text('${i.product.name} × ${i.quantity}', style: const TextStyle(fontSize: 13, color: AppColors.textMuted))),
                Text('NPR ${i.subtotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              ]))),
            const Divider(),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Total', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              Text('NPR ${cart.total.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.green400, fontFamily: 'monospace')),
            ]),
          ])),
          const SizedBox(height: 24),
          EcoButton(text: 'Place Order — NPR ${cart.total.toStringAsFixed(0)}', loading: _loading, width: double.infinity, onPressed: _place),
          const SizedBox(height: 40),
        ])),
      ),
    );
  }
}
