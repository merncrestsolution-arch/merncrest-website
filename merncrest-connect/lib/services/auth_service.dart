import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:merncrest_connect/services/api_client.dart';

const _tokenKey = 'mc_connect_token';
const _expiresKey = 'mc_connect_expires';

class AuthService {
  AuthService({ApiClient? api, FlutterSecureStorage? storage})
      : _api = api ?? ApiClient(),
        _storage = storage ?? const FlutterSecureStorage();

  final ApiClient _api;
  final FlutterSecureStorage _storage;

  ApiClient get api => _api;

  String get _platform {
    if (kIsWeb) return 'web';
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
        return 'ios';
      case TargetPlatform.android:
        return 'android';
      default:
        return 'flutter';
    }
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    String? turnstileToken,
  }) async {
    final platform = _platform;
    final data = await _api.post('/api/auth/mobile/login', {
      'email': email.trim(),
      'password': password,
      if (turnstileToken != null && turnstileToken.isNotEmpty) 'turnstileToken': turnstileToken,
      'platform': platform,
      'deviceName': 'MernCrest Connect ($platform)',
    });

    final token = data['accessToken'] as String;
    final expires = data['expiresAt'] as String;
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _expiresKey, value: expires);
    _api.setToken(token);
    return data;
  }

  Future<bool> restoreSession() async {
    final token = await _storage.read(key: _tokenKey);
    if (token == null || token.isEmpty) return false;
    _api.setToken(token);
    try {
      await _api.get('/api/auth/mobile/me');
      return true;
    } catch (_) {
      await logout();
      return false;
    }
  }

  Future<Map<String, dynamic>> me() => _api.get('/api/auth/mobile/me');

  Future<Map<String, dynamic>> navigation() => _api.get('/api/staff/navigation');

  Future<void> logout() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _expiresKey);
    _api.setToken(null);
  }
}
