import 'package:flutter/material.dart';
import 'package:merncrest_connect/config/api_config.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// Cloudflare Turnstile via embedded WebView (Android / iOS / desktop).
class TurnstileChallenge extends StatefulWidget {
  const TurnstileChallenge({
    super.key,
    required this.onToken,
    this.required = false,
  });

  final ValueChanged<String> onToken;
  final bool required;

  @override
  State<TurnstileChallenge> createState() => _TurnstileChallengeState();
}

class _TurnstileChallengeState extends State<TurnstileChallenge> {
  late final WebViewController _controller;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    final url = '${ApiConfig.baseUrl}/api/auth/mobile/turnstile';
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'TurnstileChannel',
        onMessageReceived: (msg) => widget.onToken(msg.message),
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) => setState(() => _ready = true),
        ),
      )
      ..loadRequest(Uri.parse(url));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Icon(Icons.shield_outlined, size: 18, color: ConnectColors.primary.withValues(alpha: 0.9)),
            const SizedBox(width: 8),
            const Text(
              'Cloudflare Security Check',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Container(
            height: 88,
            decoration: BoxDecoration(
              border: Border.all(color: ConnectColors.borderSubtle),
              color: ConnectColors.surfaceRaised,
            ),
            child: Stack(
              children: [
                WebViewWidget(controller: _controller),
                if (!_ready)
                  const Center(
                    child: SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
              ],
            ),
          ),
        ),
        if (widget.required)
          const Padding(
            padding: EdgeInsets.only(top: 6),
            child: Text(
              'Complete the check before signing in.',
              style: TextStyle(fontSize: 11, color: ConnectColors.textSecondary),
            ),
          ),
      ],
    );
  }
}
