import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/app_theme.dart';
import '../models/models.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override String toString() => message;
}

class ApiService {
  static final ApiService _i = ApiService._();
  factory ApiService() => _i;
  ApiService._();

  String get base => AppConstants.baseUrl;

  Future<String?> get _token async =>
      (await SharedPreferences.getInstance()).getString('token');

  Future<Map<String, String>> get _headers async {
    final t = await _token;
    return {
      'Content-Type': 'application/json',
      if (t != null) 'Authorization': 'Bearer $t',
    };
  }

  dynamic _handle(http.Response res) {
    dynamic body;
    try {
      body = res.body.isNotEmpty ? jsonDecode(res.body) : {};
    } catch (_) {
      throw ApiException('Invalid server response (${res.statusCode})');
    }
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    throw ApiException(body is Map ? (body['message'] ?? 'Request failed (${res.statusCode})') : 'Request failed (${res.statusCode})');
  }

  Future<T> _send<T>(Future<T> Function() request) async {
    try {
      return await request().timeout(const Duration(seconds: 15));
    } on SocketException {
      throw ApiException('Cannot reach server at $base. Start the backend (npm run dev) and check ApiConfig in lib/utils/api_config.dart');
    } on TimeoutException {
      throw ApiException('Request timed out. Check your network and backend URL ($base)');
    }
  }

