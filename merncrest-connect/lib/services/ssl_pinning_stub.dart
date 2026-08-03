import 'package:merncrest_connect/config/api_config.dart';

/// Web / unsupported — pinning is a no-op.
class SslPinningPlatform {
  static bool get targetsProductionHost {
    final host = Uri.tryParse(ApiConfig.baseUrl)?.host ?? '';
    return host == 'system.merncrest.lk';
  }

  static bool get pinsConfigured => false;
  static bool get enforced => false;
  static String statusLabel() => SslPinningServiceLogic.statusLabel(targetsProductionHost, false);
  static void initialize() {}
}

/// Shared status text for mobile + web builds.
class SslPinningServiceLogic {
  static String statusLabel(bool productionHost, bool pinsConfigured) {
    if (!productionHost) return 'Dev / custom API — pinning skipped';
    if (!pinsConfigured) return 'TLS HTTPS — add certificate pins for production';
    return 'Active — SHA-256 certificate pinning';
  }
}
