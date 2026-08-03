import 'package:merncrest_connect/services/ssl_pinning_stub.dart'
    if (dart.library.io) 'package:merncrest_connect/services/ssl_pinning_io.dart';

/// Certificate pinning foundation for production API hosts.
class SslPinningService {
  SslPinningService._();

  static bool get targetsProductionHost => SslPinningPlatform.targetsProductionHost;
  static bool get pinsConfigured => SslPinningPlatform.pinsConfigured;
  static bool get enforced => SslPinningPlatform.enforced;
  static String statusLabel() => SslPinningPlatform.statusLabel();
  static void initialize() => SslPinningPlatform.initialize();
}
