import 'dart:async';

import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _api = ApiService();
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  StreamSubscription<Map<String, dynamic>>? _subscription;

  @override
  void initState() {
    super.initState();
    _load();
    _listen();
  }

  void _listen() {
    _subscription = _api.streamNotifications().listen((item) {
      if (!mounted) return;
      setState(() =>
          _items = [item, ..._items.where((old) => old['_id'] != item['_id'])]);
    }, onError: (_) {
      // The saved inbox is still available; reconnect when this page is reopened.
    });
  }

  Future<void> _load() async {
    try {
      final items = await _api.getMyNotifications();
      if (mounted)
        setState(() {
          _items = items;
          _loading = false;
        });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _read(Map<String, dynamic> item) async {
    if (item['is_read'] == true) return;
    await _api.markNotificationRead(item['_id'].toString());
    if (mounted) setState(() => item['is_read'] = true);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: const Text('Notifications'),
          actions: [
            TextButton(
                onPressed: () async {
                  await _api.markAllNotificationsRead();
                  await _load();
                },
                child: const Text('Mark all read'))
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _load,
                child: _items.isEmpty
                    ? ListView(children: const [
                        SizedBox(height: 180),
                        Center(child: Text('You are all caught up.'))
                      ])
                    : ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: _items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (_, index) {
                          final item = _items[index];
                          final unread = item['is_read'] != true;
                          return Card(
                            color: unread
                                ? AppColors.lightGreen.withValues(alpha: .08)
                                : null,
                            child: ListTile(
                              leading: Icon(
                                  item['type'] == 'order_update'
                                      ? Icons.local_shipping_outlined
                                      : Icons.recycling_outlined,
                                  color: AppColors.lightGreen),
                              title: Text(
                                  item['title']?.toString() ?? 'Notification',
                                  style: TextStyle(
                                      fontWeight: unread
                                          ? FontWeight.w700
                                          : FontWeight.w500)),
                              subtitle: Text(item['message']?.toString() ?? ''),
                              onTap: () => _read(item),
                            ),
                          );
                        },
                      ),
              ),
      );
}
