import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:merncrest_connect/config/api_config.dart';
import 'package:merncrest_connect/services/api_client.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/turnstile_challenge.dart';

/// Stitch: Staff Login (Light) v2 — Cloudflare Turnstile (no TOTP).
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

  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    try {
      final api = ApiClient();
      final cfg = await api.get('/api/auth/mobile/config');
      if (mounted) {
        setState(() {
          _turnstileRequired = cfg['turnstileRequired'] == true;
          final key = cfg['turnstileSiteKey']?.toString() ?? '';
          _turnstileConfigured = key.isNotEmpty;
        });
      }
    } catch (_) {
      /* optional — allow login when config unreachable if server has no turnstile */
    }
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_turnstileRequired && _turnstileToken.isEmpty) {
      setState(() => _error = 'Please complete the Cloudflare security check.');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.onLogin(
        _email.text,
        _password.text,
        turnstileToken: _turnstileToken.isEmpty ? null : _turnstileToken,
      );
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', '').replaceFirst('ApiException: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ConnectGlowBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              const SizedBox(height: 16),
              Center(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Image.asset('assets/images/app_icon.png', width: 96, height: 96),
                ),
              )
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .moveY(begin: -4, end: 4, duration: 2400.ms, curve: Curves.easeInOut)
                  .stitchEntrance(delay: 0.ms),
              const SizedBox(height: 20),
              Text(
                'Staff Portal',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium,
              ).stitchEntrance(delay: 80.ms),
              const Text(
                'Enterprise Authentication',
                textAlign: TextAlign.center,
                style: TextStyle(color: ConnectColors.textSecondary),
              ).stitchEntrance(delay: 140.ms),
              const SizedBox(height: 28),
              TextField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.username, AutofillHints.email],
                decoration: const InputDecoration(
                  labelText: 'Work Email',
                  hintText: 'staff@merncrest.lk',
                  prefixIcon: Icon(Icons.mail_outline),
                ),
              ).stitchEntrance(delay: 200.ms),
              const SizedBox(height: 16),
              TextField(
                controller: _password,
                obscureText: _obscure,
                autofillHints: const [AutofillHints.password],
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: Icon(
                        _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                        key: ValueKey(_obscure),
                      ),
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                onSubmitted: (_) => _busy ? null : _submit(),
              ).stitchEntrance(delay: 260.ms),
              const SizedBox(height: 20),
              if (_turnstileRequired && _turnstileConfigured)
                TurnstileChallenge(
                  required: _turnstileRequired,
                  onToken: (t) => setState(() => _turnstileToken = t),
                ).stitchEntrance(delay: 320.ms),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: ConnectColors.error))
                    .animate()
                    .shake(duration: 380.ms)
                    .fadeIn(duration: 200.ms),
              ],
              const SizedBox(height: 24),
              ConnectPressable(
                enabled: !_busy,
                onPressed: _submit,
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: null,
                    style: ElevatedButton.styleFrom(
                      disabledBackgroundColor: ConnectColors.primary,
                      disabledForegroundColor: Colors.white,
                    ),
                    child: _busy
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                            .animate(onPlay: (c) => c.repeat())
                            .rotate(duration: 900.ms)
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Login to Workspace'),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward, size: 18),
                            ],
                          ),
                  ),
                ),
              ).stitchEntrance(delay: 380.ms),
              const SizedBox(height: 28),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.hub_outlined, size: 16, color: ConnectColors.textSecondary),
                  const SizedBox(width: 6),
                  const Text(
                    'Secure Enterprise Access',
                    style: TextStyle(color: ConnectColors.textSecondary, fontSize: 12),
                  ),
                  const SizedBox(width: 6),
                  Icon(Icons.verified_user_outlined, size: 16, color: ConnectColors.success)
                      .animate(onPlay: (c) => c.repeat(reverse: true))
                      .scale(begin: const Offset(1, 1), end: const Offset(1.12, 1.12), duration: 1200.ms),
                ],
              ).stitchEntrance(delay: 440.ms),
              const SizedBox(height: 8),
              Text(
                ApiConfig.baseUrl.contains('localhost') ? 'localhost · dev' : 'system.merncrest.lk',
                textAlign: TextAlign.center,
                style: const TextStyle(color: ConnectColors.textSecondary, fontSize: 11),
              ).stitchEntrance(delay: 480.ms),
            ],
          ),
        ),
      ),
    );
  }
}
