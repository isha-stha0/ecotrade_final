import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/auth_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';
import '../scrap/scrap_map_screen.dart';

class CollectorScreen extends StatefulWidget {
  const CollectorScreen({super.key});

  @override
  State<CollectorScreen> createState() => _CollectorScreenState();
}

class _CollectorScreenState extends State<CollectorScreen> {
  bool _loading = true;
  List<ScrapModel> _scraps = [];
  List<dynamic> _deliveries = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService().getAllScraps(),
        ApiService().getMyDeliveries(),
      ]);
      final scrapData = results[0];
      final deliveryData = results[1];
      final scraps = (scrapData['scraps'] as List? ?? [])
          .map((e) => ScrapModel.fromJson(e))
          .toList();
      if (mounted) {
        setState(() {
          _scraps = scraps;
          _deliveries = deliveryData['orders'] as List? ?? [];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.red),
        );
      }
    }
  }

  Future<void> _updateDeliveryStatus(
      Map<String, dynamic> order, String status) async {
    try {
      await ApiService().updateDeliveryStatus(order['_id'].toString(), status);
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.red),
        );
      }
    }
  }

  Future<void> _updateStatus(ScrapModel scrap, String status) async {
    try {
      if (status == 'assigned') {
        await ApiService().claimScrapRequest(scrap.id);
      } else if (status == 'declined') {
        await ApiService().declineScrapRequest(scrap.id);
      } else {
        await ApiService().updateScrapStatus(scrap.id, status);
      }
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final userId = user?.id;
    bool isAssignedToMe(ScrapModel scrap) =>
        userId != null && userId.isNotEmpty && scrap.collectorId == userId;
    final activeScraps = _scraps.where((s) {
      if (s.status == 'completed' ||
          s.status == 'rejected' ||
          s.status == 'cancelled') return false;
      if (s.status == 'assigned' || s.status == 'collected')
        return isAssignedToMe(s);
      return true;
    }).toList();
    final completedScraps = _scraps
        .where((s) =>
            s.status == 'completed' &&
            (isAssignedToMe(s) ||
                s.collectorId == null ||
                s.collectorId!.isEmpty))
        .toList();
    final activeDeliveries = _deliveries.where((o) {
      final status = (o['orderStatus'] ?? o['order_status'] ?? '').toString();
      return status != 'delivered' &&
          status != 'cancelled' &&
          status != 'refunded';
    }).toList();
    final completedDeliveries = _deliveries
        .where((o) => (o['orderStatus'] ?? o['order_status']) == 'delivered')
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset(
              'assets/images/ecotrade_logo.jpg',
              width: 40,
              height: 36,
              fit: BoxFit.contain,
            ),
            const SizedBox(width: 4),
            const Flexible(
              child: Text(
                'Collector Portal',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
              icon: const Icon(Icons.notifications_outlined),
              tooltip: 'Notifications',
              onPressed: () =>
                  Navigator.of(context).pushNamed('/notifications')),
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.red),
            onPressed: () async {
              await context.read<AuthProvider>().logout();
              if (context.mounted)
                Navigator.of(context).pushReplacementNamed('/login');
            },
          ),
        ],
      ),
      body: DefaultTabController(
        length: 3,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.green500.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                            color: AppColors.green500.withValues(alpha: 0.16)),
                      ),
                      child: Row(children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: const BoxDecoration(
                              color: AppColors.green500,
                              shape: BoxShape.circle),
                          child: const Icon(Icons.local_shipping_outlined,
                              color: Colors.white),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                            child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                              Text(
                                'Welcome, ${user?.name.split(' ').first ?? 'Collector'}',
                                style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.textPrimary),
                              ),
                              const SizedBox(height: 3),
                              const Text(
                                  'Manage pickup and delivery tasks in one place.',
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textMuted)),
                            ])),
                      ]),
                    ),
                    const SizedBox(height: 12),
                    Row(children: [
                      Expanded(
                          child: _MiniStat(
                              label: 'Pickups',
                              value: '${activeScraps.length}',
                              icon: Icons.recycling)),
                      const SizedBox(width: 8),
                      Expanded(
                          child: _MiniStat(
                              label: 'Deliveries',
                              value: '${activeDeliveries.length}',
                              icon: Icons.local_shipping_outlined)),
                      const SizedBox(width: 8),
                      Expanded(
                          child: _MiniStat(
                              label: 'Done',
                              value:
                                  '${completedScraps.length + completedDeliveries.length}',
                              icon: Icons.check_circle_outline)),
                    ]),
                  ]),
            ),
            TabBar(
              labelColor: AppColors.green500,
              unselectedLabelColor: AppColors.textMuted,
              indicatorColor: AppColors.green500,
              tabs: [
                Tab(text: 'Pickups (${activeScraps.length})'),
                Tab(text: 'Deliveries (${activeDeliveries.length})'),
                Tab(
                    text:
                        'History (${completedScraps.length + completedDeliveries.length})'),
              ],
            ),
            Expanded(
              child: _loading
                  ? const Padding(
                      padding: EdgeInsets.only(top: 80), child: EcoLoading())
                  : TabBarView(
                      children: [
                        _ScrapList(
                          scraps: activeScraps,
                          emptyTitle: 'No pickup requests',
                          emptySubtitle: 'New scrap requests will appear here.',
                          onRefresh: _load,
                          onStatus: _updateStatus,
                        ),
                        _DeliveryList(
                          orders: activeDeliveries,
                          onRefresh: _load,
                          onStatus: _updateDeliveryStatus,
                        ),
                        _ScrapList(
                          scraps: completedScraps,
                          emptyTitle: 'No completed rides',
                          emptySubtitle:
                              'Completed pickup requests will appear here.',
                          history: true,
                          onRefresh: _load,
                          onStatus: _updateStatus,
                          extraChildren: completedDeliveries
                              .map((o) => _DeliveryCard(
                                  order: Map<String, dynamic>.from(o as Map),
                                  history: true,
                                  onStatus: (_) {}))
                              .toList(),
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label, value;
  final IconData icon;

  const _MiniStat(
      {required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppColors.bgCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, size: 18, color: AppColors.green400),
          const SizedBox(height: 6),
          Text(value,
              style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary)),
          Text(label,
              style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
        ]),
      );
}

class _ScrapList extends StatelessWidget {
  final List<ScrapModel> scraps;
  final String emptyTitle, emptySubtitle;
  final bool history;
  final Future<void> Function() onRefresh;
  final Future<void> Function(ScrapModel scrap, String status) onStatus;
  final List<Widget> extraChildren;

  const _ScrapList({
    required this.scraps,
    required this.emptyTitle,
    required this.emptySubtitle,
    required this.onRefresh,
    required this.onStatus,
    this.extraChildren = const [],
    this.history = false,
  });

  @override
  Widget build(BuildContext context) {
    if (scraps.isEmpty && extraChildren.isEmpty) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        color: AppColors.green500,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            EmptyState(
              emoji: history ? '✅' : '♻️',
              title: emptyTitle,
              subtitle: emptySubtitle,
            ),
          ],
        ),
      );
    }

    final children = [
      ...scraps.map((scrap) => _CollectorScrapCard(
            scrap: scrap,
            history: history,
            onStatus: (status) => onStatus(scrap, status),
          )),
      ...extraChildren,
    ];

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppColors.green500,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: children,
      ),
    );
  }
}

