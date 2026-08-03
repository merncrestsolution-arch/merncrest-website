import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Lightweight offline snapshot for platform sync counters.
class OfflineCacheService {
  static const _syncKey = 'connect_offline_sync_v1';

  static Future<void> saveSyncSnapshot(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_syncKey, jsonEncode({
      'unreadNotifications': data['unreadNotifications'],
      'liveChats': data['liveChats'],
      'openTasks': data['openTasks'],
      'openTickets': data['openTickets'],
      'serverTime': data['serverTime'],
    }));
  }

  static Future<Map<String, dynamic>?> readSyncSnapshot() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_syncKey);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }
}
