import 'package:flutter/material.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';

/// Collapsible enterprise section — profile, settings, module groups.
class ConnectExpandableSection extends StatefulWidget {
  const ConnectExpandableSection({
    super.key,
    required this.title,
    required this.children,
    this.icon,
    this.iconColor,
    this.initiallyExpanded = false,
    this.badge,
  });

  final String title;
  final List<Widget> children;
  final IconData? icon;
  final Color? iconColor;
  final bool initiallyExpanded;
  final String? badge;

  @override
  State<ConnectExpandableSection> createState() => _ConnectExpandableSectionState();
}

class _ConnectExpandableSectionState extends State<ConnectExpandableSection> {
  late bool _expanded = widget.initiallyExpanded;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final accent = widget.iconColor ?? ConnectColors.primaryGlow;

    return Padding(
      padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: palette.surfaceRaised,
          borderRadius: BorderRadius.circular(ConnectRadius.lg),
          border: Border.all(color: palette.borderSubtle),
        ),
        child: Column(
          children: [
            ConnectPressable(
              onPressed: () => setState(() => _expanded = !_expanded),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: ConnectSpacing.md, vertical: ConnectSpacing.sm),
                child: Row(
                  children: [
                    if (widget.icon != null) ...[
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: accent.withValues(alpha: 0.14),
                          borderRadius: BorderRadius.circular(ConnectRadius.sm),
                        ),
                        child: Icon(widget.icon, color: accent, size: 18),
                      ),
                      const SizedBox(width: ConnectSpacing.sm),
                    ],
                    Expanded(
                      child: Text(widget.title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                    ),
                    if (widget.badge != null) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: ConnectColors.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(ConnectRadius.pill),
                        ),
                        child: Text(widget.badge!, style: const TextStyle(fontSize: 10, color: ConnectColors.primaryGlow)),
                      ),
                      const SizedBox(width: 8),
                    ],
                    AnimatedRotation(
                      turns: _expanded ? 0.5 : 0,
                      duration: ConnectDurations.normal,
                      child: Icon(Icons.expand_more_rounded, color: palette.textMuted, size: 22),
                    ),
                  ],
                ),
              ),
            ),
            AnimatedCrossFade(
              firstChild: const SizedBox.shrink(),
              secondChild: Padding(
                padding: const EdgeInsets.fromLTRB(ConnectSpacing.md, 0, ConnectSpacing.md, ConnectSpacing.sm),
                child: Column(children: widget.children),
              ),
              crossFadeState: _expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
              duration: ConnectDurations.normal,
            ),
          ],
        ),
      ),
    );
  }
}

class ConnectInfoField extends StatelessWidget {
  const ConnectInfoField({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.onTap,
  });

  final String label;
  final String value;
  final IconData? icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(ConnectRadius.sm),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: palette.textMuted),
              const SizedBox(width: 8),
            ],
            SizedBox(
              width: 110,
              child: Text(label, style: TextStyle(color: palette.textMuted, fontSize: 12)),
            ),
            Expanded(
              child: Text(
                value.isEmpty ? '—' : value,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 13),
              ),
            ),
            if (onTap != null) Icon(Icons.chevron_right_rounded, size: 16, color: palette.textMuted),
          ],
        ),
      ),
    );
  }
}
