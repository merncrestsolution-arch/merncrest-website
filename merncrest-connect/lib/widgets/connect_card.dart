import 'package:flutter/material.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';

class ConnectCard extends StatelessWidget {
  const ConnectCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    this.gradient,
    this.featured = false,
  });

  final Widget child;
  final EdgeInsets padding;
  final VoidCallback? onTap;
  final Gradient? gradient;
  final bool featured;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final decoration = BoxDecoration(
      color: gradient == null && !featured ? palette.surfaceRaised : null,
      gradient: gradient ?? (featured ? palette.featuredCardGradient : null),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(
        color: featured ? ConnectColors.primary.withValues(alpha: palette.isLight ? 0.35 : 0.45) : palette.borderSubtle,
      ),
      boxShadow: featured || palette.isLight
          ? [
              BoxShadow(
                color: featured
                    ? ConnectColors.primary.withValues(alpha: palette.isLight ? 0.08 : 0.12)
                    : Colors.black.withValues(alpha: palette.isLight ? 0.04 : 0),
                blurRadius: featured ? 20 : 12,
                offset: Offset(0, featured ? 8 : 2),
              ),
            ]
          : null,
    );

    final card = Container(decoration: decoration, padding: padding, child: child);

    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(onTap: onTap, borderRadius: BorderRadius.circular(20), child: card),
    );
  }
}

class ConnectStatTile extends StatelessWidget {
  const ConnectStatTile({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.color,
    this.trend,
    this.compact = false,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color? color;
  final String? trend;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final accent = color ?? palette.accentHighlight;
    return ConnectCard(
      padding: EdgeInsets.all(compact ? 10 : 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                padding: EdgeInsets.all(compact ? 5 : 7),
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(compact ? 8 : 10),
                ),
                child: Icon(icon, color: accent, size: compact ? 14 : 18),
              ),
              const Spacer(),
              if (trend != null)
                Text(trend!, style: Theme.of(context).textTheme.labelSmall?.copyWith(color: ConnectColors.success, fontSize: 9)),
            ],
          ),
          SizedBox(height: compact ? 6 : 10),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: compact ? 16 : 20, height: 1.1),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: compact ? 10 : 12),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class ConnectSectionHeader extends StatelessWidget {
  const ConnectSectionHeader({super.key, required this.title, this.action, this.padding});

  final String title;
  final Widget? action;
  final EdgeInsets? padding;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ?? const EdgeInsets.fromLTRB(0, 20, 0, 10),
      child: Row(
        children: [
          Expanded(child: Text(title, style: Theme.of(context).textTheme.titleLarge)),
          ?action,
        ],
      ),
    );
  }
}

class ConnectChip extends StatelessWidget {
  const ConnectChip({super.key, required this.label, this.color = ConnectColors.primary});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color.withValues(alpha: 0.95)),
      ),
    );
  }
}

class ConnectModuleRow extends StatelessWidget {
  const ConnectModuleRow({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.onTap,
    this.trailing,
    this.iconColor,
    this.compact = false,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback? onTap;
  final Widget? trailing;
  final Color? iconColor;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final accent = iconColor ?? palette.accentHighlight;
    return Padding(
      padding: EdgeInsets.only(bottom: compact ? 6 : 10),
      child: ConnectCard(
        onTap: onTap,
        padding: EdgeInsets.all(compact ? 10 : 16),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(compact ? 8 : 12),
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(compact ? 10 : 14),
              ),
              child: Icon(icon, color: accent, size: compact ? 18 : 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 2),
                  Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
            ),
            trailing ?? Icon(Icons.arrow_forward_ios_rounded, size: 16, color: palette.textMuted),
          ],
        ),
      ),
    );
  }
}
