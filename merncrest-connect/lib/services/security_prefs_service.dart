import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Local security preferences — biometric toggle and PIN (encrypted).
class SecurityPrefsService {
  SecurityPrefsService({FlutterSecureStorage? storage}) : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _biometricKey = 'connect_biometric_enabled';
  static const _pinEnabledKey = 'connect_pin_enabled';
  static const _pinKey = 'connect_pin_hash';

  Future<bool> isBiometricEnabled() async {
    return (await _storage.read(key: _biometricKey)) == '1';
  }

  Future<void> setBiometricEnabled(bool value) async {
    await _storage.write(key: _biometricKey, value: value ? '1' : '0');
  }

  Future<bool> isPinEnabled() async {
    return (await _storage.read(key: _pinEnabledKey)) == '1';
  }

  Future<void> setPinEnabled(bool value) async {
    await _storage.write(key: _pinEnabledKey, value: value ? '1' : '0');
    if (!value) await _storage.delete(key: _pinKey);
  }

  Future<void> setPin(String pin) async {
    await _storage.write(key: _pinKey, value: pin);
  }

  Future<String?> getPin() async => _storage.read(key: _pinKey);

  Future<bool> verifyPin(String input) async {
    final stored = await getPin();
    return stored != null && stored == input;
  }

  Future<void> setSignatureJson(String? json) async {
    if (json == null) {
      await _storage.delete(key: 'connect_signature_json');
    } else {
      await _storage.write(key: 'connect_signature_json', value: json);
    }
  }

  Future<String?> getSignatureJson() async => _storage.read(key: 'connect_signature_json');
}
