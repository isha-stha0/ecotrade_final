import 'package:flutter/material.dart';
import '../models/models.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);
  int get count => _items.fold(0, (s, i) => s + i.quantity);
  double get total => _items.fold(0, (s, i) => s + i.subtotal);

  void addItem(ProductModel product, {int qty = 1}) {
    final idx = _items.indexWhere((i) => i.product.id == product.id);
    if (idx >= 0) { _items[idx].quantity += qty; }
    else { _items.add(CartItem(product: product, quantity: qty)); }
    notifyListeners();
  }

  void removeItem(String productId) {
    _items.removeWhere((i) => i.product.id == productId);
    notifyListeners();
  }

  void updateQty(String productId, int qty) {
    if (qty < 1) { removeItem(productId); return; }
    final idx = _items.indexWhere((i) => i.product.id == productId);
    if (idx >= 0) { _items[idx].quantity = qty; notifyListeners(); }
  }

  void clear() { _items.clear(); notifyListeners(); }
}
