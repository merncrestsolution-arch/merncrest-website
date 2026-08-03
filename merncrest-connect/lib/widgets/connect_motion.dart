import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';

/// Stitch-style motion presets for MernCrest Connect.
extension ConnectMotion on Widget {
  Widget stitchEntrance({Duration delay = Duration.zero, double dy = 18}) {
    return animate(delay: delay)
        .fadeIn(duration: 420.ms, curve: Curves.easeOutCubic)
        .slideY(begin: dy / 100, end: 0, duration: 480.ms, curve: Curves.easeOutCubic);
  }

  Widget stitchTap() {
    return animate(onPlay: (c) => c.repeat(reverse: true))
        .shimmer(duration: 1800.ms, color: Colors.white.withValues(alpha: 0.08))
        .animate(target: 0)
        .scale(
          begin: const Offset(1, 1),
          end: const Offset(0.98, 0.98),
          duration: 80.ms,
        );
  }
}

class ConnectPressable extends StatefulWidget {
  const ConnectPressable({
    super.key,
    required this.child,
    required this.onPressed,
    this.enabled = true,
  });

  final Widget child;
  final VoidCallback? onPressed;
  final bool enabled;

  @override
  State<ConnectPressable> createState() => _ConnectPressableState();
}

class _ConnectPressableState extends State<ConnectPressable> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.enabled ? (_) => setState(() => _pressed = true) : null,
      onTapUp: widget.enabled
          ? (_) {
              setState(() => _pressed = false);
              HapticFeedback.lightImpact();
              widget.onPressed?.call();
            }
          : null,
      onTapCancel: widget.enabled ? () => setState(() => _pressed = false) : null,
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOutCubic,
        child: AnimatedOpacity(
          opacity: widget.enabled ? 1 : 0.55,
          duration: const Duration(milliseconds: 200),
          child: widget.child,
        ),
      ),
    );
  }
}

/// Legacy alias — use [ConnectAmbientBackground].
class ConnectGlowBackground extends StatelessWidget {
  const ConnectGlowBackground({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => ConnectAmbientBackground(child: child);
}
