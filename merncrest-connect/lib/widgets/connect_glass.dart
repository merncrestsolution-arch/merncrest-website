import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';

/// Glassmorphism surface with blur and soft border.
class ConnectGlassCard extends StatelessWidget {
  const ConnectGlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(ConnectSpacing.md),
    this.onTap,
    this.gradient,
    this.borderRadius = ConnectRadius.lg,
    this.featured = false,
  });

  final Widget child;
  final EdgeInsets padding;
  final VoidCallback? onTap;
  final Gradient? gradient;
  final double borderRadius;
  final bool featured;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final decoration = BoxDecoration(
      borderRadius: BorderRadius.circular(borderRadius),
      gradient: gradient ??
          (featured
              ? palette.featuredCardGradient
              : LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [palette.glassFill, palette.glassFill.withValues(alpha: palette.isLight ? 0.85 : 0.5)],
                )),
      border: Border.all(
        color: featured ? ConnectColors.primary.withValues(alpha: palette.isLight ? 0.35 : 0.45) : palette.glassBorder,
      ),
      boxShadow: featured
          ? connectSoftShadow(ConnectColors.primary, blur: palette.isLight ? 14 : 20)
          : (palette.isLight ? connectGlassShadow(palette.textMuted) : connectGlassShadow(palette.textMuted)),
    );

    final content = ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(decoration: decoration, padding: padding, child: child),
      ),
    );

    if (onTap == null) return content;
    return Material(
      color: Colors.transparent,
      child: InkWell(onTap: onTap, borderRadius: BorderRadius.circular(borderRadius), child: content),
    );
  }
}

/// Compact status pill for sync, server, API indicators.
class ConnectStatusPill extends StatelessWidget {
  const ConnectStatusPill({
    super.key,
    required this.label,
    required this.status,
    this.compact = false,
  });

  final String label;
  final ConnectStatusLevel status;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      ConnectStatusLevel.online => ConnectColors.success,
      ConnectStatusLevel.degraded => ConnectColors.warning,
      ConnectStatusLevel.offline => ConnectColors.error,
      ConnectStatusLevel.unknown => ConnectColors.textMuted,
    };

    return Container(
      padding: EdgeInsets.symmetric(horizontal: compact ? 6 : 8, vertical: compact ? 3 : 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(ConnectRadius.pill),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: compact ? 5 : 6,
            height: compact ? 5 : 6,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          SizedBox(width: compact ? 4 : 6),
          Text(
            label,
            style: TextStyle(
              fontSize: compact ? 9 : 10,
              fontWeight: FontWeight.w600,
              color: color,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}

enum ConnectStatusLevel { online, degraded, offline, unknown }

class ConnectStatusRow extends StatelessWidget {
  const ConnectStatusRow({super.key, required this.items});

  final List<(String, ConnectStatusLevel)> items;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        for (final (label, status) in items)
          ConnectStatusPill(label: label, status: status, compact: true),
      ],
    );
  }
}
