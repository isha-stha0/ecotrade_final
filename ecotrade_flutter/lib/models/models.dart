class UserModel {
  final String id, name, email, role;
  final String? phone, address;
  final int ecoPoints;
  final double totalScraps;
  final bool isActive;

  UserModel({required this.id, required this.name, required this.email, required this.role,
    this.phone, this.address, this.ecoPoints = 0, this.totalScraps = 0, this.isActive = true});

  factory UserModel.fromJson(Map<String, dynamic> j) => UserModel(
    id: j['_id'] ?? '', name: j['name'] ?? '', email: j['email'] ?? '',
    role: j['role'] ?? 'customer', phone: j['phone'], address: j['address'],
    ecoPoints: j['ecoPoints'] ?? 0, totalScraps: (j['totalScraps'] ?? 0).toDouble(),
    isActive: j['isActive'] ?? true,
  );

  bool get isAdmin => role == 'admin';
}

class ScrapModel {
  final String id, category, description, unit, status;
  final double quantity;
  final String? location, adminNotes;
  final int pointsAwarded;
  final DateTime createdAt;
  final Map<String, dynamic>? user;

  ScrapModel({required this.id, required this.category, required this.description,
    required this.quantity, required this.unit, required this.status,
    this.location, this.adminNotes, this.pointsAwarded = 0,
    required this.createdAt, this.user});

  factory ScrapModel.fromJson(Map<String, dynamic> j) => ScrapModel(
    id: j['_id'] ?? '', category: j['category'] ?? '',
    description: j['description'] ?? '', quantity: (j['quantity'] ?? 0).toDouble(),
    unit: j['unit'] ?? 'kg', status: j['status'] ?? 'pending',
    location: j['location'], adminNotes: j['adminNotes'],
    pointsAwarded: j['pointsAwarded'] ?? 0,
    createdAt: DateTime.tryParse(j['createdAt'] ?? '') ?? DateTime.now(),
    user: j['user'] is Map ? j['user'] : null,
  );
}

class ProductModel {
  final String id, name, description, category;
  final double price;
  final int stock, sold;
  final String? madeFrom, ecoImpact;

  ProductModel({required this.id, required this.name, required this.description,
    required this.category, required this.price, required this.stock,
    this.sold = 0, this.madeFrom, this.ecoImpact});

  factory ProductModel.fromJson(Map<String, dynamic> j) => ProductModel(
    id: j['_id'] ?? '', name: j['name'] ?? '', description: j['description'] ?? '',
    category: j['category'] ?? '', price: (j['price'] ?? 0).toDouble(),
    stock: j['stock'] ?? 0, sold: j['sold'] ?? 0,
    madeFrom: j['madeFrom'], ecoImpact: j['ecoImpact'],
  );
}

class OrderModel {
  final String id, orderStatus, paymentStatus, paymentMethod;
  final double totalAmount;
  final List<OrderItemModel> items;
  final Map<String, dynamic>? shippingAddress;
  final DateTime createdAt;

  OrderModel({required this.id, required this.orderStatus, required this.paymentStatus,
    required this.paymentMethod, required this.totalAmount, required this.items,
    this.shippingAddress, required this.createdAt});

  factory OrderModel.fromJson(Map<String, dynamic> j) => OrderModel(
    id: j['_id'] ?? '', orderStatus: j['orderStatus'] ?? 'placed',
    paymentStatus: j['paymentStatus'] ?? 'pending', paymentMethod: j['paymentMethod'] ?? 'cod',
    totalAmount: (j['totalAmount'] ?? 0).toDouble(),
    items: (j['items'] as List? ?? []).map((e) => OrderItemModel.fromJson(e)).toList(),
    shippingAddress: j['shippingAddress'],
    createdAt: DateTime.tryParse(j['createdAt'] ?? '') ?? DateTime.now(),
  );
}

class OrderItemModel {
  final String? productId, productName;
  final int quantity;
  final double price;

  OrderItemModel({this.productId, this.productName, required this.quantity, required this.price});

  factory OrderItemModel.fromJson(Map<String, dynamic> j) {
    final p = j['product'];
    return OrderItemModel(
      productId: p is Map ? p['_id'] : p?.toString(),
      productName: p is Map ? p['name'] : null,
      quantity: j['quantity'] ?? 1,
      price: (j['price'] ?? 0).toDouble(),
    );
  }
}

class CartItem {
  final ProductModel product;
  int quantity;
  CartItem({required this.product, this.quantity = 1});
  double get subtotal => product.price * quantity;
}