  // ── Auth ────────────────────────────────────────────────────
  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _send(() => http.post(Uri.parse('$base/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password})));
    return _handle(res);
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    final res = await _send(() => http.post(Uri.parse('$base/auth/register'),
        headers: {'Content-Type': 'application/json'}, body: jsonEncode(data)));
    return _handle(res);
  }

  Future<UserModel> getProfile() async {
    final headers = await _headers;
    final res = await _send(() => http.get(Uri.parse('$base/auth/profile'), headers: headers));
    return UserModel.fromJson(_handle(res));
  }

  Future<UserModel> updateProfile(Map<String, dynamic> data) async {
    final headers = await _headers;
    final res = await _send(() => http.put(Uri.parse('$base/auth/profile'),
        headers: headers, body: jsonEncode(data)));
    return UserModel.fromJson(_handle(res));
  }

  Future<void> changePassword(String current, String newPass) async {
    final headers = await _headers;
    final res = await _send(() => http.put(Uri.parse('$base/auth/change-password'),
        headers: headers,
        body: jsonEncode({'currentPassword': current, 'newPassword': newPass})));
    _handle(res);
  }

  // ── Scrap ───────────────────────────────────────────────────
  Future<ScrapModel> submitScrap(Map<String, dynamic> data, {List<File>? photos}) async {
    final headers = await _headers;
    
    // If no photos, use JSON encoding for backward compatibility
    if (photos == null || photos.isEmpty) {
      final res = await _send(() => http.post(Uri.parse('$base/scrap'),
          headers: headers, body: jsonEncode(data)));
      return ScrapModel.fromJson(_handle(res));
    }
    
    // Use multipart form data for file uploads
    final request = http.MultipartRequest('POST', Uri.parse('$base/scrap'));
    
    // Add headers. MultipartRequest sets its own content-type boundary.
    headers.forEach((key, value) {
      if (key.toLowerCase() != 'content-type') {
        request.headers[key] = value;
      }
    });
    
    // Add form fields
    data.forEach((key, value) {
      request.fields[key] = value.toString();
    });
    
    // Add photos
    for (final photo in photos) {
      request.files.add(
        await http.MultipartFile.fromPath('photos', photo.path),
      );
    }
    
    final streamResponse = await _send(() => request.send());
    final response = await http.Response.fromStream(streamResponse);
    return ScrapModel.fromJson(_handle(response));
  }

  Future<List<ScrapModel>> getMyScrap() async {
    final res = await http.get(Uri.parse('$base/scrap/my'), headers: await _headers);
    return (_handle(res) as List).map((e) => ScrapModel.fromJson(e)).toList();
  }

  Future<Map<String, dynamic>> getAllScraps({String? status}) async {
    final q = status != null && status.isNotEmpty ? '?status=$status' : '';
    final res = await http.get(Uri.parse('$base/scrap$q'), headers: await _headers);
    return _handle(res);
  }

  Future<void> updateScrapStatus(String id, String status, {String? notes, String? collectorId}) async {
    final res = await http.put(Uri.parse('$base/scrap/$id/status'),
        headers: await _headers,
        body: jsonEncode({
          'status': status,
          if (notes != null) 'adminNotes': notes,
          if (collectorId != null) 'collector_id': collectorId,
        }));
    _handle(res);
  }

  // ── Products ────────────────────────────────────────────────
  Future<List<ProductModel>> getProducts({String? search, String? category, String? sort}) async {
    final params = <String, String>{};
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (category != null && category.isNotEmpty && category != 'All') params['category'] = category;
    if (sort != null && sort.isNotEmpty) params['sort'] = sort;
    final uri = Uri.parse('$base/products').replace(queryParameters: params);
    final res = await http.get(uri, headers: await _headers);
    final body = _handle(res);
    final products = body is Map ? body['products'] as List? ?? [] : body as List? ?? [];
    return products.map((e) => ProductModel.fromJson(e)).toList();
  }

  Future<List<String>> getProductCategories() async {
    final res = await http.get(Uri.parse('$base/products/categories'), headers: await _headers);
    final body = _handle(res);
    final categories = body is List ? body : body['categories'] as List? ?? [];
    return categories
        .map((e) => e is Map ? e['name']?.toString() : e.toString())
        .whereType<String>()
        .where((name) => name.isNotEmpty)
        .toSet()
        .toList();
  }

  Future<ProductModel> getProduct(String id) async {
    final res = await http.get(Uri.parse('$base/products/$id'), headers: await _headers);
    return ProductModel.fromJson(_handle(res));
  }

  Future<ProductModel> createProduct(Map<String, dynamic> data) async {
    final res = await http.post(Uri.parse('$base/products'),
        headers: await _headers, body: jsonEncode(data));
    return ProductModel.fromJson(_handle(res));
  }

  Future<ProductModel> updateProduct(String id, Map<String, dynamic> data) async {
    final res = await http.put(Uri.parse('$base/products/$id'),
        headers: await _headers, body: jsonEncode(data));
    return ProductModel.fromJson(_handle(res));
  }

  Future<void> deleteProduct(String id) async {
    final res = await http.delete(Uri.parse('$base/products/$id'), headers: await _headers);
    _handle(res);
  }

  // ── Orders ──────────────────────────────────────────────────
  Future<OrderModel> placeOrder(Map<String, dynamic> data) async {
    final res = await http.post(Uri.parse('$base/orders'),
        headers: await _headers, body: jsonEncode(data));
    return OrderModel.fromJson(_handle(res));
  }

  Future<Map<String, dynamic>> initiateEsewaPayment(Map<String, dynamic> data) async {
    final res = await http.post(Uri.parse('$base/orders/esewa/initiate'),
        headers: await _headers, body: jsonEncode(data));
    return _handle(res);
  }

  Future<Map<String, dynamic>> verifyEsewaPayment(Map<String, dynamic> data) async {
    final res = await http.post(Uri.parse('$base/orders/esewa/verify'),
        headers: await _headers, body: jsonEncode(data));
    return _handle(res);
  }

  Future<Map<String, dynamic>> handleEsewaFailure(Map<String, dynamic> data) async {
    final res = await http.post(Uri.parse('$base/orders/esewa/failure'),
        headers: await _headers, body: jsonEncode(data));
    return _handle(res);
  }

  Future<List<OrderModel>> getMyOrders() async {
    final res = await http.get(Uri.parse('$base/orders/my'), headers: await _headers);
    return (_handle(res) as List).map((e) => OrderModel.fromJson(e)).toList();
  }

  Future<Map<String, dynamic>> getAllOrders({String? status}) async {
    final q = status != null && status.isNotEmpty ? '?status=$status' : '';
    final res = await http.get(Uri.parse('$base/orders$q'), headers: await _headers);
    return _handle(res);
  }

  Future<void> updateOrderStatus(String id, String status) async {
    final res = await http.put(Uri.parse('$base/orders/$id/status'),
        headers: await _headers, body: jsonEncode({'orderStatus': status}));
    _handle(res);
  }

  Future<Map<String, dynamic>> getMyDeliveries() async {
    final res = await http.get(Uri.parse('$base/orders/deliveries/my'), headers: await _headers);
    return _handle(res);
  }

  Future<void> assignOrderCollector(String orderId, String collectorId) async {
    final res = await http.put(Uri.parse('$base/orders/$orderId/assign-collector'),
        headers: await _headers, body: jsonEncode({'collectorId': collectorId}));
    _handle(res);
  }

  Future<void> updateDeliveryStatus(String orderId, String status) async {
    final res = await http.put(Uri.parse('$base/orders/$orderId/delivery-status'),
        headers: await _headers, body: jsonEncode({'orderStatus': status}));
    _handle(res);
  }

  // ── Dashboard ───────────────────────────────────────────────
  Future<Map<String, dynamic>> getUserDashboard() async {
    final res = await http.get(Uri.parse('$base/dashboard/user'), headers: await _headers);
    return _handle(res);
  }

  Future<Map<String, dynamic>> getAdminDashboard() async {
    final res = await http.get(Uri.parse('$base/dashboard/admin'), headers: await _headers);
    return _handle(res);
  }

  // ── Admin ───────────────────────────────────────────────────
  Future<Map<String, dynamic>> getUsers({String? role}) async {
    final q = role != null && role.isNotEmpty ? '?role=$role' : '';
    final res = await http.get(Uri.parse('$base/admin/users$q'), headers: await _headers);
    return _handle(res);
  }

  Future<void> toggleUser(String id) async {
    final res = await http.put(Uri.parse('$base/admin/users/$id/toggle'), headers: await _headers);
    _handle(res);
  }

  Future<void> updateUserRole(String id, String role) async {
    final res = await http.put(Uri.parse('$base/admin/users/$id/role'),
        headers: await _headers, body: jsonEncode({'role': role}));
    _handle(res);
  }

  Future<void> seedData() async {
    final res = await http.post(Uri.parse('$base/admin/seed'), headers: await _headers);
    _handle(res);
  }
}
