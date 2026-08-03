import 'package:flutter/material.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';

/// Shimmer skeleton placeholder for loading states.
class ConnectSkeleton extends StatefulWidget {
  const ConnectSkeleton({
    super.key,
    this.width,
    this.height = 16,
    this.borderRadius = ConnectRadius.sm,
  });

  final double? width;
  final double height;
  final double borderRadius;

  @override
  State<ConnectSkeleton> createState() => _ConnectSkeletonState();
}

class _ConnectSkeletonState extends State<ConnectSkeleton> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment(-1 + 2 * _controller.value, 0),
              end: Alignment(1 + 2 * _controller.value, 0),
              colors: [
                palette.surfaceRaised,
                palette.surfaceOverlay,
                palette.surfaceRaised,
              ],
            ),
          ),
        );
      },
    );
  }
}

class ConnectDashboardSkeleton extends StatelessWidget {
  const ConnectDashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const ConnectSkeleton(height: 140, borderRadius: ConnectRadius.lg),
        const SizedBox(height: ConnectSpacing.md),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: ConnectSpacing.sm,
          crossAxisSpacing: ConnectSpacing.sm,
          childAspectRatio: 1.5,
          children: List.generate(6, (_) => const ConnectSkeleton(height: 80, borderRadius: ConnectRadius.lg)),
        ),
      ],
    );
  }
}
