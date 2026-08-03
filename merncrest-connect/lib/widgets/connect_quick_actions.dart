import 'package:flutter/material.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';

class QuickActionItem {
  const QuickActionItem({
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;
}

class ConnectQuickActionGrid extends StatelessWidget {
  const ConnectQuickActionGrid({
    super.key,
    required this.actions,
    this.columns = 4,
  });

  final List<QuickActionItem> actions;
  final int columns;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: columns,
        mainAxisSpacing: ConnectSpacing.sm,
        crossAxisSpacing: ConnectSpacing.sm,
        childAspectRatio: 0.92,
      ),
      itemCount: actions.length,
      itemBuilder: (context, i) {
        final action = actions[i];
        return ConnectPressable(
          onPressed: action.onTap,
          child: _QuickActionTile(action: action).stitchEntrance(delay: Duration(milliseconds: 30 * i)),
        );
      },
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  const _QuickActionTile({required this.action});
  final QuickActionItem action;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(vertical: ConnectSpacing.sm, horizontal: ConnectSpacing.xs),
      decoration: BoxDecoration(
        color: palette.surfaceRaised,
        borderRadius: BorderRadius.circular(ConnectRadius.md),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [action.color.withValues(alpha: 0.25), action.color.withValues(alpha: 0.08)],
              ),
              borderRadius: BorderRadius.circular(ConnectRadius.md),
            ),
            child: Icon(action.icon, color: action.color, size: 20),
          ),
          const SizedBox(height: 6),
          Text(
            action.label,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: palette.textPrimary,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

class ConnectHorizontalQuickActions extends StatelessWidget {
  const ConnectHorizontalQuickActions({super.key, required this.actions});

  final List<QuickActionItem> actions;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 88,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: actions.length,
        separatorBuilder: (_, __) => const SizedBox(width: ConnectSpacing.sm),
        itemBuilder: (context, i) {
          final action = actions[i];
          return SizedBox(
            width: 72,
            child: ConnectPressable(
              onPressed: action.onTap,
              child: _QuickActionTile(action: action),
            ),
          );
        },
      ),
    );
  }
}
