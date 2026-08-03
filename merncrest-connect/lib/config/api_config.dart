/// API base URL for system.merncrest.lk
class ApiConfig {
  static const String productionBase = 'https://system.merncrest.lk';
  static const String devBase = 'http://10.0.2.2:3000';

  /// Override with `--dart-define=API_BASE=https://...`
  static String get baseUrl {
    const fromEnv = String.fromEnvironment('API_BASE');
    if (fromEnv.isNotEmpty) return fromEnv;
    const isProd = bool.fromEnvironment('dart.vm.product');
    return isProd ? productionBase : devBase;
  }
}
