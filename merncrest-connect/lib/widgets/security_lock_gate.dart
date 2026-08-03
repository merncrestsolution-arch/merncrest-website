import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:merncrest_connect/services/security_prefs_service.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';

/// Gates the authenticated shell behind biometric or PIN when enabled.
class SecurityLockGate extends StatefulWidget {
  const SecurityLockGate({super.key, required this.child});

  final Widget child;

  @override
  State<SecurityLockGate> createState() => _SecurityLockGateState();
}

class _SecurityLockGateState extends State<SecurityLockGate> with WidgetsBindingObserver {
  final _prefs = SecurityPrefsService();
  final _localAuth = LocalAuthentication();
  bool _locked = false;
  bool _checking = true;
  bool _biometricEnabled = false;
  bool _pinEnabled = false;
  bool _wasBackground = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _evaluateLock();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.hidden) {
      _wasBackground = true;
    }
    if (state == AppLifecycleState.resumed && _wasBackground && (_biometricEnabled || _pinEnabled)) {
      setState(() => _locked = true);
      _tryBiometric();
    }
  }

  Future<void> _evaluateLock() async {
    _biometricEnabled = await _prefs.isBiometricEnabled();
    _pinEnabled = await _prefs.isPinEnabled();
    final needsLock = _biometricEnabled || _pinEnabled;
    if (mounted) {
      setState(() {
        _locked = needsLock;
        _checking = false;
      });
    }
    if (needsLock && _biometricEnabled) {
      await _tryBiometric();
    }
  }

  Future<void> _tryBiometric() async {
    if (!_biometricEnabled || !_locked) return;
    try {
      final ok = await _localAuth.authenticate(
        localizedReason: 'Unlock MernCrest Connect',
        options: const AuthenticationOptions(biometricOnly: false, stickyAuth: true),
      );
      if (ok && mounted) setState(() => _locked = false);
    } catch (_) {}
  }

  void _unlockWithPin(String pin) async {
    final ok = await _prefs.verifyPin(pin);
    if (ok && mounted) {
      HapticFeedback.lightImpact();
      setState(() => _locked = false);
    } else if (mounted) {
      HapticFeedback.heavyImpact();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Incorrect PIN')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return Scaffold(
        backgroundColor: ConnectPalette.of(context).background,
        body: const Center(child: CircularProgressIndicator(color: ConnectColors.primary)),
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        widget.child,
        if (_locked)
          Positioned.fill(
            child: Material(
              color: ConnectPalette.of(context).background,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(ConnectSpacing.lg),
                  child: Column(
                    children: [
                      const Spacer(),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: Image.asset('assets/images/app_icon.png', width: 72, height: 72),
                      ),
                      const SizedBox(height: ConnectSpacing.md),
                      Text('MernCrest Connect', style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 6),
                      Text('Unlock to continue', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
                      const SizedBox(height: ConnectSpacing.lg),
                      if (_biometricEnabled)
                        ConnectPrimaryButton(
                          label: 'Use biometrics',
                          icon: Icons.fingerprint_rounded,
                          onPressed: _tryBiometric,
                        ),
                      if (_pinEnabled) ...[
                        const SizedBox(height: ConnectSpacing.md),
                        _PinUnlock(onComplete: _unlockWithPin),
                      ],
                      const Spacer(),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _PinUnlock extends StatefulWidget {
  const _PinUnlock({required this.onComplete});
  final ValueChanged<String> onComplete;

  @override
  State<_PinUnlock> createState() => _PinUnlockState();
}

class _PinUnlockState extends State<_PinUnlock> {
  String _pin = '';

  void _tap(String digit) {
    if (_pin.length >= 6) return;
    setState(() => _pin += digit);
    if (_pin.length >= 4) {
      widget.onComplete(_pin);
      setState(() => _pin = '');
    }
  }

  void _backspace() {
    if (_pin.isEmpty) return;
    setState(() => _pin = _pin.substring(0, _pin.length - 1));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            6,
            (i) => Container(
              width: 10,
              height: 10,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: i < _pin.length ? ConnectColors.primary : ConnectColors.textMuted.withValues(alpha: 0.3),
              ),
            ),
          ),
        ),
        const SizedBox(height: ConnectSpacing.md),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          alignment: WrapAlignment.center,
          children: [
            for (final d in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0'])
              SizedBox(
                width: 64,
                height: 48,
                child: OutlinedButton(
                  onPressed: () {
                    if (d == '⌫') {
                      _backspace();
                    } else {
                      _tap(d);
                    }
                  },
                  child: Text(d, style: const TextStyle(fontSize: 16)),
                ),
              ),
          ],
        ),
      ],
    );
  }
}
