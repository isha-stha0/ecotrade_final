import 'package:flutter_test/flutter_test.dart';
import 'package:ecotrade/models/models.dart';

void main() {
  test('ProductModel parses backend stock and image fields', () {
    final product = ProductModel.fromJson({
      '_id': 'abc123',
      'name': 'Recycled Paper Notebook',
      'description': 'Made from recycled paper',
      'category': 'Stationery',
      'price': 150,
      'stock_quantity': 50,
      'sold': 24,
      'madeFrom': 'Recycled Paper',
      'ecoImpact': 'Saves 2kg CO2',
      'image_urls': ['https://example.com/image.png'],
      'isActive': true,
      'status': 'published',
    });

    expect(product.id, 'abc123');
    expect(product.name, 'Recycled Paper Notebook');
    expect(product.stock, 50);
    expect(product.sold, 24);
    expect(product.imageUrls, contains('https://example.com/image.png'));
    expect(product.isActive, isTrue);
  });
}