class _DeliveryList extends StatelessWidget {
  final List<dynamic> orders;
  final Future<void> Function() onRefresh;
  final Future<void> Function(Map<String, dynamic> order, String status)
      onStatus;

  const _DeliveryList(
      {required this.orders, required this.onRefresh, required this.onStatus});

  @override
  Widget build(BuildContext context) {
    if (orders.isEmpty) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        color: AppColors.green500,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: const [
            EmptyState(
              emoji: '📦',
              title: 'No assigned deliveries',
              subtitle:
                  'Product orders assigned for delivery will appear here.',
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: AppColors.green500,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: orders
            .map((o) => _DeliveryCard(
                  order: Map<String, dynamic>.from(o as Map),
                  onStatus: (status) =>
                      onStatus(Map<String, dynamic>.from(o), status),
                ))
            .toList(),
      ),
    );
  }
}

class _DeliveryCard extends StatelessWidget {
  final Map<String, dynamic> order;
  final ValueChanged<String> onStatus;
  final bool history;

  const _DeliveryCard(
      {required this.order, required this.onStatus, this.history = false});

  @override
  Widget build(BuildContext context) {
    final id = order['_id']?.toString() ?? '';
    final status =
        (order['orderStatus'] ?? order['order_status'] ?? 'pending').toString();
    final customer = order['user'] ?? order['user_id'];
    final customerName = customer is Map
        ? (customer['full_name'] ?? customer['name'] ?? 'Customer')
        : 'Customer';
    final customerPhone =
        customer is Map ? customer['phone']?.toString() : null;
    final shipping = order['shippingAddress'] ?? order['shipping_address'];
    final address = shipping is Map
        ? [shipping['street'], shipping['city']]
            .where((e) => e != null && e.toString().isNotEmpty)
            .join(', ')
        : shipping?.toString() ?? 'No delivery address';
    final lat = shipping is Map ? (shipping['lat'] as num?)?.toDouble() : null;
    final lng = shipping is Map ? (shipping['lng'] as num?)?.toDouble() : null;
    final items = order['items'] as List? ?? [];
    final total = order['totalAmount'] ?? order['total_amount'] ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
            child: Text(
              id.length >= 8
                  ? 'Order #${id.substring(id.length - 8).toUpperCase()}'
                  : 'Order',
              style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary),
            ),
          ),
          StatusBadge(status),
        ]),
        const SizedBox(height: 8),
        Text('$customerName${customerPhone != null ? ' - $customerPhone' : ''}',
            style: const TextStyle(fontSize: 13, color: AppColors.textPrimary)),
        const SizedBox(height: 6),
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Icon(Icons.location_on_outlined,
              size: 16, color: AppColors.green400),
          const SizedBox(width: 6),
          Expanded(
              child: Text(address,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textMuted))),
        ]),
        if (items.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            items.map((item) {
              final p = item['product'] ?? item['product_id'];
              final name = p is Map ? (p['name'] ?? 'Product') : 'Product';
              return '$name x${item['quantity'] ?? 1}';
            }).join(', '),
            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
        const SizedBox(height: 8),
        Text('NPR $total',
            style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.green400)),
        if (lat != null && lng != null) ...[
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ScrapMapScreen(
                    initialLat: lat,
                    initialLng: lng,
                    title: 'Delivery Address'),
              ),
            ),
            icon: const Icon(Icons.map_outlined, size: 16),
            label: const Text('View delivery location'),
          ),
        ],
        if (!history) ...[
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: [
            if (status == 'confirmed' || status == 'processing')
              _ActionButton(
                  label: 'Start Delivery',
                  icon: Icons.local_shipping_outlined,
                  onTap: () => onStatus('shipped')),
            if (status == 'shipped')
              _ActionButton(
                  label: 'Delivered',
                  icon: Icons.done_all_rounded,
                  onTap: () => onStatus('delivered')),
          ]),
        ],
      ]),
    );
  }
}

