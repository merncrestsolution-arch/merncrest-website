import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';

/// Branded page scaffold with optional gradient header.
class ConnectPage extends StatelessWidget {
  const ConnectPage({
    super.key,
    required this.child,
    this.title,
    this.subtitle,
    this.actions,
    this.padding = const EdgeInsets.fromLTRB(20, 0, 20, 100),
    this.onRefresh,
  });

  final Widget child;
  final String? title;
  final String? subtitle;
  final List<Widget>? actions;
  final EdgeInsets padding;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    final body = ListView(
      padding: padding,
      children: [
        if (title != null) ...[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title!, style: Theme.of(context).textTheme.headlineMedium),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(subtitle!, style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ],
                ),
              ),
              if (actions != null) ...actions!,
            ],
          ),
          const SizedBox(height: 20),
        ],
        child,
      ],
    );

    return ConnectAmbientBackground(
      child: onRefresh == null
          ? body
          : RefreshIndicator(
              color: ConnectColors.primary,
              backgroundColor: ConnectPalette.of(context).surfaceRaised,
              onRefresh: onRefresh!,
              child: body,
            ),
    );
  }
}

class ConnectAmbientBackground extends StatelessWidget {
  const ConnectAmbientBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final orbAlpha = palette.ambientOrbAlpha;
    return Stack(
      fit: StackFit.expand,
      children: [
        DecoratedBox(decoration: BoxDecoration(color: palette.background)),
        Positioned(
          top: -100,
          right: -80,
          child: _orb(const Color(0xFF7C3AED), 240, orbAlpha),
        ),
        Positioned(
          bottom: 80,
          left: -100,
          child: _orb(const Color(0xFFBE185D), 200, orbAlpha),
        ),
        child,
      ],
    );
  }

  Widget _orb(Color color, double size, double alpha) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [color.withValues(alpha: alpha), Colors.transparent],
        ),
      ),
    );
  }
}

class ConnectTopBar extends StatelessWidget {
  const ConnectTopBar({
    super.key,
    required this.name,
    this.role,
    this.notificationCount = 0,
    this.onNotifications,
    this.onProfile,
    this.onSettings,
    this.onLogout,
  });

  final String name;
  final String? role;
  final int notificationCount;
  final VoidCallback? onNotifications;
  final VoidCallback? onProfile;
  final VoidCallback? onSettings;
  final VoidCallback? onLogout;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          padding: const EdgeInsets.fromLTRB(14, 4, 6, 4),
          decoration: BoxDecoration(
            color: palette.surfaceRaised.withValues(alpha: 0.85),
            border: Border(bottom: BorderSide(color: palette.borderSubtle)),
          ),
          child: SafeArea(
            bottom: false,
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Image.asset('assets/images/app_icon.png', width: 24, height: 24),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(name, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                      if (role != null)
                        Text(role!, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 10), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                IconButton(
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                  onPressed: onNotifications,
                  icon: Badge(
                    isLabelVisible: notificationCount > 0,
                    label: Text('$notificationCount', style: const TextStyle(fontSize: 9)),
                    child: Icon(Icons.notifications_none_rounded, size: 20, color: palette.textSecondary),
                  ),
                ),
                PopupMenuButton<String>(
                  padding: EdgeInsets.zero,
                  icon: Icon(Icons.more_vert_rounded, size: 20, color: palette.textSecondary),
                  color: palette.surfaceRaised,
                  onSelected: (v) {
                    if (v == 'logout') onLogout?.call();
                    if (v == 'profile') onProfile?.call();
                    if (v == 'settings') onSettings?.call();
                  },
                  itemBuilder: (_) => [
                    PopupMenuItem(value: 'profile', child: Text(name, style: TextStyle(fontSize: 13, color: palette.textPrimary))),
                    PopupMenuItem(value: 'settings', child: Text('Settings', style: TextStyle(fontSize: 13, color: palette.textPrimary))),
                    PopupMenuItem(value: 'logout', child: Text('Sign out', style: TextStyle(fontSize: 13, color: palette.textPrimary))),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class ConnectBottomNav extends StatelessWidget {
  const ConnectBottomNav({
    super.key,
    required this.index,
    required this.onChanged,
  });

  final int index;
  final ValueChanged<int> onChanged;

  static const _items = [
    (Icons.space_dashboard_outlined, Icons.space_dashboard_rounded, 'Home'),
    (Icons.workspaces_outlined, Icons.workspaces_rounded, 'Work'),
    (Icons.forum_outlined, Icons.forum_rounded, 'Chat'),
    (Icons.groups_outlined, Icons.groups_rounded, 'Clients'),
    (Icons.apps_outlined, Icons.apps_rounded, 'More'),
  ];

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          margin: const EdgeInsets.fromLTRB(14, 0, 14, 12),
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
          decoration: BoxDecoration(
            color: palette.surfaceRaised.withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: palette.glassBorder),
            boxShadow: connectSoftShadow(ConnectColors.primary),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(_items.length, (i) {
              final (icon, activeIcon, label) = _items[i];
              final selected = index == i;
              return Expanded(
                child: GestureDetector(
                  onTap: () => onChanged(i),
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: ConnectDurations.normal,
                    curve: Curves.easeOutCubic,
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    decoration: BoxDecoration(
                      color: selected ? ConnectColors.primary.withValues(alpha: palette.isLight ? 0.12 : 0.2) : Colors.transparent,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(selected ? activeIcon : icon, size: 20, color: selected ? palette.accentHighlight : palette.textMuted),
                        const SizedBox(height: 2),
                        Text(
                          label,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                            color: selected ? palette.accentHighlight : palette.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

class ConnectPrimaryButton extends StatelessWidget {
  const ConnectPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: onPressed == null ? null : ConnectColors.brandGradient,
          borderRadius: BorderRadius.circular(14),
          color: onPressed == null ? palette.disabledFill : null,
        ),
        child: ElevatedButton(
          onPressed: loading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            foregroundColor: onPressed == null ? palette.textMuted : Colors.white,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: loading
              ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(label),
                    if (icon != null) ...[const SizedBox(width: 8), Icon(icon, size: 18)],
                  ],
                ),
        ),
      ),
    );
  }
}

class ConnectEmptyState extends StatelessWidget {
  const ConnectEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
  });

  final IconData icon;
  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: palette.surfaceRaised,
                shape: BoxShape.circle,
                border: Border.all(color: palette.borderSubtle),
              ),
              child: Icon(icon, size: 36, color: palette.accentHighlight.withValues(alpha: 0.85)),
            ),
            const SizedBox(height: 16),
            Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
            if (subtitle != null) ...[
              const SizedBox(height: 6),
              Text(subtitle!, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium),
            ],
          ],
        ),
      ),
    );
  }
}

