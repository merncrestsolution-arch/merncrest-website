import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:merncrest_connect/config/api_config.dart';
import 'package:merncrest_connect/services/api_client.dart';
import 'package:merncrest_connect/services/app_update_service.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/widgets/app_update_overlay.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:merncrest_connect/widgets/turnstile_challenge.dart';

/// Stitch System login — dark enterprise split hero + form card.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.onLogin});

  final Future<void> Function(String email, String password, {String? turnstileToken}) onLogin;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  bool _busy = false;
  bool _turnstileRequired = false;
  bool _turnstileConfigured = false;
  String _turnstileToken = '';
  String? _error;
  AppUpdateInfo? _update;
  bool _updateDialogShown = false;
  final _updateService = AppUpdateService();

  @override
  void initState() {
    super.initState();
    _loadConfig();
    _checkForUpdate();
  }

  Future<void> _checkForUpdate() async {
    try {
      final info = await _updateService.checkForUpdate();
      if (!mounted || info == null) return;
      setState(() => _update = info);
      if (!_updateDialogShown) {
        _updateDialogShown = true;
        WidgetsBinding.instance.addPostFrameCallback((_) => _showUpdateDialog(info));
      }
    } catch (_) {}
  }

  void _showUpdateDialog(AppUpdateInfo info) {
    if (!mounted) return;
    final palette = ConnectPalette.of(context);
    showDialog<void>(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.7),
      barrierDismissible: !info.forceUpdate,
      builder: (ctx) => Dialog(
        backgroundColor: palette.surfaceRaised,
        insetPadding: const EdgeInsets.symmetric(horizontal: 24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24), side: BorderSide(color: palette.borderSubtle)),
        child: AppUpdateCard(info: info, onDismiss: info.forceUpdate ? null : () => Navigator.of(ctx).pop()),
      ),
    );
  }

  Future<void> _loadConfig() async {
    try {
      final cfg = await ApiClient().get('/api/auth/mobile/config');
      if (mounted) {
        setState(() {
          _turnstileRequired = cfg['turnstileRequired'] == true;
          _turnstileConfigured = (cfg['turnstileSiteKey']?.toString() ?? '').isNotEmpty;
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_turnstileRequired && _turnstileToken.isEmpty) {
      setState(() => _error = 'Please complete the security check.');
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      await widget.onLogin(_email.text, _password.text, turnstileToken: _turnstileToken.isEmpty ? null : _turnstileToken);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', '').replaceFirst('ApiException: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return Scaffold(
      backgroundColor: palette.background,
      body: ConnectAmbientBackground(
        child: Column(
          children: [
            Expanded(
              flex: 42,
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('System', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: palette.accentHighlight))
                          .stitchEntrance(),
                      RichText(
                        text: TextSpan(
                          style: Theme.of(context).textTheme.headlineLarge,
                          children: [
                            const TextSpan(text: 'System'),
                            TextSpan(text: '.merncrest', style: TextStyle(color: palette.accentHighlight)),
                          ],
                        ),
                      ).stitchEntrance(delay: 60.ms),
                      const SizedBox(height: 10),
                      Text(
                        'Employee self-service for attendance, CRM, live chat, tasks, and ERP — synced with system.merncrest.lk.',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ).stitchEntrance(delay: 120.ms),
                      const SizedBox(height: 18),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: ['Attendance', 'Live chat', 'CRM', 'Tasks']
                            .map((f) => Chip(
                                  label: Text(f, style: const TextStyle(fontSize: 11)),
                                  backgroundColor: palette.surfaceRaised,
                                  side: BorderSide(color: palette.borderSubtle),
                                  labelStyle: TextStyle(color: palette.textSecondary),
                                ))
                            .toList(),
                      ).stitchEntrance(delay: 180.ms),
                      const Spacer(),
                      Center(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(28),
                          child: Image.asset('assets/images/app_icon.png', width: 88, height: 88),
                        ),
                      ).stitchEntrance(delay: 220.ms),
                    ],
                  ),
                ),
              ),
            ),
            Expanded(
              flex: 58,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: palette.surface,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                  border: Border(top: BorderSide(color: palette.borderSubtle)),
                ),
                child: SafeArea(
                  top: false,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
                    children: [
                      Text('Welcome back', style: Theme.of(context).textTheme.headlineMedium).stitchEntrance(),
                      Text('Sign in with your MernCrest work email', style: Theme.of(context).textTheme.bodyMedium).stitchEntrance(delay: 40.ms),
                      if (_update != null) ...[
                        const SizedBox(height: 16),
                        AppUpdateLoginBanner(info: _update!).stitchEntrance(delay: 80.ms),
                      ],
                      const SizedBox(height: 20),
                      TextField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        autofillHints: const [AutofillHints.username, AutofillHints.email],
                        style: TextStyle(color: palette.textPrimary),
                        decoration: const InputDecoration(labelText: 'Work email', hintText: 'staff@merncrest.lk', prefixIcon: Icon(Icons.alternate_email_rounded)),
                      ).stitchEntrance(delay: 100.ms),
                      const SizedBox(height: 14),
                      TextField(
                        controller: _password,
                        obscureText: _obscure,
                        autofillHints: const [AutofillHints.password],
                        style: TextStyle(color: palette.textPrimary),
                        decoration: InputDecoration(
                          labelText: 'Password',
                          prefixIcon: const Icon(Icons.lock_outline_rounded),
                          suffixIcon: IconButton(
                            icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                            onPressed: () => setState(() => _obscure = !_obscure),
                          ),
                        ),
                        onSubmitted: (_) => _busy ? null : _submit(),
                      ).stitchEntrance(delay: 140.ms),
                      if (_turnstileRequired && _turnstileConfigured)
                        Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: TurnstileChallenge(required: _turnstileRequired, onToken: (t) => setState(() => _turnstileToken = t)),
                        ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: ConnectColors.error.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: ConnectColors.error.withValues(alpha: 0.35)),
                          ),
                          child: Text(_error!, style: const TextStyle(color: ConnectColors.error)),
                        ),
                      ],
                      const SizedBox(height: 20),
                      ConnectPressable(
                        enabled: !_busy,
                        onPressed: _submit,
                        child: ConnectPrimaryButton(label: 'Sign in to workspace', loading: _busy, icon: Icons.arrow_forward_rounded, onPressed: _busy ? null : _submit),
                      ).stitchEntrance(delay: 200.ms),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.verified_user_outlined, size: 14, color: ConnectColors.success),
                          const SizedBox(width: 6),
                          Text(
                            ApiConfig.baseUrl.contains('localhost') ? 'localhost · dev' : 'system.merncrest.lk · secure',
                            style: Theme.of(context).textTheme.labelSmall,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
