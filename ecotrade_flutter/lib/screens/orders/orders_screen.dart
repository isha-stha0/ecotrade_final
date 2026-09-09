import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<OrderModel> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final orders = await ApiService().getMyOrders();
      if (mounted)
        setState(() {
          _orders = orders;
          _loading = false;
        });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Orders'),
        actions: [
          if (!_loading)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Text(
                  '${_orders.length} ${_orders.length == 1 ? 'order' : 'orders'}',
                  style:
                      const TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
              ),
            ),
        ],
      ),
      body: _loading
          ? const EcoLoading()
          : _orders.isEmpty
              ? const EmptyState(
                  emoji: '📦',
                  title: 'No orders yet',
                  subtitle: 'Browse our eco shop and place your first order',
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.green500,
                  backgroundColor: AppColors.bgCard,
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    itemCount: _orders.length,
                    itemBuilder: (_, i) => _OrderCard(order: _orders[i]),
                  ),
                ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final OrderModel order;
  const _OrderCard({required this.order});

  static const _emoji = {
    'pending': '⏳',
    'placed': '📦',
    'confirmed': '✅',
    'processing': '⚙️',
    'shipped': '🚚',
    'delivered': '🎉',
    'cancelled': '❌',
  };

  String get _shortId => order.id.length <= 8
      ? order.id.toUpperCase()
      : order.id.substring(order.id.length - 8).toUpperCase();

  @override
  Widget build(BuildContext context) {
    final date = order.createdAt.toLocal().toString().split(' ')[0];
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.darkGreen.withOpacity(.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.green500.withOpacity(.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(
                      _emoji[order.orderStatus] ?? '📦',
                      style: const TextStyle(fontSize: 22),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Order #$_shortId',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(date,
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.textMuted)),
                    ],
                  ),
                ),
                StatusBadge(order.orderStatus),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.bgSecondary,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Text('Total',
                      style:
                          TextStyle(fontSize: 12, color: AppColors.textMuted)),
                  const Spacer(),
                  Text(
                    'NPR ${order.totalAmount.toStringAsFixed(0)}',
                    style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary),
                  ),
                  const SizedBox(width: 10),
                  StatusBadge(order.paymentStatus),
                ],
              ),
            ),
            if (order.items.isNotEmpty) ...[
              const SizedBox(height: 12),
              ...order.items.take(3).map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 7),
                      child: Row(
                        children: [
                          const Icon(Icons.eco_outlined,
                              size: 16, color: AppColors.green500),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '${item.productName ?? 'Product'} × ${item.quantity}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 12, color: AppColors.textMuted),
                            ),
                          ),
                          Text(
                            'NPR ${item.price.toStringAsFixed(0)}',
                            style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                    ),
                  ),
              if (order.items.length > 3)
                Text(
                  '+ ${order.items.length - 3} more item(s)',
                  style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.green600,
                      fontWeight: FontWeight.w600),
                ),
            ],
          ],
        ),
      ),
    );
  }
}
