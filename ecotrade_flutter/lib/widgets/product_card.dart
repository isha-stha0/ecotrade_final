import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';

class ProductCard extends StatelessWidget {
  final ProductModel product;
  final VoidCallback onTap;
  final VoidCallback onAddToCart;

  const ProductCard({
    super.key,
    required this.product,
    required this.onTap,
    required this.onAddToCart,
  });

  String get _emoji {
    switch (product.category) {
      case 'Stationery':
        return '📓';
      case 'Bags':
        return '👜';
      case 'Home Decor':
        return '🏺';
      case 'Office':
        return '🖊️';
      case 'Storage':
        return '📦';
      case 'Gardening':
        return '🌱';
      default:
        return '♻️';
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = product.name ?? 'Product';
    final category = product.category ?? 'Uncategorized';
    final price = product.price ?? 0;
    final stock = product.stock ?? 0;
    final madeFrom = product.madeFrom ?? '';
    final ecoImpact = product.ecoImpact ?? '';

    return ClipRect(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image / emoji area – takes 55% of height
              Expanded(
                flex: 55,
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.lightGreen.withOpacity(0.08),
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                  ),
                  child: Stack(
                    children: [
                      Center(
                        child:
                            Text(_emoji, style: const TextStyle(fontSize: 40)),
                      ),
                      if (madeFrom.isNotEmpty)
                        Positioned(
                          top: 4,
                          left: 4,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 4, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.lightGreen.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(100),
                              border: Border.all(
                                color: AppColors.lightGreen.withOpacity(0.3),
                              ),
                            ),
                            child: Text(
                              '♻️ $madeFrom',
                              style: const TextStyle(
                                fontSize: 7,
                                color: AppColors.lightGreen,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      if (stock <= 0)
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.black54,
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(16),
                              ),
                            ),
                            child: Center(
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 1),
                                decoration: BoxDecoration(
                                  color: Colors.red.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(100),
                                  border: Border.all(
                                    color: Colors.red.withOpacity(0.3),
                                  ),
                                ),
                                child: const Text(
                                  'OUT OF STOCK',
                                  style: TextStyle(
                                    color: Colors.red,
                                    fontSize: 8,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              // Content area – takes 45% of height
              Expanded(
                flex: 45,
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Top: category + name + eco impact
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            category,
                            style: const TextStyle(
                              fontSize: 8,
                              color: AppColors.textMuted,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.05,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            name,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.darkGreen,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (ecoImpact.isNotEmpty)
                            Text(
                              '🌱 $ecoImpact',
                              style: const TextStyle(
                                fontSize: 7,
                                color: AppColors.lightGreen,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                        ],
                      ),
                      // Bottom: price + add button
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'NPR ${price.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: AppColors.darkGreen,
                              fontFamily: 'monospace',
                            ),
                          ),
                          GestureDetector(
                            onTap: stock > 0 ? onAddToCart : null,
                            child: Container(
                              width: 22,
                              height: 22,
                              decoration: BoxDecoration(
                                color: stock > 0
                                    ? AppColors.lightGreen
                                    : AppColors.textMuted,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Icon(
                                Icons.add,
                                color: Colors.white,
                                size: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
