import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../services/cart_provider.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';
import 'cart_screen.dart';
import 'product_detail_screen.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  List<ProductModel> _products = [];
  bool _loading = true;
  String? _error;
  String _search = '', _category = '';
  final String _sort = '';
  final _ctrl = TextEditingController();
  List<String> _categories = [
    'All',
    'Stationery',
    'Bags',
    'Home Decor',
    'Office',
    'Storage',
    'Gardening'
  ];

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _load();
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await ApiService().getProductCategories();
      if (mounted && categories.isNotEmpty) {
        setState(() => _categories = ['All', ...categories]);
      }
    } catch (_) {}
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final p = await ApiService().getProducts(
        search: _search,
        category: _category,
        sort: _sort,
      );
      if (mounted) {
        setState(() {
          _products = p;
          _loading = false;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  void _addToCart(ProductModel p) {
    context.read<CartProvider>().addItem(p);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${p.name} added to cart!'),
        backgroundColor: AppColors.lightGreen,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text(
          'Eco Marketplace',
          style: TextStyle(
            color: AppColors.darkGreen,
            fontWeight: FontWeight.w800,
          ),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        actions: [
          Consumer<CartProvider>(
            builder: (context, cart, _) => IconButton(
              tooltip: 'Cart',
              icon: Badge(
                isLabelVisible: cart.count > 0,
                label: Text('${cart.count}'),
                child: const Icon(Icons.shopping_cart_outlined, color: AppColors.darkGreen),
              ),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen())),
            ),
          ),
          const SizedBox(width: 6),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(64),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.darkGreen.withOpacity(0.1)),
              ),
              child: TextField(
                controller: _ctrl,
                style: const TextStyle(color: Colors.black, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Search eco products...',
                  hintStyle: TextStyle(color: AppColors.textDim),
                  prefixIcon: Icon(
                    Icons.search,
                    color: AppColors.darkGreen.withOpacity(0.6),
                    size: 20,
                  ),
                  suffixIcon: _search.isNotEmpty
                      ? IconButton(
                          icon: Icon(Icons.clear,
                              color: AppColors.darkGreen.withOpacity(0.6),
                              size: 18),
                          onPressed: () {
                            _ctrl.clear();
                            setState(() => _search = '');
                            _load();
                          },
                        )
                      : null,
                  contentPadding:
                      const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                  border: InputBorder.none,
                ),
                onChanged: (v) {
                  setState(() => _search = v);
                  Future.delayed(const Duration(milliseconds: 500), _load);
                },
              ),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Category pills
          SizedBox(
            height: 48,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              itemCount: _categories.length,
              itemBuilder: (_, i) {
                final cat = _categories[i];
                final selected =
                    (_category.isEmpty && cat == 'All') || _category == cat;
                return GestureDetector(
                  onTap: () {
                    setState(() => _category = cat == 'All' ? '' : cat);
                    _load();
                  },
                  child: Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: selected
                          ? AppColors.lightGreen.withOpacity(0.12)
                          : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color:
                            selected ? AppColors.lightGreen : AppColors.border,
                        width: selected ? 1.5 : 1,
                      ),
                      boxShadow: selected
                          ? [
                              BoxShadow(
                                color: AppColors.lightGreen.withOpacity(0.2),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    child: Text(
                      cat,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: selected
                            ? AppColors.darkGreen
                            : AppColors.textMuted,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          // Responsive product grid
          Expanded(
            child: _loading
                ? const EcoLoading()
                : _error != null
                    ? EmptyState(
                        emoji: '⚠️',
                        title: 'Could not load backend products',
                        subtitle: _error!,
                        buttonLabel: 'Retry',
                        onButton: _load,
                      )
                : _products.isEmpty
                    ? const EmptyState(
                        emoji: '🛍️',
                        title: 'No products found',
                        subtitle: 'Try a different search or category',
                      )
                    : RefreshIndicator(
                        onRefresh: _load,
                        color: AppColors.lightGreen,
                        backgroundColor: Colors.white,
                        child: LayoutBuilder(
                          builder: (context, constraints) {
                            // Calculate columns based on available width
                            int crossAxisCount;
                            double cardHeight;
                            double spacing;

                            final width = constraints.maxWidth;
                            if (width < 360) {
                              crossAxisCount = 1;
                              cardHeight = 360;
                              spacing = 14;
                            } else if (width < 600) {
                              crossAxisCount = 2;
                              cardHeight = 315;
                              spacing = 12;
                            } else if (width < 900) {
                              crossAxisCount = 3;
                              cardHeight = 320;
                              spacing = 14;
                            } else {
                              crossAxisCount = 4;
                              cardHeight = 330;
                              spacing = 18;
                            }

                            return GridView.builder(
                              padding: EdgeInsets.all(spacing),
                              gridDelegate:
                                  SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: crossAxisCount,
                                crossAxisSpacing: spacing,
                                mainAxisSpacing: spacing,
                                mainAxisExtent: cardHeight,
                              ),
                              itemCount: _products.length,
                              itemBuilder: (_, i) {
                                final product = _products[i];
                                return ProductCard(
                                  product: product,
                                  onTap: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          ProductDetailScreen(product: product),
                                    ),
                                  ),
                                  onAddToCart: () => _addToCart(product),
                                );
                              },
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
