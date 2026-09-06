import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:http_parser/http_parser.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/app_theme.dart';
import '../models/models.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
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

  Future<dynamic> get(String path) async {
    final headers = await _headers;
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    final res = await _send(
        () => http.get(Uri.parse('$base$normalizedPath'), headers: headers));
    return _handle(res);
  }

  dynamic _handle(http.Response res) {
    dynamic body;
    try {
      body = res.body.isNotEmpty ? jsonDecode(res.body) : {};
    } catch (_) {
      throw ApiException('Invalid server response (${res.statusCode})');
    }
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    throw ApiException(body is Map
        ? (body['message'] ?? 'Request failed (${res.statusCode})')
        : 'Request failed (${res.statusCode})');
  }

  Future<T> _send<T>(Future<T> Function() request) async {
    try {
      return await request().timeout(const Duration(seconds: 15));
    } on SocketException {
      throw ApiException(
          'Cannot reach server at $base. Start the backend (npm run dev) and check ApiConfig in lib/utils/api_config.dart');
    } on TimeoutException {
      throw ApiException(
          'Request timed out. Check your network and backend URL ($base)');
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
    final res = await _send(
        () => http.get(Uri.parse('$base/auth/profile'), headers: headers));
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
    final res = await _send(() => http.put(
        Uri.parse('$base/auth/change-password'),
        headers: headers,
        body:
            jsonEncode({'currentPassword': current, 'newPassword': newPass})));
    _handle(res);
  }

  Future<String> requestChangePasswordOtp() async {
    final res = await _send(() async => http.post(Uri.parse('$base/auth/change-password/request-otp'), headers: await _headers));
    return (_handle(res) as Map)['message']?.toString() ?? 'Verification code sent.';
  }

  Future<String> verifyChangePasswordOtp(String code) async {
    final res = await _send(() async => http.post(Uri.parse('$base/auth/change-password/verify-otp'), headers: await _headers, body: jsonEncode({'token': code})));
    return (_handle(res) as Map)['message']?.toString() ?? 'Code verified.';
  }

  Future<String> changePasswordWithOtp(String newPassword) async {
    final res = await _send(() async => http.put(Uri.parse('$base/auth/change-password/with-otp'), headers: await _headers, body: jsonEncode({'newPassword': newPassword})));
    return (_handle(res) as Map)['message']?.toString() ?? 'Password changed successfully.';
  }

  // ── Scrap ───────────────────────────────────────────────────
  String _mimeTypeForImage(XFile photo) {
    if (photo.mimeType != null && photo.mimeType!.isNotEmpty) {
      return photo.mimeType!;
    }
    final ext = photo.name.split('.').last.toLowerCase();
    if (ext == 'png') return 'image/png';
    return 'image/jpeg';
  }

  String _extensionForImage(XFile photo) {
    final mimeType = _mimeTypeForImage(photo);
    if (mimeType == 'image/png') return 'png';
    return 'jpg';
  }

  String _safeFilenameForImage(XFile photo, int index) {
    final ext = _extensionForImage(photo);
    final originalName = photo.name.isNotEmpty ? photo.name : 'scrap_photo';
    final filename = originalName.split(RegExp(r'[\\/]')).last;
    final dotIndex = filename.lastIndexOf('.');
    final nameWithoutExt =
        dotIndex > 0 ? filename.substring(0, dotIndex) : filename;
    var safeBase = nameWithoutExt
        .replaceAll(RegExp(r'[^A-Za-z0-9_-]+'), '_')
        .replaceAll(RegExp(r'_+'), '_')
        .replaceAll(RegExp(r'^_+|_+$'), '');

    if (safeBase.isEmpty) safeBase = 'scrap_photo';
    if (safeBase.length > 48) safeBase = safeBase.substring(0, 48);

    return '${safeBase}_${DateTime.now().microsecondsSinceEpoch}_$index.$ext';
  }

  Future<ScrapModel> submitScrap(Map<String, dynamic> data,
      {List<XFile>? photos}) async {
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

    for (var i = 0; i < photos.length; i++) {
      final photo = photos[i];
      final bytes = await photo.readAsBytes();
      request.files.add(
        http.MultipartFile.fromBytes(
          'photos',
          bytes,
          filename: _safeFilenameForImage(photo, i + 1),
          contentType: MediaType.parse(_mimeTypeForImage(photo)),
        ),
      );
    }

    final streamResponse = await _send(() => request.send());
    final response = await http.Response.fromStream(streamResponse);
    return ScrapModel.fromJson(_handle(response));
  }

  Future<List<ScrapModel>> getMyScrap() async {
    final res =
        await http.get(Uri.parse('$base/scrap/my'), headers: await _headers);
    return (_handle(res) as List).map((e) => ScrapModel.fromJson(e)).toList();
  }

  Future<Map<String, dynamic>> getAllScraps({String? status}) async {
    final q = status != null && status.isNotEmpty ? '?status=$status' : '';
    final res =
        await http.get(Uri.parse('$base/scrap$q'), headers: await _headers);
    return _handle(res);
  }

  Future<List<ScrapCategoryModel>> getScrapCategories() async {
    final headers = await _headers;
    final res = await _send(
        () => http.get(Uri.parse('$base/scrap/categories'), headers: headers));
    final body = _handle(res);
    final categories = body is List ? body : body['categories'] as List? ?? [];
    return categories.map((e) => ScrapCategoryModel.fromJson(e)).toList();
  }

  Future<void> updateScrapStatus(String id, String status,
      {String? notes, String? collectorId}) async {
    final res = await http.put(Uri.parse('$base/scrap/$id/status'),
        headers: await _headers,
        body: jsonEncode({
          'status': status,
          if (notes != null) 'adminNotes': notes,
          if (collectorId != null) 'collector_id': collectorId,
        }));
    _handle(res);
  }

  Future<void> claimScrapRequest(String id) async {
    final res = await http.post(Uri.parse('$base/scrap/$id/claim'),
        headers: await _headers);
    _handle(res);
  }

  Future<void> declineScrapRequest(String id) async {
    final res = await http.post(Uri.parse('$base/scrap/$id/decline'),
        headers: await _headers);
    _handle(res);
  }

  Future<String> forgotPassword(String email) async {
    final res = await _send(() => http.post(
          Uri.parse('$base/auth/forgot-password'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'email': email}),
        ));
    final body = _handle(res) as Map;
    return body['message']?.toString() ??
        'If an account exists, a reset code has been sent.';
  }

  Future<String> resetPassword(String email, String newPassword) async {
    final res = await _send(() => http.post(
          Uri.parse('$base/auth/reset-password'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'email': email,
            'newPassword': newPassword,
          }),
        ));
    final body = _handle(res) as Map;
    return body['message']?.toString() ?? 'Password reset successfully.';
  }

  Future<String> verifyResetCode(String email, String code) async {
    final res = await _send(() => http.post(
          Uri.parse('$base/auth/verify-reset-code'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'email': email, 'token': code}),
        ));
    final body = _handle(res) as Map;
    return body['message']?.toString() ?? 'Code verified.';
  }

  // ── Products ────────────────────────────────────────────────
  Future<List<ProductModel>> getProducts(
      {String? search, String? category, String? sort}) async {
    final params = <String, String>{};
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (category != null && category.isNotEmpty && category != 'All')
      params['category'] = category;
    if (sort != null && sort.isNotEmpty) params['sort'] = sort;
    final uri = Uri.parse('$base/products').replace(queryParameters: params);
    final res = await http.get(uri, headers: await _headers);
    final body = _handle(res);
    final products =
        body is Map ? body['products'] as List? ?? [] : body as List? ?? [];
    return products.map((e) => ProductModel.fromJson(e)).toList();
  }

  Future<List<String>> getProductCategories() async {
    final res = await http.get(Uri.parse('$base/products/categories'),
        headers: await _headers);
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
    final res = await http.get(Uri.parse('$base/products/$id'),
        headers: await _headers);
    return ProductModel.fromJson(_handle(res));
  }

  Future<ProductModel> createProduct(Map<String, dynamic> data) async {
    final res = await http.post(Uri.parse('$base/products'),
        headers: await _headers, body: jsonEncode(data));
    return ProductModel.fromJson(_handle(res));
  }

  Future<ProductModel> updateProduct(
      String id, Map<String, dynamic> data) async {
    final res = await http.put(Uri.parse('$base/products/$id'),
        headers: await _headers, body: jsonEncode(data));
    return ProductModel.fromJson(_handle(res));
  }

  Future<void> deleteProduct(String id) async {
    final res = await http.delete(Uri.parse('$base/products/$id'),
        headers: await _headers);
    _handle(res);
  }

  // ── Orders ──────────────────────────────────────────────────
  Future<OrderModel> placeOrder(Map<String, dynamic> data) async {
    final res = await http.post(Uri.parse('$base/orders'),
        headers: await _headers, body: jsonEncode(data));
    return OrderModel.fromJson(_handle(res));
  }

  Future<Map<String, dynamic>> initiateEsewaPayment(
      Map<String, dynamic> data) async {
    final res = await http.post(Uri.parse('$base/orders/esewa/initiate'),
        headers: await _headers, body: jsonEncode(data));
    return _handle(res);
  }

  Future<Map<String, dynamic>> verifyEsewaPayment(
      Map<String, dynamic> data) async {
    final res = await http.post(Uri.parse('$base/orders/esewa/verify'),
        headers: await _headers, body: jsonEncode(data));
    return _handle(res);
  }

  Future<Map<String, dynamic>> handleEsewaFailure(
      Map<String, dynamic> data) async {
    final res = await http.post(Uri.parse('$base/orders/esewa/failure'),
        headers: await _headers, body: jsonEncode(data));
    return _handle(res);
  }

  Future<List<OrderModel>> getMyOrders() async {
    final res =
        await http.get(Uri.parse('$base/orders/my'), headers: await _headers);
    return (_handle(res) as List).map((e) => OrderModel.fromJson(e)).toList();
  }

  Future<Map<String, dynamic>> getMyDeliveries() async {
    final res = await http.get(Uri.parse('$base/orders/deliveries/my'),
        headers: await _headers);
    return _handle(res);
  }

  Future<void> updateDeliveryStatus(String orderId, String status) async {
    final res = await http.put(
        Uri.parse('$base/orders/$orderId/delivery-status'),
        headers: await _headers,
        body: jsonEncode({'orderStatus': status}));
    _handle(res);
  }

  // ── Live notifications ──────────────────────────────────────
  Future<List<Map<String, dynamic>>> getMyNotifications() async {
    final res = await _send(() async =>
        http.get(Uri.parse('$base/notifications'), headers: await _headers));
    return (_handle(res) as List)
        .map((item) => Map<String, dynamic>.from(item as Map))
        .toList();
  }

  Future<void> markNotificationRead(String id) async {
    final res = await _send(() async => http.put(
        Uri.parse('$base/notifications/$id/read'),
        headers: await _headers));
    _handle(res);
  }

  Future<void> markAllNotificationsRead() async {
    final res = await _send(() async => http.put(
        Uri.parse('$base/notifications/read-all'),
        headers: await _headers));
    _handle(res);
  }

  /// Foreground live stream. Notifications remain available through the list API
  /// if the app is offline or in the background.
  Stream<Map<String, dynamic>> streamNotifications() async* {
    final request =
        http.Request('GET', Uri.parse('$base/notifications/stream'));
    request.headers.addAll(await _headers);
    final response = await http.Client().send(request);
    if (response.statusCode != 200)
      throw ApiException('Unable to connect to notification stream');
    await for (final line in response.stream
        .transform(utf8.decoder)
        .transform(const LineSplitter())) {
      if (!line.startsWith('data: ')) continue;
      final decoded = jsonDecode(line.substring(6));
      if (decoded is Map && decoded.isNotEmpty)
        yield Map<String, dynamic>.from(decoded);
    }
  }

  // ── Complaints ──────────────────────────────────────────────
  Future<Map<String, dynamic>> submitComplaint(
      Map<String, dynamic> data) async {
    final res = await http.post(Uri.parse('$base/complaints'),
        headers: await _headers, body: jsonEncode(data));
    return Map<String, dynamic>.from(_handle(res) as Map);
  }

  Future<List<Map<String, dynamic>>> getMyComplaints() async {
    final res = await http.get(Uri.parse('$base/complaints/my'),
        headers: await _headers);
    return (_handle(res) as List)
        .map((item) => Map<String, dynamic>.from(item as Map))
        .toList();
  }

  // ── Dashboard ───────────────────────────────────────────────
  Future<Map<String, dynamic>> getUserDashboard() async {
    final res = await http.get(Uri.parse('$base/dashboard/user'),
        headers: await _headers);
    return _handle(res);
  }
}
