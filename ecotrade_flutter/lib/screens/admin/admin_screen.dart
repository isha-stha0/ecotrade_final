import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../services/auth_provider.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});
  @override State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  Map<String, dynamic>? _dash;
  List<ScrapModel> _scraps = [];
  List<ProductModel> _products = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _tab = TabController(length: 4, vsync: this); _load(); }
  @override void dispose() { _tab.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([ApiService().getAdminDashboard(), ApiService().getAllScraps(), ApiService().getProducts()]);
      if (mounted) setState(() {
        _dash = results[0] as Map<String, dynamic>;
        _scraps = ((results[1] as Map<String, dynamic>)['scraps'] as List? ?? []).map((e) => ScrapModel.fromJson(e)).toList();
        _products = results[2] as List<ProductModel>;
        _loading = false;
      });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _logout(BuildContext context) {
    showDialog(context: context, builder: (ctx) => AlertDialog(
      backgroundColor: AppColors.bgCard, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Text('Logout', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
      content: const Text('Are you sure?', style: TextStyle(color: AppColors.textMuted)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.red, foregroundColor: Colors.white, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
          onPressed: () async { Navigator.pop(ctx); await context.read<AuthProvider>().logout(); Navigator.of(context).pushReplacementNamed('/login'); },
          child: const Text('Logout')),
      ],
    ));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Admin Panel'),
      actions: [IconButton(icon: const Icon(Icons.logout_rounded, color: AppColors.red), tooltip: 'Logout', onPressed: () => _logout(context))],
      bottom: TabBar(controller: _tab, isScrollable: true, tabAlignment: TabAlignment.start,
        labelColor: AppColors.green400, unselectedLabelColor: AppColors.textMuted, indicatorColor: AppColors.green500,
        tabs: const [Tab(text: 'Dashboard'), Tab(text: 'Scraps'), Tab(text: 'Products'), Tab(text: 'Orders')]),
    ),
    body: _loading ? const EcoLoading() : TabBarView(controller: _tab, children: [
      _DashTab(data: _dash, onRefresh: _load),
      _ScrapsTab(scraps: _scraps, onRefresh: _load),
      _ProductsTab(products: _products, onRefresh: _load),
      const _OrdersTab(),
    ]),
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────
class _DashTab extends StatelessWidget {
  final Map<String, dynamic>? data;
  final VoidCallback onRefresh;
  const _DashTab({this.data, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final s = data?['stats'] ?? {};
    return ListView(padding: const EdgeInsets.all(16), children: [
      GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.7, children: [
        StatCard(label: 'Users', value: '${s['totalUsers'] ?? 0}', icon: Icons.people_outline, color: AppColors.blue),
        StatCard(label: 'Scraps', value: '${s['totalScraps'] ?? 0}', icon: Icons.recycling, color: AppColors.green400),
        StatCard(label: 'Products', value: '${s['totalProducts'] ?? 0}', icon: Icons.shopping_bag_outlined, color: AppColors.yellow),
        StatCard(label: 'Orders', value: '${s['totalOrders'] ?? 0}', icon: Icons.receipt_outlined, color: AppColors.purple),
      ]),
      const SizedBox(height: 16),
      if ((s['pendingScraps'] ?? 0) > 0) Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: AppColors.yellow.withOpacity(0.08), borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.yellow.withOpacity(0.2))),
        child: Row(children: [
          const Icon(Icons.warning_amber_outlined, color: AppColors.yellow, size: 18), const SizedBox(width: 8),
          Text('${s['pendingScraps']} scrap(s) pending review', style: const TextStyle(fontSize: 13, color: AppColors.yellow, fontWeight: FontWeight.w500)),
        ])),
      const SizedBox(height: 16),
      EcoButton(text: 'Seed Sample Products', outline: true, icon: Icons.add_circle_outline, onPressed: () async {
        try {
          await ApiService().seedData();
          if (context.mounted) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Products seeded!'), backgroundColor: AppColors.green600)); onRefresh(); }
        } catch (e) {
          if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.red));
        }
      }),
      const SizedBox(height: 20),
      if ((data?['recentScraps'] as List? ?? []).isNotEmpty) ...[
        const Text('Recent Scraps', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        const SizedBox(height: 10),
        ...(data!['recentScraps'] as List).take(3).map((s) {
          final scrap = ScrapModel.fromJson(s);
          return Container(margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${scrap.category} — ${scrap.quantity}${scrap.unit}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary, textBaseline: TextBaseline.alphabetic)),
                Text(scrap.user?['name'] ?? '', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ])),
              StatusBadge(scrap.status),
            ]));
        }),
      ],
    ]);
  }
}

// ── Scraps Tab ────────────────────────────────────────────────
class _ScrapsTab extends StatelessWidget {
  final List<ScrapModel> scraps;
  final VoidCallback onRefresh;
  const _ScrapsTab({required this.scraps, required this.onRefresh});