class _CollectorScrapCard extends StatelessWidget {
  final ScrapModel scrap;
  final ValueChanged<String> onStatus;
  final bool history;

  const _CollectorScrapCard(
      {required this.scrap, required this.onStatus, this.history = false});

  @override
  Widget build(BuildContext context) {
    final user = scrap.user;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
            child: Text(
              '${scrap.category[0].toUpperCase()}${scrap.category.substring(1)} - ${scrap.quantity.toStringAsFixed(1)} ${scrap.unit}',
              style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary),
            ),
          ),
          StatusBadge(scrap.status),
        ]),
        const SizedBox(height: 8),
        if (scrap.description.isNotEmpty)
          Text(scrap.description,
              style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
        if (scrap.location != null && scrap.location!.isNotEmpty) ...[
          const SizedBox(height: 8),
          Row(children: [
            const Icon(Icons.location_on_outlined,
                size: 16, color: AppColors.green400),
            const SizedBox(width: 6),
            Expanded(
                child: Text(scrap.location!,
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.textPrimary))),
          ]),
        ],
        if (scrap.pickupLat != null && scrap.pickupLng != null) ...[
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => ScrapMapScreen(
                    initialLat: scrap.pickupLat,
                    initialLng: scrap.pickupLng,
                    title: 'Pickup Address',
                  ),
                ),
              );
            },
            icon: const Icon(Icons.map_outlined, size: 16),
            label: const Text('View pinned pickup address'),
          ),
        ],
        if (user != null) ...[
          const SizedBox(height: 8),
          Text(
            'Customer: ${user['full_name'] ?? user['name'] ?? 'Unknown'}${user['phone'] != null ? ' - ${user['phone']}' : ''}',
            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
          ),
        ],
        if (history && scrap.completedAt != null) ...[
          const SizedBox(height: 8),
          Row(children: [
            const Icon(Icons.event_available_outlined,
                size: 16, color: AppColors.green400),
            const SizedBox(width: 6),
            Text(
              'Completed: ${_formatDate(scrap.completedAt!)}',
              style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
            ),
          ]),
        ],
        if (!history) ...[
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: [
            if (scrap.status == 'approved') ...[
              _ActionButton(
                  label: 'Accept',
                  icon: Icons.check_rounded,
                  onTap: () => onStatus('assigned')),
              _ActionButton(
                  label: 'Decline',
                  icon: Icons.close_rounded,
                  onTap: () => onStatus('declined')),
            ],
            if (scrap.status == 'assigned')
              _ActionButton(
                  label: 'Collected',
                  icon: Icons.inventory_2_outlined,
                  onTap: () => onStatus('collected')),
            if (scrap.status == 'collected')
              _ActionButton(
                  label: 'Complete',
                  icon: Icons.done_all_rounded,
                  onTap: () => onStatus('completed')),
          ]),
        ],
      ]),
    );
  }

  String _formatDate(DateTime date) {
    final d = date.toLocal();
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _ActionButton(
      {required this.label, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 16),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}
