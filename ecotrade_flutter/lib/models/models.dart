import '../utils/api_config.dart';

String _normalizeAssetUrl(String url) {
  final trimmed = url.trim();
  if (trimmed.isEmpty) return trimmed;

  final apiBase = ApiConfig.baseUrl;
  final serverBase = apiBase.endsWith('/api')
      ? apiBase.substring(0, apiBase.length - 4)
      : apiBase;

  if (trimmed.startsWith('/')) return '$serverBase$trimmed';
  if (trimmed.startsWith('http://localhost:5000')) {
    return trimmed.replaceFirst('http://localhost:5000', serverBase);
  }
  if (trimmed.startsWith('http://127.0.0.1:5000')) {
    return trimmed.replaceFirst('http://127.0.0.1:5000', serverBase);
  }
  return trimmed;
}

class UserModel {
  final String id, name, email, role;
  final String? phone, address;
  final int ecoPoints;
  final double totalScraps;
  final bool isActive;

  UserModel(
      {required this.id,
      required this.name,
      required this.email,
      required this.role,
      this.phone,
      this.address,
      this.ecoPoints = 0,
      this.totalScraps = 0,
      this.isActive = true});

  factory UserModel.fromJson(Map<String, dynamic> j) => UserModel(
        id: j['_id'] ?? j['id'] ?? '',
        name: j['name'] ?? j['full_name'] ?? '',
        email: j['email'] ?? '',
        role: j['role'] ?? 'customer',
        phone: j['phone'],
        address: j['address'],
        ecoPoints: j['ecoPoints'] ?? j['reward_points'] ?? 0,
        totalScraps: (j['totalScraps'] ?? 0).toDouble(),
        isActive: j['isActive'] ?? j['is_active'] ?? true,
      );

  bool get isCollector => role == 'collector';
}

class ScrapModel {
  final String id, category, description, unit, status;
  final double quantity;
  final double? pickupLat, pickupLng;
  final String? location, adminNotes;
  final String? collectorId;
  final int pointsAwarded;
  final DateTime createdAt;
  final DateTime? completedAt;
  final Map<String, dynamic>? user, collector;

  ScrapModel(
      {required this.id,
      required this.category,
      required this.description,
      required this.quantity,
      required this.unit,
      required this.status,
      this.pickupLat,
      this.pickupLng,
      this.location,
      this.adminNotes,
      this.collectorId,
      this.pointsAwarded = 0,
      required this.createdAt,
      this.completedAt,
      this.user,
      this.collector});

  factory ScrapModel.fromJson(Map<String, dynamic> j) {
    final pickup = j['pickup_location'];
    final collectorValue = j['collector'] ?? j['collector_id'];
    final collectorMap = collectorValue is Map
        ? Map<String, dynamic>.from(collectorValue)
        : null;
    return ScrapModel(
      id: j['_id'] ?? '',
      category: j['category'] ?? '',
      description: j['description'] ?? '',
      quantity: (j['quantity'] ?? j['quantity_estimated'] ?? 0).toDouble(),
      unit: j['unit'] ?? 'kg',
      status: j['status'] ?? 'pending',
      pickupLat: pickup is Map && pickup['lat'] != null
          ? (pickup['lat'] as num).toDouble()
          : null,
      pickupLng: pickup is Map && pickup['lng'] != null
          ? (pickup['lng'] as num).toDouble()
          : null,
      location: j['location'] ?? j['pickup_address'],
      adminNotes: j['adminNotes'] ?? j['admin_notes'],
      collectorId: collectorMap?['_id']?.toString() ??
          collectorMap?['id']?.toString() ??
          (collectorValue is String ? collectorValue : null),
      pointsAwarded: j['pointsAwarded'] ?? j['points_awarded'] ?? 0,
      createdAt: DateTime.tryParse(
              (j['createdAt'] ?? j['created_at'] ?? '').toString()) ??
          DateTime.now(),
      completedAt:
          DateTime.tryParse(j['completed_at'] ?? j['completedAt'] ?? ''),
      user: j['user'] is Map
          ? j['user']
          : (j['user_id'] is Map ? j['user_id'] : null),
      collector: collectorMap,
    );
  }
}

class ScrapCategoryModel {
  final String id, name, description, icon;
  final int pointsPerKg;
  final double pricePerKg;
  final bool isActive;

  const ScrapCategoryModel({
    required this.id,
    required this.name,
    this.description = '',
    this.icon = 'category',
    this.pointsPerKg = 0,
    this.pricePerKg = 0,
    this.isActive = true,
  });

