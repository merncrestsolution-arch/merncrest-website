import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:merncrest_connect/config/api_config.dart';
import 'package:merncrest_connect/services/api_client.dart';

/// Real-time sync — instant SSE push + 2s reconnect (website · system · mobile).
class PlatformSyncService extends ChangeNotifier {
  PlatformSyncService({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;
  Timer? _fallbackTimer;
  StreamSubscription<List<int>>? _sseSub;
  http.Client? _sseClient;
  String? _since;
  bool _connected = false;
  String? lastEventType;

  int unreadNotifications = 0;
  int liveChats = 0;
  int openTasks = 0;
  int openTickets = 0;
  String? lastSyncAt;

  bool get connected => _connected;

  void start() {
    stop();
    pull();
    _connectStream();
    // Safety net only — primary path is SSE
    _fallbackTimer = Timer.periodic(const Duration(minutes: 2), (_) => pull());
  }

  void stop() {
    _fallbackTimer?.cancel();
    _fallbackTimer = null;
    _sseSub?.cancel();
    _sseSub = null;
    _sseClient?.close();
    _sseClient = null;
    _connected = false;
  }

  Future<void> pull() async {
    try {
      final path = _since != null
          ? '/api/platform/sync?since=${Uri.encodeComponent(_since!)}'
          : '/api/platform/sync';
      final data = await _api.get(path);
      _applyPayload(data);
    } catch (_) {
      _connected = false;
      notifyListeners();
    }
  }

  void _applyPayload(Map<String, dynamic> data) {
    unreadNotifications = (data['unreadNotifications'] as num?)?.toInt() ?? unreadNotifications;
    liveChats = (data['liveChats'] as num?)?.toInt() ?? liveChats;
    openTasks = (data['openTasks'] as num?)?.toInt() ?? openTasks;
    openTickets = (data['openTickets'] as num?)?.toInt() ?? openTickets;
    lastSyncAt = data['serverTime']?.toString();
    _since = lastSyncAt;
    notifyListeners();
  }

  void _applyEvent(Map<String, dynamic> data) {
    final type = data['type']?.toString();
    if (type == null || type == 'ping') return;
    lastEventType = type;

    if (type == 'notification') {
      unreadNotifications = (data['unreadCount'] as num?)?.toInt() ?? unreadNotifications;
    }
    if (type == 'snapshot') {
      liveChats = (data['liveChats'] as num?)?.toInt() ?? liveChats;
      openTickets = (data['openTickets'] as num?)?.toInt() ?? openTickets;
    }
    if (type == 'snapshot_user') {
      unreadNotifications = (data['unreadNotifications'] as num?)?.toInt() ?? unreadNotifications;
      openTasks = (data['openTasks'] as num?)?.toInt() ?? openTasks;
    }

    notifyListeners();

    if (type == 'task' ||
        type == 'ticket' ||
        type == 'chat_inbox' ||
        type == 'chat_message' ||
        type == 'announcement' ||
        type == 'crm_update') {
      pull();
    }
  }

  void _connectStream() {
    final token = _api.token;
    if (token == null) return;

    _sseClient?.close();
    _sseClient = http.Client();

    final url = Uri.parse(
      '${ApiConfig.baseUrl}/api/platform/stream?access_token=${Uri.encodeComponent(token)}',
    );

    _sseClient!
        .send(http.Request('GET', url)..headers['X-MernCrest-Client'] = 'connect-mobile')
        .then((streamed) {
      _connected = true;
      notifyListeners();

      final buffer = StringBuffer();
      _sseSub = streamed.stream.listen(
        (bytes) {
          buffer.write(utf8.decode(bytes));
          final text = buffer.toString();
          final lines = text.split('\n');
          buffer.clear();
          if (!text.endsWith('\n')) {
            buffer.write(lines.removeLast());
          }
          for (final line in lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              final data = jsonDecode(line.substring(6)) as Map<String, dynamic>;
              if (data['type'] == 'connected') {
                _connected = true;
                notifyListeners();
                continue;
              }
              _applyEvent(data);
            } catch (_) {}
          }
        },
        onError: (_) {
          _connected = false;
          notifyListeners();
          Future.delayed(const Duration(seconds: 2), _connectStream);
        },
        onDone: () {
          _connected = false;
          notifyListeners();
          Future.delayed(const Duration(seconds: 2), _connectStream);
        },
        cancelOnError: true,
      );
    }).catchError((_) {
      _connected = false;
      notifyListeners();
      Future.delayed(const Duration(seconds: 2), _connectStream);
    });
  }
}
