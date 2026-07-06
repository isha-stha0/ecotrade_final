import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/cart_provider.dart';
import '../../utils/app_theme.dart';
import 'cart_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final ProductModel product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _quantity = 1;

  String get _emoji {
    final cat = widget.product.category.toLowerCase();
    if (cat.contains('stationery')) return '📓';
    if (cat.contains('bag')) return '👜';
    if (cat.contains('home decor') || cat.contains('decor')) return '🏺';
    if (cat.contains('office')) return '🖊️';
    if (cat.contains('storage')) return '📦';
    if (cat.contains('gardening') || cat.contains('garden')) return '🌱';
    return '♻️';
  }

  String get _name => widget.product.name;
  String get _category => widget.product.category.isEmpty ? 'Uncategorized' : widget.product.category;
  String get _description =>
      widget.product.description.isEmpty ? 'No description available.' : widget.product.description;
  String get _madeFrom => widget.product.madeFrom ?? '';
  String get _ecoImpact => widget.product.ecoImpact ?? '';
  double get _price => widget.product.price;
  int get _stock => widget.product.stock;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          _name,
          style: const TextStyle(
            color: AppColors.darkGreen,
            fontWeight: FontWeight.w800,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined,
                color: AppColors.darkGreen),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const CartScreen()),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.lightGreen.withOpacity(0.08),
                    Colors.white
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: widget.product.imageUrl == null
                  ? Center(child: Text(_emoji, style: const TextStyle(fontSize: 80)))
                  : Image.network(
                      widget.product.imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Center(child: Text(_emoji, style: const TextStyle(fontSize: 80))),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      _Tag(_category),
                      if (_madeFrom.isNotEmpty)
                        _Tag('♻️ $_madeFrom', color: AppColors.lightGreen),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    _name,
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: AppColors.darkGreen,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _description,
                    style: const TextStyle(
                      fontSize: 15,
                      color: AppColors.textMuted,
                      height: 1.6,
                    ),
                  ),
                  if (_ecoImpact.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.lightGreen.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                            color: AppColors.lightGreen.withOpacity(0.2)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.eco,
                              color: AppColors.lightGreen, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _ecoImpact,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: AppColors.darkGreen,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'NPR ${_price.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w800,
                          color: AppColors.darkGreen,
                        ),
                      ),
                      Row(
                        children: [
                          const Icon(Icons.inventory_2_outlined,
                              size: 16, color: AppColors.textMuted),
                          const SizedBox(width: 6),
                          Text(
                            '${_stock} in stock',
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppColors.textMuted,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      const Text(
                        'Quantity',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textMuted,
                        ),
                      ),
                      const Spacer(),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: AppColors.darkGreen.withOpacity(0.15)),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove,
                                  size: 18, color: AppColors.darkGreen),
                              onPressed: () {
                                if (_quantity > 1) setState(() => _quantity--);
                              },
                            ),
                            Text(
                              '$_quantity',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppColors.darkGreen,
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add,
                                  size: 18, color: AppColors.darkGreen),
                              onPressed: () {
                                if (_quantity < _stock) {
                                  setState(() => _quantity++);
                                }
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 30),
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _stock > 0
                          ? () {
                              context
                                  .read<CartProvider>()
                                  .addItem(widget.product, qty: _quantity);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Added to cart! 🛍️'),
                                  backgroundColor: AppColors.lightGreen,
                                  duration: Duration(seconds: 2),
                                ),
                              );
                              Navigator.pop(context);
                            }
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.darkGreen,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16)),
                        disabledBackgroundColor: AppColors.textMuted,
                      ),
                      child: Text(
                        _stock > 0 ? 'Add to Cart' : 'Out of Stock',
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final String text;
  final Color? color;
  const _Tag(this.text, {this.color});

  @override
  Widget build(BuildContext context) {
    final bgColor = (color ?? AppColors.darkGreen).withOpacity(0.08);
    final borderColor = (color ?? AppColors.darkGreen).withOpacity(0.2);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color ?? AppColors.darkGreen,
        ),
      ),
    );
  }
}
