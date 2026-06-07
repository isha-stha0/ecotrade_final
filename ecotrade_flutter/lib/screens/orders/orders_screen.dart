import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});
  @override State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<OrderModel> _orders = [];
  bool _loading = true;

  @override void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final o = await ApiService().getMyOrders();
      if (mounted) setState(() { _orders = o; _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  static const _emoji = {'placed':'📦','confirmed':'✅','processing':'⚙️','shipped':'🚚','delivered':'🎉','cancelled':'❌'};

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('My Orders')),
    body: _loading ? const EcoLoading()
      : _orders.isEmpty ? const EmptyState(emoji: '📦', title: 'No orders yet', subtitle: 'Browse our eco shop and place your first order')
      : RefreshIndicator(onRefresh: _load, color: AppColors.green500, backgroundColor: AppColors.bgCard,
          child: ListView.builder(
            padding: const EdgeInsets.all(16), itemCount: _orders.length,
            itemBuilder: (_, i) {
              final o = _orders[i];
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Padding(padding: const EdgeInsets.fromLTRB(16,14,16,10),
                    child: Row(children: [
                      Text('${_emoji[o.orderStatus] ?? '📦'} #${o.id.substring(o.id.length-8).toUpperCase()}',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary, fontFamily: 'monospace')),
                      const Spacer(), StatusBadge(o.orderStatus),
                    ])),
                  Padding(padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(children: [
                      Text('NPR ${o.totalAmount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary, fontFamily: 'monospace')),
                      const SizedBox(width: 10), StatusBadge(o.paymentStatus),
                      const Spacer(),
                      Text(o.createdAt.toLocal().toString().split(' ')[0], style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ])),
                  const Divider(indent: 16, endIndent: 16),
                  ...o.items.map((it) => Padding(padding: const EdgeInsets.fromLTRB(16,6,16,0),
                    child: Row(children: [
                      const Text('♻️', style: TextStyle(fontSize: 16)), const SizedBox(width: 8),
                      Expanded(child: Text('${it.productName ?? 'Product'} × ${it.quantity}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted))),
                      Text('NPR ${it.price.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    ]))),
                  const SizedBox(height: 14),
                ]),
              );
            },
          )),
  );
}
