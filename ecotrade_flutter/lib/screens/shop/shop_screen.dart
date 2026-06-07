import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../services/cart_provider.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';
import 'product_detail_screen.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});
  @override State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  List<ProductModel> _products = [];
  bool _loading = true;
  String _search = '', _category = '', _sort = '';
  final _ctrl = TextEditingController();
  final _categories = ['All','Stationery','Bags','Home Decor','Office','Storage','Gardening'];

  @override void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final p = await ApiService().getProducts(search: _search, category: _category, sort: _sort);
      if (mounted) setState(() { _products = p; _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _addToCart(ProductModel p) {
    context.read<CartProvider>().addItem(p);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${p.name} added to cart!'), backgroundColor: AppColors.green600, duration: const Duration(seconds: 2)));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Eco Marketplace'),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
          child: TextField(
            controller: _ctrl,
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Search eco products...',
              prefixIcon: const Icon(Icons.search, color: AppColors.textMuted, size: 20),
              suffixIcon: _search.isNotEmpty ? IconButton(icon: const Icon(Icons.clear, color: AppColors.textMuted, size: 18), onPressed: () { _ctrl.clear(); setState(() => _search = ''); _load(); }) : null,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
            onChanged: (v) { setState(() => _search = v); Future.delayed(const Duration(milliseconds: 500), _load); },
          ),
        ),
      ),
    ),
    body: Column(children: [
      // Category pills
      SizedBox(height: 44, child: ListView.builder(
        scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        itemCount: _categories.length,
        itemBuilder: (_, i) {
          final cat = _categories[i];
          final sel = (_category.isEmpty && cat == 'All') || _category == cat;
          return GestureDetector(
            onTap: () { setState(() => _category = cat == 'All' ? '' : cat); _load(); },
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: sel ? AppColors.green500.withOpacity(0.15) : AppColors.bgCard,
                borderRadius: BorderRadius.circular(100),
                border: Border.all(color: sel ? AppColors.green500.withOpacity(0.4) : AppColors.border),
              ),
              child: Text(cat, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: sel ? AppColors.green400 : AppColors.textMuted)),
            ),
          );
        },
      )),
      Expanded(child: _loading
        ? const EcoLoading()
        : _products.isEmpty
          ? const EmptyState(emoji: '🛍️', title: 'No products found', subtitle: 'Try a different search or category')
          : RefreshIndicator(onRefresh: _load, color: AppColors.green500, backgroundColor: AppColors.bgCard,
              child: GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.7),
                itemCount: _products.length,
                itemBuilder: (_, i) => ProductCard(
                  product: _products[i],
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProductDetailScreen(product: _products[i]))),
                  onAddToCart: () => _addToCart(_products[i]),
                ),
              ),
            ),
      ),
    ]),
  );
}
