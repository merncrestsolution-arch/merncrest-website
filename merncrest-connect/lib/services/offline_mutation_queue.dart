import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Queues API mutations when offline; flushed when sync reconnects.
class OfflineMutationQueue {
  OfflineMutationQueue._();

  static const _key = 'connect_offline_mutations_v1';

  static Future<List<Map<String, dynamic>>> _readAll() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> enqueue({
    required String path,
    required Map<String, dynamic> body,
    String method = 'POST',
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final items = await _readAll();
    items.add({
      'method': method.toUpperCase(),
      'path': path,
      'body': body,
      'createdAt': DateTime.now().toIso8601String(),
    });
    await prefs.setString(_key, jsonEncode(items));
  }

  static Future<int> flush(
    Future<void> Function(String method, String path, Map<String, dynamic> body) send,
  ) async {
    final items = await _readAll();
    if (items.isEmpty) return 0;
    final remaining = <Map<String, dynamic>>[];
    var sent = 0;
    for (final item in items) {
      try {
        final method = (item['method'] as String?)?.toUpperCase() ?? 'POST';
        await send(
          method,
          item['path'] as String,
          Map<String, dynamic>.from(item['body'] as Map),
        );
        sent++;
      } catch (_) {
        remaining.add(item);
      }
    }
    final prefs = await SharedPreferences.getInstance();
    if (remaining.isEmpty) {
      await prefs.remove(_key);
    } else {
      await prefs.setString(_key, jsonEncode(remaining));
    }
    return sent;
  }

  static Future<int> pendingCount() async {
    final items = await _readAll();
    return items.length;
  }
}
