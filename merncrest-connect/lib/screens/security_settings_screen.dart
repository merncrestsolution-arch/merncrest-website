import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:merncrest_connect/services/security_prefs_service.dart';
import 'package:merncrest_connect/screens/login_history_screen.dart';
import 'package:merncrest_connect/services/ssl_pinning_service.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_expandable.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';

class SecuritySettingsScreen extends StatefulWidget {
  const SecuritySettingsScreen({super.key});

  @override
  State<SecuritySettingsScreen> createState() => _SecuritySettingsScreenState();
}

class _SecuritySettingsScreenState extends State<SecuritySettingsScreen> {
  final _auth = LocalAuthentication();
  final _prefs = SecurityPrefsService();
  bool _biometricAvailable = false;
  bool _biometricEnabled = false;
  bool _pinEnabled = false;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      _biometricAvailable = await _auth.canCheckBiometrics || await _auth.isDeviceSupported();
      _biometricEnabled = await _prefs.isBiometricEnabled();
      _pinEnabled = await _prefs.isPinEnabled();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _toggleBiometric(bool value) async {
    if (value) {
      final ok = await _auth.authenticate(
        localizedReason: 'Enable biometric unlock for MernCrest Connect',
        options: const AuthenticationOptions(biometricOnly: true, stickyAuth: true),
      );
      if (!ok) return;
    }
    await _prefs.setBiometricEnabled(value);
    setState(() => _biometricEnabled = value);
    HapticFeedback.lightImpact();
  }

  Future<void> _setPin() async {
    final controller = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ConnectPalette.of(ctx).surfaceRaised,
        title: const Text('Set PIN'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          maxLength: 6,
          obscureText: true,
          decoration: const InputDecoration(labelText: '4–6 digit PIN'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save')),
        ],
      ),
    );
    if (ok == true && controller.text.length >= 4) {
      await _prefs.setPin(controller.text);
      await _prefs.setPinEnabled(true);
      setState(() {
        _pinEnabled = true;
      });
    }
    controller.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(title: const Text('Security')),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : ListView(
                padding: const EdgeInsets.all(ConnectSpacing.lg),
                children: [
                  ConnectCard(
                    featured: true,
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: ConnectModuleColors.security.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(ConnectRadius.md),
                          ),
                          child: const Icon(Icons.shield_rounded, color: ConnectModuleColors.security, size: 28),
                        ),
                        const SizedBox(width: ConnectSpacing.sm),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Privacy & Security', style: Theme.of(context).textTheme.titleMedium),
                              Text('Biometric · PIN · device binding', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const ConnectSectionHeader(title: 'Unlock'),
                  ConnectCard(
                    child: Column(
                      children: [
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('Face ID / Fingerprint'),
                          subtitle: Text(_biometricAvailable ? 'Use device biometrics' : 'Not available on this device'),
                          value: _biometricEnabled,
                          onChanged: _biometricAvailable ? _toggleBiometric : null,
                          activeThumbColor: ConnectColors.primary,
                        ),
                        const Divider(height: 1),
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('PIN Lock'),
                          subtitle: Text(_pinEnabled ? 'PIN configured' : 'Set a backup PIN'),
                          value: _pinEnabled,
                          onChanged: (v) async {
                            if (v) {
                              await _setPin();
                            } else {
                              await _prefs.setPinEnabled(false);
                              setState(() => _pinEnabled = false);
                            }
                          },
                          activeThumbColor: ConnectColors.primary,
                        ),
                        if (_pinEnabled)
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: const Text('Change PIN'),
                            trailing: const Icon(Icons.chevron_right_rounded, color: ConnectColors.textMuted),
                            onTap: _setPin,
                          ),
                      ],
                    ),
                  ),
                  ConnectExpandableSection(
                    title: 'Sessions & Devices',
                    icon: Icons.devices_rounded,
                    iconColor: ConnectModuleColors.security,
                    children: [
                      const ConnectInfoField(label: 'This device', value: 'Active · Mobile'),
                      const ConnectInfoField(label: 'Session', value: 'JWT + refresh token'),
                      ConnectInfoField(label: 'Device binding', value: 'Enabled on server', icon: Icons.link_rounded),
                    ],
                  ),
                  ConnectExpandableSection(
                    title: 'Data Protection',
                    icon: Icons.lock_outline_rounded,
                    iconColor: ConnectModuleColors.erp,
                    children: [
                      const ConnectInfoField(label: 'Storage', value: 'Flutter Secure Storage'),
                      const ConnectInfoField(label: 'Transport', value: 'TLS / HTTPS'),
                      ConnectInfoField(label: 'SSL Pinning', value: SslPinningService.statusLabel()),
                    ],
                  ),
                  const ConnectSectionHeader(title: 'Audit'),
                  ConnectCard(
                    child: Column(
                      children: [
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.history_rounded, color: ConnectColors.primaryGlow),
                          title: const Text('Login history'),
                          subtitle: const Text('View recent sign-ins'),
                          trailing: const Icon(Icons.chevron_right_rounded, color: ConnectColors.textMuted),
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginHistoryScreen())),
                        ),
                        const Divider(height: 1),
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.article_outlined, color: ConnectColors.primaryGlow),
                          title: const Text('Security activity'),
                          subtitle: const Text('Same as login history on mobile'),
                          trailing: const Icon(Icons.chevron_right_rounded, color: ConnectColors.textMuted),
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginHistoryScreen())),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
