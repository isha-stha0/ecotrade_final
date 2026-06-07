import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_provider.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';

class HomeScreen extends StatefulWidget {
  final Function(int) onNavigate;
  const HomeScreen({super.key, required this.onNavigate});
  @override State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;

  @override void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final d = await ApiService().getUserDashboard();
      if (mounted) setState(() { _data = d; _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final scraps = (_data?['myScraps'] as List? ?? []).map((e) => ScrapModel.fromJson(e)).toList();
    final orders = (_data?['myOrders'] as List? ?? []).map((e) => OrderModel.fromJson(e)).toList();

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _load, color: AppColors.green500, backgroundColor: AppColors.bgCard,
        child: CustomScrollView(slivers: [
          SliverAppBar(
            expandedHeight: 130, pinned: true, backgroundColor: AppColors.bg,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                padding: const EdgeInsets.fromLTRB(20, 56, 20, 0),
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, crossAxisAlignment: CrossAxisAlignment.center, children: [
                  Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text('Hey, ${user?.name.split(' ').first ?? 'there'} 👋',
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                    const SizedBox(height: 2),
                    const Text('Track your eco impact', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
                  ]),
                  Container(width: 42, height: 42,
                    decoration: BoxDecoration(gradient: const LinearGradient(colors: [AppColors.green600, AppColors.green700]), borderRadius: BorderRadius.circular(12)),
                    child: Center(child: Text(user?.name[0].toUpperCase() ?? 'U', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18)))),
                ]),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(delegate: SliverChildListDelegate([
              if (_loading) const EcoLoading()
              else ...[
                // Stats
                GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.8, children: [
                  StatCard(label: 'EcoPoints', value: '${user?.ecoPoints ?? 0}', icon: Icons.emoji_events, color: AppColors.yellow),
                  StatCard(label: 'Scraps', value: '${scraps.length}', icon: Icons.recycling, color: AppColors.green400),
                  StatCard(label: 'Recycled (kg)', value: '${user?.totalScraps.toStringAsFixed(0) ?? 0}', icon: Icons.trending_up, color: AppColors.blue),
                  StatCard(label: 'Orders', value: '${orders.length}', icon: Icons.shopping_bag_outlined, color: AppColors.purple),
                ]),
                const SizedBox(height: 20),

                // EcoPoints Banner
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [AppColors.yellow.withOpacity(0.1), AppColors.green500.withOpacity(0.06)]),
                    borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.yellow.withOpacity(0.2)),
                  ),
                  child: Row(children: [
                    const Text('🏆', style: TextStyle(fontSize: 34)),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('EcoPoints Balance', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.yellow)),
                      Text('${user?.ecoPoints ?? 0} pts', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.yellow, fontFamily: 'monospace')),
                      const Text('Recycle more to earn rewards!', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ])),
                    EcoButton(text: 'Shop', icon: Icons.arrow_forward, onPressed: () => widget.onNavigate(1)),
                  ]),
                ),
                const SizedBox(height: 20),

                // Recent Scraps
                _SectionHeader('Recent Scraps', 'Submit New', () => widget.onNavigate(2)),
                const SizedBox(height: 10),
                if (scraps.isEmpty)
                  EmptyState(emoji: '♻️', title: 'No scraps yet', subtitle: 'Submit your first recyclable material', buttonLabel: 'Submit Scrap', onButton: () => widget.onNavigate(2))
                else
                  ...scraps.take(3).map((s) => _ScrapTile(s)),

                const SizedBox(height: 20),

                // Recent Orders
                _SectionHeader('Recent Orders', 'View All', () => widget.onNavigate(3)),
                const SizedBox(height: 10),
                if (orders.isEmpty)
                  EmptyState(emoji: '🛍️', title: 'No orders yet', subtitle: 'Browse eco-friendly products', buttonLabel: 'Shop Now', onButton: () => widget.onNavigate(1))
                else
                  ...orders.take(3).map((o) => _OrderTile(o)),

                const SizedBox(height: 80),
              ],
            ])),
          ),
        ]),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title, action;
  final VoidCallback onAction;
  const _SectionHeader(this.title, this.action, this.onAction);
  @override
  Widget build(BuildContext context) => Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
    Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
    GestureDetector(onTap: onAction, child: Row(children: [
      Text(action, style: const TextStyle(fontSize: 13, color: AppColors.green400, fontWeight: FontWeight.w600)),
      const Icon(Icons.arrow_forward, size: 14, color: AppColors.green400),
    ])),
  ]);
}

class _ScrapTile extends StatelessWidget {
  final ScrapModel s;
  const _ScrapTile(this.s);
  static const _e = {'paper':'📄','plastic':'♻️','glass':'🍶','aluminum':'🥫','electronics':'💻','other':'🗃️'};
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 8),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
    child: Row(children: [
      Text(_e[s.category] ?? '♻️', style: const TextStyle(fontSize: 26)),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('${s.category[0].toUpperCase()}${s.category.substring(1)} — ${s.quantity} ${s.unit}',
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        Text(s.createdAt.toLocal().toString().split(' ')[0], style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
      ])),
      StatusBadge(s.status),
    ]),
  );
}

class _OrderTile extends StatelessWidget {
  final OrderModel o;
  const _OrderTile(this.o);
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 8),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
    child: Row(children: [
      Container(width: 40, height: 40, decoration: BoxDecoration(color: AppColors.green500.withOpacity(0.1), borderRadius: BorderRadius.circular(10)), child: const Icon(Icons.shopping_bag_outlined, color: AppColors.green400, size: 20)),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('#${o.id.substring(o.id.length - 8).toUpperCase()}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary, fontFamily: 'monospace')),
        Text('NPR ${o.totalAmount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
      ])),
      StatusBadge(o.orderStatus),
    ]),
  );
}
