import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/services/security_prefs_service.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:provider/provider.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';

class SignatureScreen extends StatefulWidget {
  const SignatureScreen({super.key});

  @override
  State<SignatureScreen> createState() => _SignatureScreenState();
}

class _SignatureScreenState extends State<SignatureScreen> {
  final _prefs = SecurityPrefsService();
  final List<Offset?> _points = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<AppState>().auth.api.get('/api/staff/profile');
      final serverRaw = data['signatureJson']?.toString();
      if (serverRaw != null && serverRaw.isNotEmpty) {
        await _prefs.setSignatureJson(serverRaw);
      }
    } catch (_) {}
    final raw = await _prefs.getSignatureJson();
    if (raw != null) {
      try {
        final list = jsonDecode(raw) as List<dynamic>;
        for (final p in list) {
          if (p == null) {
            _points.add(null);
          } else {
            final m = p as Map<String, dynamic>;
            _points.add(Offset((m['x'] as num).toDouble(), (m['y'] as num).toDouble()));
          }
        }
      } catch (_) {}
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save() async {
    final encoded = _points.map((p) => p == null ? null : {'x': p.dx, 'y': p.dy}).toList();
    final json = jsonEncode(encoded);
    await _prefs.setSignatureJson(json);
    try {
      await context.read<AppState>().auth.api.patch('/api/staff/profile', {'signatureJson': json});
    } catch (_) {}
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Signature saved')));
      Navigator.pop(context);
    }
  }

  void _clear() => setState(() => _points.clear());

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Signature'),
        actions: [
          IconButton(onPressed: _clear, icon: const Icon(Icons.refresh_rounded, size: 20)),
          IconButton(onPressed: _save, icon: const Icon(Icons.check_rounded, size: 20)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
          : Padding(
              padding: const EdgeInsets.all(ConnectSpacing.lg),
              child: Column(
                children: [
                  Text('Draw your signature below', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
                  const SizedBox(height: ConnectSpacing.sm),
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: palette.surfaceRaised,
                        borderRadius: BorderRadius.circular(ConnectRadius.md),
                        border: Border.all(color: palette.borderSubtle),
                      ),
                      child: GestureDetector(
                        onPanUpdate: (d) => setState(() => _points.add(d.localPosition)),
                        onPanEnd: (_) => setState(() => _points.add(null)),
                        child: CustomPaint(
                          painter: _SignaturePainter(_points, ConnectColors.primaryGlow),
                          size: Size.infinite,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: ConnectSpacing.sm),
                  ConnectPrimaryButton(label: 'Save signature', icon: Icons.save_outlined, onPressed: _save),
                ],
              ),
            ),
    );
  }
}

class _SignaturePainter extends CustomPainter {
  _SignaturePainter(this.points, this.color);
  final List<Offset?> points;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;
    for (var i = 0; i < points.length - 1; i++) {
      if (points[i] != null && points[i + 1] != null) {
        canvas.drawLine(points[i]!, points[i + 1]!, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SignaturePainter oldDelegate) => oldDelegate.points != points;
}
