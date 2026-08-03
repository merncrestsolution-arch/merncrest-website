import 'package:flutter/material.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';

class KpiItem {
  const KpiItem(this.label, this.value, this.icon, this.color, {this.trend});
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final String? trend;
}

/// Grouped KPI sections for the executive dashboard.
class ConnectKpiSection extends StatelessWidget {
  const ConnectKpiSection({
    super.key,
    required this.title,
    required this.items,
    this.icon,
  });

  final String title;
  final List<KpiItem> items;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
          child: Row(
            children: [
              if (icon != null) ...[
                Icon(icon, size: 14, color: ConnectColors.primaryGlow),
                const SizedBox(width: 6),
              ],
              Text(title, style: Theme.of(context).textTheme.labelSmall?.copyWith(fontSize: 11)),
            ],
          ),
        ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: ConnectSpacing.xs,
            crossAxisSpacing: ConnectSpacing.xs,
            childAspectRatio: 1.72,
          ),
          itemCount: items.length,
          itemBuilder: (context, i) {
            final item = items[i];
            return ConnectStatTile(
              label: item.label,
              value: item.value,
              icon: item.icon,
              color: item.color,
              trend: item.trend,
              compact: true,
            ).stitchEntrance(delay: Duration(milliseconds: 20 * i));
          },
        ),
        const SizedBox(height: ConnectSpacing.sm),
      ],
    );
  }
}

/// Builds KPI groups from command-center ops + staff dashboard payload (real API data only).
class DashboardKpiBuilder {
  DashboardKpiBuilder({
    required this.ops,
    required this.data,
    required this.sync,
  });

  final Map<String, dynamic> ops;
  final Map<String, dynamic>? data;
  final dynamic sync;

  num _n(String key) {
    final raw = ops[key] ?? data?['ops']?[key];
    if (raw is num) return raw;
    return num.tryParse(raw?.toString() ?? '') ?? 0;
  }

  String? _s(String key) {
    final v = ops[key]?.toString();
    return (v != null && v.isNotEmpty) ? v : null;
  }

  List<ConnectKpiSection> buildSections() {
    return [
      ConnectKpiSection(
        title: 'ATTENDANCE',
        icon: Icons.schedule_rounded,
        items: [
          KpiItem('Present Staff', '${_n('staffAttendanceToday')}', Icons.people_alt_rounded, ConnectModuleColors.attendance),
          if (_n('absentStaff') > 0) KpiItem('Absent Staff', '${_n('absentStaff')}', Icons.person_off_outlined, ConnectColors.error),
          if (_n('lateStaff') > 0) KpiItem('Late Staff', '${_n('lateStaff')}', Icons.access_time_filled_rounded, ConnectColors.warning),
          if (_n('todayMeetings') > 0) KpiItem('Today Meetings', '${_n('todayMeetings')}', Icons.event_rounded, ConnectModuleColors.calendar),
        ],
      ),
      ConnectKpiSection(
        title: 'FINANCE',
        icon: Icons.account_balance_wallet_rounded,
        items: [
          if (_n('todayRevenueCents') > 0) KpiItem('Today Revenue', formatCurrencyCents(_n('todayRevenueCents')), Icons.payments_rounded, ConnectModuleColors.finance),
          if (_n('monthRevenueCents') > 0) KpiItem('Month Revenue', formatCurrencyCents(_n('monthRevenueCents')), Icons.trending_up_rounded, ConnectModuleColors.finance),
          if (_n('outstandingInvoices') > 0) KpiItem('Outstanding', '${_n('outstandingInvoices')}', Icons.receipt_long_rounded, ConnectColors.warning),
          if (_n('todaySales') > 0) KpiItem('Today Sales', '${_n('todaySales')}', Icons.point_of_sale_rounded, ConnectModuleColors.crm),
        ],
      ),
      ConnectKpiSection(
        title: 'WORK',
        icon: Icons.workspaces_rounded,
        items: [
          if (_n('activeProjects') > 0) KpiItem('Running Projects', '${_n('activeProjects')}', Icons.folder_special_rounded, ConnectModuleColors.projects),
          if (_n('completedProjects') > 0) KpiItem('Completed', '${_n('completedProjects')}', Icons.check_circle_outline_rounded, ConnectColors.success),
          KpiItem('My Tasks', '${data?['pendingTaskCount'] ?? _n('dailyTasks')}', Icons.pending_actions_rounded, ConnectModuleColors.projects),
          if (_n('completedTasks') > 0) KpiItem('Completed Tasks', '${_n('completedTasks')}', Icons.task_alt_rounded, ConnectColors.success),
        ],
      ),
      ConnectKpiSection(
        title: 'SUPPORT & CRM',
        icon: Icons.headset_mic_rounded,
        items: [
          KpiItem('Open Tickets', '${_n('openTickets')}', Icons.confirmation_number_outlined, ConnectModuleColors.helpdesk),
          if (_n('resolvedTickets') > 0) KpiItem('Resolved', '${_n('resolvedTickets')}', Icons.done_all_rounded, ConnectColors.success),
          KpiItem('New Leads', '${_n('newLeads')}', Icons.leaderboard_rounded, ConnectModuleColors.crm),
          if (_n('customerCount') > 0) KpiItem('Customers', '${_n('customerCount')}', Icons.groups_rounded, ConnectModuleColors.crm),
          KpiItem('Live Chats', '${_n('liveChats')}', Icons.forum_outlined, ConnectModuleColors.chat),
          if ((sync?.unreadNotifications ?? 0) > 0)
            KpiItem('Notifications', '${sync?.unreadNotifications ?? 0}', Icons.notifications_active_outlined, ConnectColors.accent),
        ],
      ),
      if (_s('cloudStatus') != null)
        ConnectKpiSection(
          title: 'SYSTEM',
          icon: Icons.dns_rounded,
          items: [
            KpiItem('Cloud', _s('cloudStatus')!, Icons.cloud_done_rounded, ConnectColors.success),
            if (_s('systemVersion') != null) KpiItem('Version', _s('systemVersion')!, Icons.info_outline_rounded, ConnectModuleColors.settings),
          ],
        ),
    ];
  }
}
