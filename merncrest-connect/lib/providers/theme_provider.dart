import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum ConnectThemeMode { dark, light, amoled }

const _prefKey = 'connect_theme_mode';

class ThemeProvider extends ChangeNotifier {
  ThemeProvider() {
    _restore();
  }

  ConnectThemeMode _mode = ConnectThemeMode.dark;
  bool _ready = false;

  ConnectThemeMode get mode => _mode;
  bool get ready => _ready;

  ThemeMode get materialThemeMode {
    switch (_mode) {
      case ConnectThemeMode.light:
        return ThemeMode.light;
      case ConnectThemeMode.dark:
      case ConnectThemeMode.amoled:
        return ThemeMode.dark;
    }
  }

  bool get isAmoled => _mode == ConnectThemeMode.amoled;
  bool get isLight => _mode == ConnectThemeMode.light;

  Future<void> _restore() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_prefKey);
      if (saved != null) {
        _mode = ConnectThemeMode.values.firstWhere(
          (m) => m.name == saved,
          orElse: () => ConnectThemeMode.dark,
        );
      }
    } catch (_) {}
    _ready = true;
    notifyListeners();
  }

  Future<void> setMode(ConnectThemeMode mode) async {
    if (_mode == mode) return;
    _mode = mode;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefKey, mode.name);
    } catch (_) {}
  }

  String get modeLabel {
    switch (_mode) {
      case ConnectThemeMode.dark:
        return 'Dark';
      case ConnectThemeMode.light:
        return 'Light';
      case ConnectThemeMode.amoled:
        return 'AMOLED';
    }
  }
}
