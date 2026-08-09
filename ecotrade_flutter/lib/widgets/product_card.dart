import 'package:flutter/material.dart';
import '../models/models.dart';
import '../utils/app_theme.dart';

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
    final category =
        product.category.isEmpty ? 'Eco Product' : product.category;
    final madeFrom = product.madeFrom ?? '';
    final ecoImpact = product.ecoImpact ?? '';
    final inStock = product.stock > 0;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 42,
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: _ProductImage(
                          imageUrl: product.imageUrl, emoji: _emoji),
                    ),
                    Positioned(
                      top: 8,
                      left: 8,
                      right: 8,
                      child: Row(
                        children: [
                          Flexible(child: _Pill(text: category)),
                        ],
                      ),
                    ),
                    if (!inStock)
                      Positioned.fill(
                        child: Container(
                          color: Colors.white.withOpacity(0.78),
                          child: Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: AppColors.red.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(
                                    color: AppColors.red.withOpacity(0.35)),
                              ),
                              child: const Text(
                                'OUT OF STOCK',
                                style: TextStyle(
                                  color: AppColors.red,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Expanded(
                flex: 58,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.name,
                        style: const TextStyle(
                          fontSize: 13,
                          height: 1.15,
                          fontWeight: FontWeight.w800,
                          color: AppColors.darkGreen,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 5),
                      if (madeFrom.isNotEmpty)
                        Text(
                          'Made from $madeFrom',
                          style: const TextStyle(
                            fontSize: 10,
                            color: AppColors.textMuted,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        )
                      else
                        Text(
                          product.description,
                          style: const TextStyle(
                              fontSize: 10, color: AppColors.textMuted),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      if (ecoImpact.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          ecoImpact,
                          style: const TextStyle(
                            fontSize: 9.5,
                            color: AppColors.lightGreen,
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'NPR ${product.price.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                                color: AppColors.darkGreen,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '${product.stock} left',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color:
                                  inStock ? AppColors.textMuted : AppColors.red,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        height: 38,
                        child: ElevatedButton.icon(
                          onPressed: inStock ? onAddToCart : null,
                          icon: const Icon(Icons.add_shopping_cart, size: 15),
                          label: Text(inStock ? 'Add' : 'Unavailable'),
                          style: ElevatedButton.styleFrom(
                            padding: EdgeInsets.zero,
                            backgroundColor: AppColors.darkGreen,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: AppColors.textDim,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10)),
                            textStyle: const TextStyle(
                                fontSize: 12, fontWeight: FontWeight.w800),
                          ),
                        ),
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

class _ProductImage extends StatelessWidget {
  final String? imageUrl;
  final String emoji;

  const _ProductImage({required this.imageUrl, required this.emoji});

  @override
  Widget build(BuildContext context) {
    final fallback = Container(
      color: const Color(0xFFF8FAFC),
      child: Center(child: Text(emoji, style: const TextStyle(fontSize: 42))),
    );

    if (imageUrl == null) return fallback;

    return Container(
      color: const Color(0xFFF8FAFC),
      padding: const EdgeInsets.all(12),
      child: Image.network(
        imageUrl!,
        width: double.infinity,
        height: double.infinity,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => fallback,
        loadingBuilder: (context, child, progress) {
          if (progress == null) return child;
          return const Center(
            child: SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                  strokeWidth: 2, color: AppColors.lightGreen),
            ),
          );
        },
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final String text;

  const _Pill({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.92),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.border),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 9.5,
          color: AppColors.darkGreen,
          fontWeight: FontWeight.w800,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}
