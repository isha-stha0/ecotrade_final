import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../services/auth_provider.dart';
import '../../services/cart_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';
import '../scrap/scrap_map_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});
  @override State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _form = GlobalKey<FormState>();
  final _street = TextEditingController(), _city = TextEditingController(text: 'Kathmandu'), _zip = TextEditingController();
  String _payment = 'cod';
  bool _loading = false;
  bool _useEcoPoints = false;
  double? _shippingLat, _shippingLng;

  int _redeemablePoints(int ecoPoints, double total) {
    final availableChunks = ecoPoints ~/ 500;
    final payableChunks = total ~/ 10;
    final chunks = availableChunks < payableChunks ? availableChunks : payableChunks;
    return chunks * 500;
  }

  double _discountForPoints(int points) => (points ~/ 500) * 10.0;

  Map<String, dynamic> _orderPayload(CartProvider cart, int pointsUsed, double discountAmount) {
    return {
      'items': cart.items.map((i) => {'product': i.product.id, 'quantity': i.quantity}).toList(),
      'shippingAddress': {
        'street': _street.text,
        'city': _city.text,
        'zip': _zip.text,
        'country': 'Nepal',
        if (_shippingLat != null && _shippingLng != null) 'lat': _shippingLat,
        if (_shippingLat != null && _shippingLng != null) 'lng': _shippingLng,
      },
      'points_used': pointsUsed,
      'discount_amount': discountAmount,
    };
  }

  Future<void> _pickShippingLocation() async {
    final result = await Navigator.of(context).push<ScrapMapSelection>(
      MaterialPageRoute(
        builder: (_) => ScrapMapScreen(
          pickerMode: true,
          initialLat: _shippingLat,
          initialLng: _shippingLng,
          title: 'Pin Shipping Address',
          searchHint: 'Search delivery area or landmark',
          pickerInstruction: 'Drag the map or search to place your delivery pin',
          confirmLabel: 'Use This Shipping Location',
        ),
      ),
    );
    if (result == null || !mounted) return;
    setState(() {
      _shippingLat = result.lat;
      _shippingLng = result.lng;
      if (_street.text.trim().isEmpty) {
        _street.text = result.label;
      }
    });
  }

  Future<void> _place() async {
    if (!_form.currentState!.validate()) return;
    final cart = context.read<CartProvider>();
    if (cart.items.isEmpty) return;
    final user = context.read<AuthProvider>().user;
    final pointsUsed = _useEcoPoints ? _redeemablePoints(user?.ecoPoints ?? 0, cart.total) : 0;
    final discountAmount = _discountForPoints(pointsUsed);
    final payableTotal = (cart.total - discountAmount).clamp(0, double.infinity).toDouble();
    setState(() => _loading = true);
    try {
      if (_payment == 'esewa') {
        final data = await ApiService().initiateEsewaPayment(_orderPayload(cart, pointsUsed, discountAmount));
        final paymentUrl = data['payment_url']?.toString();
        if (paymentUrl == null || paymentUrl.isEmpty) {
          throw ApiException('Could not start eSewa payment');
        }
        final launched = await launchUrl(Uri.parse(paymentUrl), mode: LaunchMode.externalApplication);
        if (!launched) throw ApiException('Could not open eSewa payment page');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Complete eSewa payment of NPR ${payableTotal.toStringAsFixed(0)} in the opened page.'),
              backgroundColor: AppColors.green600,
            ),
          );
        }
      } else if (_payment == 'khalti') {
        throw ApiException('Khalti payment is not available yet. Please choose Cash on Delivery or eSewa.');
      } else {
        await ApiService().placeOrder({
          ..._orderPayload(cart, pointsUsed, discountAmount),
          'paymentMethod': 'cash_on_delivery',
        });
        cart.clear();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order placed successfully!'), backgroundColor: AppColors.green600));
          Navigator.of(context)..pop()..pop();
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.red));
    } finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final user = context.watch<AuthProvider>().user;
    final redeemablePoints = _redeemablePoints(user?.ecoPoints ?? 0, cart.total);
    final appliedPoints = _useEcoPoints ? redeemablePoints : 0;
    final discount = _discountForPoints(appliedPoints);
    final payableTotal = (cart.total - discount).clamp(0, double.infinity).toDouble();
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
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _pickShippingLocation,
              icon: const Icon(Icons.map_outlined, size: 18),
              label: Text(_shippingLat == null ? 'Pin shipping address on map' : 'Shipping pin selected'),
            ),
            if (_shippingLat != null && _shippingLng != null) ...[
              const SizedBox(height: 6),
              Text(
                '${_shippingLat!.toStringAsFixed(6)}, ${_shippingLng!.toStringAsFixed(6)}',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
            ],
          ])),
          const SizedBox(height: 16),
          EcoCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [Icon(Icons.eco_outlined, color: AppColors.green400, size: 18), SizedBox(width: 8), Text('EcoPoints Discount', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary))]),
            const SizedBox(height: 8),
            Text('Available: ${user?.ecoPoints ?? 0} EcoPoints. 500 EcoPoints = NPR 10 discount.', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _useEcoPoints,
              onChanged: redeemablePoints > 0 ? (v) => setState(() => _useEcoPoints = v) : null,
              title: Text(redeemablePoints > 0 ? 'Use $redeemablePoints EcoPoints' : 'Not enough EcoPoints to redeem'),
              subtitle: Text(redeemablePoints > 0 ? 'Discount: NPR ${_discountForPoints(redeemablePoints).toStringAsFixed(0)}' : 'You need at least 500 EcoPoints.'),
            ),
          ])),
          const SizedBox(height: 16),
          EcoCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [Icon(Icons.payment_outlined, color: AppColors.green400, size: 18), SizedBox(width: 8), Text('Payment Method', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary))]),
            const SizedBox(height: 12),
            ...[
              {'v':'cod','l':'Cash on Delivery','i':'💵','d':'Pay when you receive'},
              {'v':'esewa','l':'eSewa','i':'📱','d':'Pay through eSewa before order confirmation'},
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
            if (discount > 0)
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('EcoPoints discount ($appliedPoints pts)', style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                Text('- NPR ${discount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.green400)),
              ]),
            if (discount > 0) const SizedBox(height: 6),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Total', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              Text('NPR ${payableTotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.green400, fontFamily: 'monospace')),
            ]),
          ])),
          const SizedBox(height: 24),
          EcoButton(text: _payment == 'esewa' ? 'Pay with eSewa — NPR ${payableTotal.toStringAsFixed(0)}' : 'Place Order — NPR ${payableTotal.toStringAsFixed(0)}', loading: _loading, width: double.infinity, onPressed: _place),
          const SizedBox(height: 40),
        ])),
      ),
    );
  }
}