class ConnectAvatar extends StatelessWidget {
  const ConnectAvatar({super.key, required this.label, this.size = 44});

  final String label;
  final double size;

  @override
  Widget build(BuildContext context) {
    final initial = label.isNotEmpty ? label[0].toUpperCase() : '?';
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        gradient: ConnectColors.brandGradient,
        borderRadius: BorderRadius.circular(size * 0.28),
      ),
      child: Text(initial, style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: size * 0.38)),
    );
  }
}

/// Enterprise search field with glass styling.
class ConnectSearchBar extends StatelessWidget {
  const ConnectSearchBar({
    super.key,
    required this.hint,
    this.onChanged,
    this.controller,
  });

  final String hint;
  final ValueChanged<String>? onChanged;
  final TextEditingController? controller;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return TextField(
      controller: controller,
      onChanged: onChanged,
      style: TextStyle(color: palette.textPrimary, fontSize: 13),
      decoration: InputDecoration(
        hintText: hint,
        isDense: true,
        prefixIcon: Icon(Icons.search_rounded, size: 20, color: palette.textMuted),
        filled: true,
        fillColor: palette.surfaceRaised.withValues(alpha: 0.85),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(ConnectRadius.md),
          borderSide: BorderSide(color: palette.borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(ConnectRadius.md),
          borderSide: BorderSide(color: palette.borderSubtle),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
    );
  }
}

/// Gradient FAB with haptic feedback.
class ConnectFab extends StatelessWidget {
  const ConnectFab({
    super.key,
    required this.icon,
    required this.onPressed,
    this.label,
  });

  final IconData icon;
  final VoidCallback onPressed;
  final String? label;

  @override
  Widget build(BuildContext context) {
    if (label != null) {
      return FloatingActionButton.extended(
        onPressed: () {
          HapticFeedback.mediumImpact();
          onPressed();
        },
        elevation: 4,
        backgroundColor: ConnectColors.primary,
        foregroundColor: Colors.white,
        icon: Icon(icon, size: 20),
        label: Text(label!, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
      );
    }
    return FloatingActionButton(
      onPressed: () {
        HapticFeedback.mediumImpact();
        onPressed();
      },
      elevation: 4,
      backgroundColor: ConnectColors.primary,
      foregroundColor: Colors.white,
      child: Icon(icon, size: 22),
    );
  }
}

/// Offline / degraded connectivity banner.
class ConnectOfflineBanner extends StatelessWidget {
  const ConnectOfflineBanner({
    super.key,
    required this.online,
    this.message,
    this.pendingMutations = 0,
  });

  final bool online;
  final String? message;
  final int pendingMutations;

  @override
  Widget build(BuildContext context) {
    if (online && pendingMutations == 0) return const SizedBox.shrink();

    final offline = !online;
    final label = offline
        ? (pendingMutations > 0
            ? 'No connection — $pendingMutations queued action${pendingMutations == 1 ? '' : 's'} will sync when back online'
            : message ?? 'No connection — pull to refresh or check network')
        : '$pendingMutations queued action${pendingMutations == 1 ? '' : 's'} syncing…';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: ConnectSpacing.md, vertical: ConnectSpacing.xs),
      color: ConnectColors.warning.withValues(alpha: 0.15),
      child: Row(
        children: [
          Icon(
            offline ? Icons.wifi_off_rounded : Icons.cloud_sync_outlined,
            size: 14,
            color: ConnectColors.warning,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 11, color: ConnectColors.warning),
            ),
          ),
        ],
      ),
    );
  }
}
