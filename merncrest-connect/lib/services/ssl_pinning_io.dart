import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:merncrest_connect/config/api_config.dart';
import 'package:merncrest_connect/services/ssl_pinning_stub.dart';

/// Certificate pinning for production API hosts (dart:io builds).
class SslPinningPlatform {
  /// SHA-256 (base64) fingerprints of trusted leaf/intermediate certs.
  static const List<String> productionPinFingerprints = <String>[
    // Ops: add pins when rotating TLS on system.merncrest.lk
  ];

  static bool get targetsProductionHost {
    final host = Uri.tryParse(ApiConfig.baseUrl)?.host ?? '';
    return host == 'system.merncrest.lk';
  }

  static bool get pinsConfigured => productionPinFingerprints.isNotEmpty;

  static bool get enforced => targetsProductionHost && pinsConfigured;

  static String statusLabel() =>
      SslPinningServiceLogic.statusLabel(targetsProductionHost, pinsConfigured);

  static void initialize() {
    if (enforced) {
      HttpOverrides.global = _PinnedHttpOverrides(productionPinFingerprints);
    }
  }

  static String fingerprintSha256Base64(X509Certificate cert) {
    return base64.encode(sha256.convert(cert.der).bytes);
  }
}

class _PinnedHttpOverrides extends HttpOverrides {
  _PinnedHttpOverrides(this.pins);

  final List<String> pins;

  @override
  HttpClient createHttpClient(SecurityContext? context) {
    final client = super.createHttpClient(context);
    client.badCertificateCallback = (cert, host, port) {
      if (host != 'system.merncrest.lk') return false;
      final fp = SslPinningPlatform.fingerprintSha256Base64(cert);
      return pins.contains(fp);
    };
    return client;
  }
}
