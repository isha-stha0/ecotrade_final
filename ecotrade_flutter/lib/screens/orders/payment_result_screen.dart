import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../services/cart_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';

class PaymentResultScreen extends StatefulWidget {
  final bool success;

  const PaymentResultScreen({super.key, required this.success});

  @override
  State<PaymentResultScreen> createState() => _PaymentResultScreenState();
}

class _PaymentResultScreenState extends State<PaymentResultScreen> {
  bool _loading = true;
  String? _message;

  @override
  void initState() {
    super.initState();
    _handleResult();
  }

  Future<void> _handleResult() async {
    try {
      final params = Uri.base.queryParameters;
      if (widget.success) {
        await ApiService().verifyEsewaPayment({
          if (params['data'] != null) 'data': params['data'],
          if (params['ref_id'] != null) 'ref_id': params['ref_id'],
          if (params['transaction_uuid'] != null) 'transaction_uuid': params['transaction_uuid'],
          if (params['orderId'] != null) 'orderId': params['orderId'],
        });
        if (mounted) context.read<CartProvider>().clear();
        _message = 'Your eSewa payment was verified and the order is confirmed.';
      } else {
        if (params['orderId'] != null) {
          await ApiService().handleEsewaFailure({
            'orderId': params['orderId'],
            'failure_reason': params['failure_reason'] ?? 'Payment was cancelled or failed.',
          });
        }
        _message = 'Payment was cancelled or failed. Your order was not confirmed.';
      }
    } catch (e) {
      _message = e.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSuccess = widget.success;
    return Scaffold(
      appBar: AppBar(title: Text(isSuccess ? 'Payment Success' : 'Payment Failed')),
      body: _loading
          ? const EcoLoading()
          : Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(
                    isSuccess ? Icons.check_circle_outline : Icons.error_outline,
                    size: 72,
                    color: isSuccess ? AppColors.green500 : AppColors.red,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    isSuccess ? 'Payment Successful' : 'Payment Failed',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _message ?? '',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 24),
                  EcoButton(
                    text: isSuccess ? 'Go to My Orders' : 'Back to Shop',
                    icon: isSuccess ? Icons.receipt_long_outlined : Icons.shopping_bag_outlined,
                    onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil('/main', (_) => false),
                  ),
                ]),
              ),
            ),
    );
  }
}