  factory ScrapCategoryModel.fromJson(Map<String, dynamic> j) =>
      ScrapCategoryModel(
        id: j['_id'] ?? j['id'] ?? '',
        name: j['name'] ?? '',
        description: j['description'] ?? '',
        icon: j['icon_url'] ?? j['icon'] ?? 'category',
        pointsPerKg: (j['points_per_kg'] ?? j['pointsPerKg'] ?? 0) is num
            ? (j['points_per_kg'] ?? j['pointsPerKg'] ?? 0).toInt()
            : int.tryParse('${j['points_per_kg'] ?? j['pointsPerKg'] ?? 0}') ??
                0,
        pricePerKg: (j['price_per_kg'] ?? j['pricePerKg'] ?? 0) is num
            ? (j['price_per_kg'] ?? j['pricePerKg'] ?? 0).toDouble()
            : double.tryParse('${j['price_per_kg'] ?? j['pricePerKg'] ?? 0}') ??
                0,
        isActive: j['is_active'] ?? j['isActive'] ?? true,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'description': description,
        'icon_url': icon,
        'points_per_kg': pointsPerKg,
        'price_per_kg': pricePerKg,
        'is_active': isActive,
      };
}

class ProductModel {
  final String id, name, description, category;
  final double price;
  final int stock, sold;
  final String? madeFrom, ecoImpact, sourceMaterial, status;
  final List<String> imageUrls;
  final bool isActive;

  ProductModel(
      {required this.id,
      required this.name,
      required this.description,
      required this.category,
      required this.price,
      required this.stock,
      this.sold = 0,
      this.madeFrom,
      this.ecoImpact,
      this.sourceMaterial,
      this.status,
      this.imageUrls = const [],
      this.isActive = true});

  factory ProductModel.fromJson(Map<String, dynamic> j) {
    final images = (j['image_urls'] as List? ?? j['imageUrls'] as List? ?? [])
        .whereType<String>()
        .map(_normalizeAssetUrl)
        .where((url) => url.isNotEmpty)
        .toList();
    final singleImage = j['image'];
    if (images.isEmpty && singleImage is String && singleImage.isNotEmpty) {
      images.add(_normalizeAssetUrl(singleImage));
    }
    return ProductModel(
      id: j['_id'] ?? j['id'] ?? '',
      name: j['name'] ?? '',
      description: j['description'] ?? '',
      category: j['category'] ?? '',
      price: (j['price'] ?? 0).toDouble(),
      stock: (j['stock'] ?? j['stock_quantity'] ?? 0) is num
          ? ((j['stock'] ?? j['stock_quantity'] ?? 0) as num).toInt()
          : int.tryParse(
                  (j['stock'] ?? j['stock_quantity'] ?? '0').toString()) ??
              0,
      sold: (j['sold'] ?? 0) is num
          ? (j['sold'] as num).toInt()
          : int.tryParse('${j['sold']}') ?? 0,
      madeFrom: j['madeFrom'],
      ecoImpact: j['ecoImpact'],
      sourceMaterial: j['source_material'],
      status: j['status'],
      imageUrls: images,
      isActive: j['isActive'] ?? j['is_active'] ?? true,
    );
  }

  String? get imageUrl => imageUrls.isNotEmpty ? imageUrls.first : null;
}

class OrderModel {
  final String id, orderStatus, paymentStatus, paymentMethod;
  final double totalAmount;
  final List<OrderItemModel> items;
  final Map<String, dynamic>? shippingAddress;
  final DateTime createdAt;

  OrderModel(
      {required this.id,
      required this.orderStatus,
      required this.paymentStatus,
      required this.paymentMethod,
      required this.totalAmount,
      required this.items,
      this.shippingAddress,
      required this.createdAt});

  factory OrderModel.fromJson(Map<String, dynamic> j) => OrderModel(
        id: (j['_id'] ?? j['id'] ?? '').toString(),
        orderStatus:
            (j['orderStatus'] ?? j['order_status'] ?? 'pending').toString(),
        paymentStatus:
            (j['paymentStatus'] ?? j['payment_status'] ?? 'pending').toString(),
        paymentMethod:
            (j['paymentMethod'] ?? j['payment_method'] ?? 'cash_on_delivery')
                .toString(),
        totalAmount: _asDouble(j['totalAmount'] ?? j['total_amount']),
        items: (j['items'] as List? ?? [])
            .whereType<Map>()
            .map((e) => OrderItemModel.fromJson(Map<String, dynamic>.from(e)))
            .toList(),
        shippingAddress: j['shippingAddress'] ?? j['shipping_address'],
        createdAt: DateTime.tryParse(
                (j['createdAt'] ?? j['created_at'] ?? '').toString()) ??
            DateTime.now(),
      );
}

class OrderItemModel {
  final String? productId, productName;
  final int quantity;
  final double price;

  OrderItemModel(
      {this.productId,
      this.productName,
      required this.quantity,
      required this.price});

  factory OrderItemModel.fromJson(Map<String, dynamic> j) {
    final p = j['product'] ?? j['product_id'];
    return OrderItemModel(
      productId: p is Map ? (p['_id'] ?? p['id'])?.toString() : p?.toString(),
      productName: p is Map ? p['name'] : null,
      quantity: _asInt(j['quantity'], fallback: 1),
      price: _asDouble(j['price'] ?? j['price_at_time']),
    );
  }
}

double _asDouble(dynamic value, {double fallback = 0}) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? fallback;
}

int _asInt(dynamic value, {int fallback = 0}) {
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

class CartItem {
  final ProductModel product;
  int quantity;
  CartItem({required this.product, this.quantity = 1});
  double get subtotal => product.price * quantity;
}