  Future<void> _update(BuildContext context, String id, String status) async {
    try {
      await ApiService().updateScrapStatus(id, status);
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Status → $status'), backgroundColor: AppColors.green600));
      onRefresh();
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.red));
    }
  }

  @override
  Widget build(BuildContext context) => scraps.isEmpty
    ? const EmptyState(emoji: '♻️', title: 'No scraps yet', subtitle: 'Submissions will appear here')
    : ListView.builder(padding: const EdgeInsets.all(16), itemCount: scraps.length,
        itemBuilder: (_, i) {
          final s = scraps[i];
          return Container(margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${s.category[0].toUpperCase()}${s.category.substring(1)} — ${s.quantity} ${s.unit}',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                  if (s.user != null) Text('By: ${s.user!['name'] ?? ''}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                ])),
                StatusBadge(s.status),
              ]),
              const SizedBox(height: 6),
              Text(s.description, style: const TextStyle(fontSize: 12, color: AppColors.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis),
              if (s.status == 'pending') ...[
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(child: EcoButton(text: 'Approve', icon: Icons.check, onPressed: () => _update(context, s.id, 'approved'))),
                  const SizedBox(width: 8),
                  Expanded(child: EcoButton(text: 'Reject', outline: true, icon: Icons.close, onPressed: () => _update(context, s.id, 'rejected'))),
                ]),
              ],
            ]));
        });
}

// ── Products Tab ──────────────────────────────────────────────
class _ProductsTab extends StatelessWidget {
  final List<ProductModel> products;
  final VoidCallback onRefresh;
  const _ProductsTab({required this.products, required this.onRefresh});

  @override
  Widget build(BuildContext context) => products.isEmpty
    ? const EmptyState(emoji: '🛍️', title: 'No products', subtitle: 'Use Seed button in Dashboard tab')
    : ListView.builder(padding: const EdgeInsets.all(16), itemCount: products.length,
        itemBuilder: (_, i) {
          final p = products[i];
          return Container(margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
            child: Row(children: [
              Container(width: 44, height: 44, decoration: BoxDecoration(color: AppColors.green500.withOpacity(0.1), borderRadius: BorderRadius.circular(10)), child: const Center(child: Text('♻️', style: TextStyle(fontSize: 22)))),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(p.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                Text('NPR ${p.price.toStringAsFixed(0)} • Stock: ${p.stock}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ])),
              IconButton(icon: const Icon(Icons.delete_outline, color: AppColors.red, size: 18),
                onPressed: () async {
                  try { await ApiService().deleteProduct(p.id); onRefresh(); }
                  catch (e) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.red)); }
                }),
            ]));
        });
}

// ── Orders Tab ────────────────────────────────────────────────
class _OrdersTab extends StatefulWidget {
  const _OrdersTab();
  @override State<_OrdersTab> createState() => _OrdersTabState();
}

class _OrdersTabState extends State<_OrdersTab> {
  List<dynamic> _orders = [];
  List<UserModel> _collectors = [];
  bool _loading = true;

  @override void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        ApiService().getAllOrders(),
        ApiService().getUsers(role: 'collector'),
      ]);
      final d = results[0];
      final users = results[1];
      if (mounted) {
        setState(() {
          _orders = d['orders'] ?? [];
          _collectors = (users['users'] as List? ?? []).map((e) => UserModel.fromJson(e)).toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _assignCollector(String orderId, String collectorId) async {
    try {
      await ApiService().assignOrderCollector(orderId, collectorId);
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Collector assigned for delivery'), backgroundColor: AppColors.green600),
        );
      }
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
    if (_loading) return const EcoLoading();
    if (_orders.isEmpty) return const EmptyState(emoji: '📦', title: 'No orders yet', subtitle: 'Orders will appear here');
    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.green500,
      child: ListView.builder(padding: const EdgeInsets.all(16), itemCount: _orders.length,
      itemBuilder: (_, i) {
        final o = _orders[i];
        final id = o['_id'] as String;
        final shipping = o['shippingAddress'] ?? o['shipping_address'];
        final deliveryCollector = o['deliveryCollector'] ?? o['delivery_collector_id'];
        final assignedCollectorId = deliveryCollector is Map ? (deliveryCollector['_id'] ?? deliveryCollector['id'])?.toString() : deliveryCollector?.toString();
        final customer = o['user'] ?? o['user_id'];
        final customerName = customer is Map ? (customer['full_name'] ?? customer['name'] ?? 'N/A') : 'N/A';
        final address = shipping is Map
            ? [shipping['street'], shipping['city']].where((e) => e != null && e.toString().isNotEmpty).join(', ')
            : shipping?.toString() ?? 'No address';
        return Container(margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('#${id.substring(id.length-8).toUpperCase()}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary, fontFamily: 'monospace')),
                Text('$customerName • NPR ${o['totalAmount'] ?? o['total_amount']}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ])),
              StatusBadge(o['orderStatus'] ?? o['order_status'] ?? 'placed'),
            ]),
            const SizedBox(height: 8),
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Icon(Icons.location_on_outlined, size: 16, color: AppColors.green400),
              const SizedBox(width: 6),
              Expanded(child: Text(address, style: const TextStyle(fontSize: 12, color: AppColors.textMuted))),
            ]),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              value: assignedCollectorId != null && _collectors.any((c) => c.id == assignedCollectorId) ? assignedCollectorId : null,
              decoration: const InputDecoration(labelText: 'Delivery collector'),
              items: _collectors
                  .map((c) => DropdownMenuItem(value: c.id, child: Text('${c.name}${c.phone != null ? ' - ${c.phone}' : ''}')))
                  .toList(),
              onChanged: (collectorId) {
                if (collectorId != null) _assignCollector(id, collectorId);
              },
            ),
          ]));
      }),
    );
  }
}
