import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _loading = true;

  UserModel? get user => _user;
  bool get loading => _loading;
  bool get isLoggedIn => _user != null;
  bool get isAdmin => _user?.role == 'admin';
  bool get isCollector => _user?.role == 'collector';

  AuthProvider() { _init(); }

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token != null) {
      try { _user = await ApiService().getProfile(); }
      catch (_) { await prefs.remove('token'); }
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final data = await ApiService().login(email, password);
    _user = UserModel.fromJson(data['user']);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', data['token']);
    notifyListeners();
  }

  Future<void> register(Map<String, dynamic> data) async {
    final res = await ApiService().register(data);
    _user = UserModel.fromJson(res['user']);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', res['token']);
    notifyListeners();
  }

  Future<void> logout() async {
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    notifyListeners();
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    _user = await ApiService().updateProfile(data);
    notifyListeners();
  }

  void refresh() async {
    try { _user = await ApiService().getProfile(); notifyListeners(); } catch (_) {}
  }
}
