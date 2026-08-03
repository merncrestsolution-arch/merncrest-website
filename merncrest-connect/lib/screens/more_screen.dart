import 'package:flutter/material.dart';
import 'package:merncrest_connect/navigation/module_router.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/screens/ai_assistant_screen.dart';
import 'package:merncrest_connect/screens/data_screens.dart';
import 'package:merncrest_connect/screens/profile_screen.dart';
import 'package:merncrest_connect/screens/settings_screen.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  static const _defaultGroups = [
    (
      'Account',
      [
        ('Profile', '/profile', Icons.person_outline_rounded),
        ('Attendance', '/attendance', Icons.schedule_rounded),
        ('Leave', '/leave', Icons.flight_takeoff_rounded),
        ('Payroll', '/payroll', Icons.payments_rounded),
        ('Performance', '/performance', Icons.insights_rounded),
      ],
    ),
    (
      'Work',
      [
        ('Calendar', '/calendar', Icons.calendar_month_rounded),
        ('Projects', '/projects', Icons.folder_special_rounded),
        ('Tasks', '/tasks', Icons.task_alt_rounded),
        ('CRM', '/clients', Icons.groups_rounded),
        ('Helpdesk', '/tickets', Icons.headset_mic_rounded),
      ],
    ),
    (
      'Enterprise',
      [
        ('ERP', '/erp', Icons.hub_rounded),
        ('Finance', '/billing', Icons.account_balance_wallet_rounded),
        ('Inventory', '/inventory', Icons.inventory_2_rounded),
        ('Documents', '/documents', Icons.description_rounded),
        ('Reports', '/reports', Icons.analytics_rounded),
      ],
    ),
    (
      'Platform',
      [
        ('AI Assistant', '/ai', Icons.auto_awesome_rounded),
        ('Integrations', '/integrations', Icons.extension_rounded),
        ('Security', '/security', Icons.shield_outlined),
        ('Settings', '/settings', Icons.settings_rounded),
        ('Help', '/help', Icons.help_outline_rounded),
      ],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final nav = context.watch<AppState>().navigation;
    final serverGroups = (nav?['groups'] as List<dynamic>?) ?? [];

    return ConnectPage(
      title: 'More',
      subtitle: 'All modules & enterprise tools',
      child: Column(
        children: [
          if (serverGroups.isNotEmpty)
            ..._buildServerGroups(context, serverGroups)
          else
            ..._buildDefaultGroups(context),
          const SizedBox(height: ConnectSpacing.md),
          ConnectCard(
            onTap: () => context.read<AppState>().logout(),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: ConnectColors.error.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(ConnectRadius.md),
                  ),
                  child: const Icon(Icons.logout_rounded, color: ConnectColors.error, size: 20),
                ),
                const SizedBox(width: ConnectSpacing.sm),
                Text('Sign out', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: ConnectColors.error)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildServerGroups(BuildContext context, List<dynamic> groups) {
    return [
      for (final g in groups) ...[
        ConnectSectionHeader(title: g['label']?.toString() ?? 'Modules'),
        for (final item in (g['items'] as List<dynamic>? ?? []))
          _ModuleTile(
            title: item['label']?.toString() ?? '',
            route: item['route']?.toString() ?? '',
            icon: ModuleRouter.iconForRoute(item['route']?.toString() ?? ''),
            color: ModuleRouter.colorForRoute(item['route']?.toString() ?? ''),
            onTap: () => _handleRoute(context, item['route']?.toString() ?? '', item['label']?.toString()),
          ),
      ],
    ];
  }

  List<Widget> _buildDefaultGroups(BuildContext context) {
    return [
      for (final (label, items) in _defaultGroups) ...[
        ConnectSectionHeader(title: label),
        ConnectCard(
          padding: const EdgeInsets.symmetric(vertical: ConnectSpacing.xs),
          child: Column(
            children: [
              for (var i = 0; i < items.length; i++) ...[
                _CompactModuleTile(
                  title: items[i].$1,
                  route: items[i].$2,
                  icon: items[i].$3,
                  color: ModuleRouter.colorForRoute(items[i].$2),
                  onTap: () => _handleRoute(context, items[i].$2, items[i].$1),
                ),
                if (i < items.length - 1) Divider(height: 1, color: ConnectPalette.of(context).borderSubtle),
              ],
            ],
          ),
        ),
      ],
    ];
  }

  void _handleRoute(BuildContext context, String route, String? label) {
    if (route == '/profile') {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProfileScreen()));
      return;
    }
    if (route == '/settings') {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen()));
      return;
    }
    if (route == '/ai') {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AiAssistantScreen()));
      return;
    }
    if (route == '/attendance') {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AttendanceScreen()));
      return;
    }
    if (route == '/leave') {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LeaveScreen()));
      return;
    }
    if (route == '/tasks') {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TasksScreen()));
      return;
    }
    ModuleRouter.open(context, route, label: label);
  }
}

class _ModuleTile extends StatelessWidget {
  const _ModuleTile({
    required this.title,
    required this.route,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String title;
  final String route;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ConnectModuleRow(
      title: title,
      subtitle: route,
      icon: icon,
      iconColor: color,
      onTap: onTap,
    );
  }
}

class _CompactModuleTile extends StatelessWidget {
  const _CompactModuleTile({
    required this.title,
    required this.route,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String title;
  final String route;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: ConnectSpacing.sm),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(ConnectRadius.sm),
        ),
        child: Icon(icon, color: color, size: 18),
      ),
      title: Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
      trailing: const Icon(Icons.chevron_right_rounded, size: 18, color: ConnectColors.textMuted),
      onTap: onTap,
    );
  }
}
