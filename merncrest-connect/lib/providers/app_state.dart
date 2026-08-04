import 'package:flutter/foundation.dart';
import 'package:merncrest_connect/services/auth_service.dart';
import 'package:merncrest_connect/services/platform_sync_service.dart';

class AppState extends ChangeNotifier {
  AppState({AuthService? auth}) : _auth = auth ?? AuthService();

  final AuthService _auth;
  PlatformSyncService? _sync;
  bool _loading = true;
  bool _authenticated = false;
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _navigation;
  String? _error;

  bool get loading => _loading;
  bool get authenticated => _authenticated;
  Map<String, dynamic>? get user => _user;
  Map<String, dynamic>? get navigation => _navigation;
  String? get error => _error;
  AuthService get auth => _auth;
  PlatformSyncService? get sync => _sync;

  int _shellTab = 0;
  int get shellTab => _shellTab;

  void goToShellTab(int index) {
    if (_shellTab == index) return;
    _shellTab = index;
    notifyListeners();
  }

  String get displayName =>
      _user?['user']?['fullName']?.toString() ?? _user?['fullName']?.toString() ?? 'Staff';

  bool hasPermission(String code) {
    final perms = _user?['permissions'];
    if (perms is List) return perms.map((e) => e.toString()).contains(code);
    return false;
  }

  bool get canManageBilling => hasPermission('billing.manage');

  Future<void> bootstrap() async {
    _loading = true;
    notifyListeners();
    final ok = await _auth.restoreSession();
    if (ok) {
      await _loadProfile();
      _sync = PlatformSyncService(api: _auth.api)..start();
    }
    _authenticated = ok;
    _loading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password, {String? turnstileToken}) async {
    _error = null;
    _loading = true;
    notifyListeners();
    try {
      final trimmed = email.trim();
      if (!trimmed.contains('@')) {
        throw Exception('Enter your full work email (e.g. staff@merncrest.lk)');
      }
      await _auth.login(
        email: trimmed,
        password: password,
        turnstileToken: turnstileToken,
      );
      await _loadProfile();
      _authenticated = true;
      _sync = PlatformSyncService(api: _auth.api)..start();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _authenticated = false;
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> _loadProfile() async {
    _user = await _auth.me();
    _navigation = await _auth.navigation();
  }

  Future<void> refresh() async {
    if (!_authenticated) return;
    await _loadProfile();
    notifyListeners();
  }

  Future<void> logout() async {
    _sync?.stop();
    _sync = null;
    await _auth.logout();
    _authenticated = false;
    _user = null;
    _navigation = null;
    notifyListeners();
  }
}
