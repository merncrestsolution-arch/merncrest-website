import 'dart:async';
import 'dart:html' as html;
import 'dart:ui_web' as ui_web;
import 'package:flutter/material.dart';
import 'package:merncrest_connect/config/api_config.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';

/// Cloudflare Turnstile via iframe (Flutter Web).
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
  static int _viewId = 0;
  late final String _factoryId;
  StreamSubscription<html.MessageEvent>? _sub;

  @override
  void initState() {
    super.initState();
    _factoryId = 'turnstile-${_viewId++}';
    final url = '${ApiConfig.baseUrl}/api/auth/mobile/turnstile';

    ui_web.platformViewRegistry.registerViewFactory(_factoryId, (int _) {
      final iframe = html.IFrameElement()
        ..src = url
        ..style.border = 'none'
        ..style.width = '100%'
        ..style.height = '100%'
        ..allow = 'cross-origin-isolated';
      return iframe;
    });

    _sub = html.window.onMessage.listen((event) {
      final data = event.data;
      if (data is Map && data['type'] == 'turnstile') {
        widget.onToken(data['token']?.toString() ?? '');
      }
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
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
              border: Border.all(color: ConnectColors.border),
              color: ConnectColors.surface,
            ),
            child: HtmlElementView(viewType: _factoryId),
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
