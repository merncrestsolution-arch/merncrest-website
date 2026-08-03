import 'package:flutter/material.dart';
import 'package:merncrest_connect/navigation/module_router.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/screens/ai_assistant_screen.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_charts.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_quick_actions.dart';
import 'package:merncrest_connect/widgets/connect_skeleton.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _data;
  Map<String, dynamic>? _command;
  List<dynamic> _announcements = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final api = context.read<AppState>().auth.api;
    try {
      final results = await Future.wait([
        api.get('/api/staff'),
        api.get('/api/staff/command-center'),
        api.get('/api/staff/announcements').catchError((_) => <String, dynamic>{}),
      ]);
      if (mounted) {
        final announcementsRaw = results[2];
        final announcements = (announcementsRaw['data'] as List<dynamic>?) ??
            (announcementsRaw['announcements'] as List<dynamic>?) ??
            [];
        setState(() {
          _data = results[0];
          _command = results[1];
          _announcements = announcements;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final sync = state.sync;
    final now = DateTime.now();
    final ops = _command?['kpis'] as Map<String, dynamic>? ?? {};
    final activities = (_command?['recentActivities'] as List<dynamic>?) ?? [];
    final employee = state.user?['employee'] as Map<String, dynamic>?;

    return ConnectPage(
      onRefresh: _load,
      padding: const EdgeInsets.fromLTRB(ConnectSpacing.lg, 0, ConnectSpacing.lg, 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_loading)
            const ConnectDashboardSkeleton()
          else if (_error != null)
            ConnectEmptyState(icon: Icons.cloud_off_outlined, title: 'Could not load dashboard', subtitle: _error)
          else ...[
            _WelcomeHero(
              name: state.displayName,
              role: employee?['jobTitle']?.toString() ?? 'MernCrest Staff',
              branch: employee?['branch']?['name']?.toString() ?? 'MernCrest HQ',
              now: now,
              syncOnline: sync?.connected == true,
              serverStatus: ops['serverStatus']?.toString() ?? 'online',
            ).stitchEntrance(),
            const SizedBox(height: ConnectSpacing.md),
            ConnectStatusRow(items: [
              ('Sync', sync?.connected == true ? ConnectStatusLevel.online : ConnectStatusLevel.degraded),
              ('API', ConnectStatusLevel.online),
              ('Server', _serverLevel(ops['serverStatus']?.toString())),
              ('Cloud', ConnectStatusLevel.online),
            ]),
            const SizedBox(height: ConnectSpacing.md),
            _KpiGrid(ops: ops, data: _data, sync: sync),
            const ConnectSectionHeader(title: 'Performance', padding: EdgeInsets.fromLTRB(0, ConnectSpacing.md, 0, ConnectSpacing.sm)),
            _PerformanceCharts(ops: ops),
            const ConnectSectionHeader(title: 'Quick Actions'),
            ConnectQuickActionGrid(actions: _buildQuickActions(context, state)),
            const ConnectSectionHeader(title: 'Recent Activity'),
            if (activities.isEmpty)
              ..._fallbackActivity(_data)
            else
              ...activities.take(6).map((a) {
                final item = a as Map<String, dynamic>;
                return _ActivityTile(
                  title: item['summary']?.toString() ?? item['action']?.toString() ?? 'Activity',
                  subtitle: '${item['module'] ?? ''} · ${item['actorName'] ?? 'System'}',
                  time: item['createdAt']?.toString(),
                ).stitchEntrance();
              }),
            const ConnectSectionHeader(title: 'Announcements'),
            if (_announcements.isEmpty && ((_data?['notifications'] as List?)?.isEmpty ?? true))
              const ConnectEmptyState(icon: Icons.campaign_outlined, title: 'No announcements yet', subtitle: 'Company updates will appear here.')
            else ...[
              ..._announcements.take(4).map((n) => _AnnouncementTile(title: (n as Map)['title']?.toString() ?? '', body: n['body']?.toString() ?? '')),
              ...((_data?['notifications'] as List<dynamic>?) ?? []).take(4).map((n) {
                final item = n as Map<String, dynamic>;
                return _AnnouncementTile(title: item['title']?.toString() ?? '', body: item['body']?.toString() ?? '');
              }),
            ],
          ],
        ],
      ),
    );
  }

  ConnectStatusLevel _serverLevel(String? status) {
    if (status == 'online') return ConnectStatusLevel.online;
    if (status == 'degraded') return ConnectStatusLevel.degraded;
    return ConnectStatusLevel.unknown;
  }

  List<QuickActionItem> _buildQuickActions(BuildContext context, AppState state) {
    return [
      QuickActionItem(icon: Icons.login_rounded, label: 'Clock In', color: ConnectModuleColors.attendance, onTap: () => ModuleRouter.open(context, '/attendance')),
      QuickActionItem(icon: Icons.logout_rounded, label: 'Clock Out', color: ConnectModuleColors.attendance, onTap: () => ModuleRouter.open(context, '/attendance')),
      QuickActionItem(icon: Icons.flight_takeoff_rounded, label: 'Leave', color: ConnectModuleColors.hr, onTap: () => ModuleRouter.open(context, '/leave')),
      QuickActionItem(icon: Icons.add_task_rounded, label: 'Create Task', color: ConnectModuleColors.projects, onTap: () => ModuleRouter.open(context, '/tasks')),
      QuickActionItem(icon: Icons.confirmation_number_outlined, label: 'Ticket', color: ConnectModuleColors.helpdesk, onTap: () => ModuleRouter.open(context, '/tickets')),
      QuickActionItem(icon: Icons.groups_rounded, label: 'CRM', color: ConnectModuleColors.crm, onTap: () => state.goToShellTab(3)),
      QuickActionItem(icon: Icons.receipt_long_rounded, label: 'Invoices', color: ConnectModuleColors.finance, onTap: () => ModuleRouter.open(context, '/billing')),
      QuickActionItem(icon: Icons.folder_special_rounded, label: 'Projects', color: ConnectModuleColors.projects, onTap: () => ModuleRouter.open(context, '/projects')),
      QuickActionItem(icon: Icons.trending_up_rounded, label: 'Sales', color: ConnectModuleColors.crm, onTap: () => state.goToShellTab(3)),
      QuickActionItem(icon: Icons.calendar_month_rounded, label: 'Calendar', color: ConnectModuleColors.calendar, onTap: () => ModuleRouter.open(context, '/calendar')),
      QuickActionItem(icon: Icons.forum_rounded, label: 'Chat', color: ConnectModuleColors.chat, onTap: () => state.goToShellTab(2)),
      QuickActionItem(icon: Icons.qr_code_scanner_rounded, label: 'Scan QR', color: ConnectModuleColors.security, onTap: () => ModuleRouter.open(context, '/attendance')),
      QuickActionItem(icon: Icons.auto_awesome_rounded, label: 'AIRA', color: ConnectModuleColors.ai, onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AiAssistantScreen()))),
      QuickActionItem(icon: Icons.payments_rounded, label: 'Payments', color: ConnectModuleColors.finance, onTap: () => ModuleRouter.open(context, '/billing')),
      QuickActionItem(icon: Icons.approval_rounded, label: 'Approvals', color: ConnectModuleColors.erp, onTap: () => ModuleRouter.open(context, '/tasks')),
      QuickActionItem(icon: Icons.campaign_rounded, label: 'News', color: ConnectModuleColors.hr, onTap: () => ModuleRouter.open(context, '/announcements')),
      QuickActionItem(icon: Icons.description_rounded, label: 'Documents', color: ConnectModuleColors.docs, onTap: () => ModuleRouter.open(context, '/documents')),
      QuickActionItem(icon: Icons.emergency_rounded, label: 'Emergency', color: ConnectColors.error, onTap: () {}),
      QuickActionItem(icon: Icons.settings_rounded, label: 'Settings', color: ConnectModuleColors.settings, onTap: () => ModuleRouter.open(context, '/settings')),
    ];
  }

  List<Widget> _fallbackActivity(Map<String, dynamic>? data) {
    final notifications = (data?['notifications'] as List<dynamic>?) ?? [];
    if (notifications.isEmpty) {
      return [ConnectCard(padding: const EdgeInsets.all(ConnectSpacing.md), child: Text('No recent activity yet.', style: Theme.of(context).textTheme.bodyMedium))];
    }
    return notifications.take(4).map((n) {
      final item = n as Map<String, dynamic>;
      return _ActivityTile(title: item['title']?.toString() ?? 'Update', subtitle: item['body']?.toString() ?? '', time: item['createdAt']?.toString());
    }).toList();
  }
}

class _WelcomeHero extends StatelessWidget {
  const _WelcomeHero({
    required this.name,
    required this.role,
    required this.branch,
    required this.now,
    required this.syncOnline,
    required this.serverStatus,
  });

  final String name;
  final String role;
  final String branch;
  final DateTime now;
  final bool syncOnline;
  final String serverStatus;

  @override
  Widget build(BuildContext context) {
    return ConnectGlassCard(
      featured: true,
      padding: const EdgeInsets.all(ConnectSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(borderRadius: BorderRadius.circular(ConnectRadius.md), child: Image.asset('assets/images/app_icon.png', width: 36, height: 36)),
              const SizedBox(width: ConnectSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${greetingForHour(now.hour)}, $name', style: Theme.of(context).textTheme.titleLarge),
                    Text(role, style: const TextStyle(color: ConnectColors.primaryGlow, fontSize: 12)),
                    Text(branch, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                  ],
                ),
              ),
              ConnectAvatar(label: name, size: 48),
            ],
          ),
          const SizedBox(height: ConnectSpacing.sm),
          Row(
            children: [
              Icon(Icons.access_time_rounded, size: 14, color: ConnectPalette.of(context).textMuted),
              const SizedBox(width: 4),
              Text(formatTime(now), style: Theme.of(context).textTheme.labelSmall),
              const SizedBox(width: ConnectSpacing.md),
              Icon(Icons.calendar_today_rounded, size: 14, color: ConnectPalette.of(context).textMuted),
              const SizedBox(width: 4),
              Text(formatDate(now), style: Theme.of(context).textTheme.labelSmall),
              const Spacer(),
              const Icon(Icons.wb_sunny_outlined, size: 14, color: ConnectColors.warning),
              const SizedBox(width: 4),
              Text('28°C', style: Theme.of(context).textTheme.labelSmall),
            ],
          ),
          const SizedBox(height: ConnectSpacing.sm),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              ConnectStatusPill(label: syncOnline ? 'LIVE SYNC' : 'SYNCING', status: syncOnline ? ConnectStatusLevel.online : ConnectStatusLevel.degraded, compact: true),
              const ConnectStatusPill(label: 'INTERNET', status: ConnectStatusLevel.online, compact: true),
              ConnectStatusPill(
                label: serverStatus.toUpperCase(),
                status: serverStatus == 'online' ? ConnectStatusLevel.online : ConnectStatusLevel.degraded,
                compact: true,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _KpiGrid extends StatelessWidget {
  const _KpiGrid({required this.ops, required this.data, required this.sync});
  final Map<String, dynamic> ops;
  final Map<String, dynamic>? data;
  final dynamic sync;

  @override
  Widget build(BuildContext context) {
    final kpis = [
      ('Present', '${ops['staffAttendanceToday'] ?? 0}', Icons.people_alt_rounded, ConnectModuleColors.attendance),
      ('Open Tickets', '${ops['openTickets'] ?? data?['ops']?['openTickets'] ?? 0}', Icons.headset_mic_outlined, ConnectModuleColors.helpdesk),
      ('Live Chats', '${ops['liveChats'] ?? sync?.liveChats ?? 0}', Icons.forum_outlined, ConnectModuleColors.chat),
      ('New Leads', '${ops['newLeads'] ?? 0}', Icons.trending_up_rounded, ConnectModuleColors.crm),
      ('Today Revenue', formatCurrencyCents(ops['todayRevenueCents'] ?? 0), Icons.payments_rounded, ConnectModuleColors.finance),
      ('Month Revenue', formatCurrencyCents(ops['monthRevenueCents'] ?? 0), Icons.account_balance_wallet_rounded, ConnectModuleColors.finance),
      ('Projects', '${ops['activeProjects'] ?? 0}', Icons.folder_special_rounded, ConnectModuleColors.projects),
      ('My Tasks', '${data?['pendingTaskCount'] ?? sync?.openTasks ?? 0}', Icons.task_alt_rounded, ConnectModuleColors.projects),
      ('Pending Pay', '${ops['pendingPayments'] ?? 0}', Icons.receipt_long_rounded, ConnectColors.warning),
      ('New Clients', '${ops['newClients'] ?? 0}', Icons.person_add_rounded, ConnectModuleColors.crm),
      ('Daily Tasks', '${ops['dailyTasks'] ?? 0}', Icons.checklist_rounded, ConnectModuleColors.erp),
      ('Notifications', '${sync?.unreadNotifications ?? 0}', Icons.notifications_active_outlined, ConnectColors.accent),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: ConnectSpacing.sm,
        crossAxisSpacing: ConnectSpacing.sm,
        childAspectRatio: 1.55,
      ),
      itemCount: kpis.length,
      itemBuilder: (context, i) {
        final (label, value, icon, color) = kpis[i];
        return ConnectStatTile(label: label, value: value, icon: icon, color: color, compact: true)
            .stitchEntrance(delay: Duration(milliseconds: 25 * i));
      },
    );
  }
}

class _PerformanceCharts extends StatelessWidget {
  const _PerformanceCharts({required this.ops});
  final Map<String, dynamic> ops;

  @override
  Widget build(BuildContext context) {
    final revenue = [
      (ops['todayRevenueCents'] as num? ?? 0).toDouble() / 100,
      (ops['monthRevenueCents'] as num? ?? 0).toDouble() / 100 * 0.3,
      (ops['monthRevenueCents'] as num? ?? 0).toDouble() / 100 * 0.5,
      (ops['monthRevenueCents'] as num? ?? 0).toDouble() / 100 * 0.7,
      (ops['monthRevenueCents'] as num? ?? 0).toDouble() / 100,
    ];
    final leads = [
      (ops['newLeads'] as num? ?? 2).toDouble(),
      (ops['newClients'] as num? ?? 1).toDouble() * 1.5,
      (ops['newLeads'] as num? ?? 3).toDouble() * 0.8,
      (ops['newOrders'] as num? ?? 2).toDouble(),
      (ops['newLeads'] as num? ?? 4).toDouble(),
    ];

    return Column(
      children: [
        ConnectChartCard(title: 'Revenue Trend', subtitle: 'Weekly performance', child: ConnectSparkline(values: revenue, color: ConnectColors.success)),
        const SizedBox(height: ConnectSpacing.sm),
        Row(
          children: [
            Expanded(
              child: ConnectChartCard(
                title: 'Leads & Sales',
                child: ConnectMiniBarChart(values: leads, labels: const ['M', 'T', 'W', 'T', 'F'], color: ConnectModuleColors.crm, height: 64),
              ),
            ),
            const SizedBox(width: ConnectSpacing.sm),
            Expanded(
              child: ConnectChartCard(
                title: 'Attendance',
                child: ConnectMiniBarChart(
                  values: [(ops['staffAttendanceToday'] as num? ?? 5).toDouble(), 8, 12, 10, (ops['staffAttendanceToday'] as num? ?? 6).toDouble()],
                  labels: const ['M', 'T', 'W', 'T', 'F'],
                  color: ConnectModuleColors.attendance,
                  height: 64,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _ActivityTile extends StatelessWidget {
  const _ActivityTile({required this.title, required this.subtitle, this.time});
  final String title;
  final String subtitle;
  final String? time;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
      child: ConnectCard(
        padding: const EdgeInsets.all(ConnectSpacing.sm),
        child: Row(
          children: [
            Container(width: 4, height: 36, decoration: BoxDecoration(color: ConnectColors.primary, borderRadius: BorderRadius.circular(2))),
            const SizedBox(width: ConnectSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                  Text(subtitle, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            if (time != null)
              Text(
                DateTime.tryParse(time!) != null ? formatDateTime(DateTime.parse(time!)) : '',
                style: TextStyle(fontSize: 10, color: ConnectPalette.of(context).textMuted),
              ),
          ],
        ),
      ),
    );
  }
}

class _AnnouncementTile extends StatelessWidget {
  const _AnnouncementTile({required this.title, required this.body});
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
      child: ConnectCard(
        padding: const EdgeInsets.all(ConnectSpacing.sm),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: ConnectColors.primary.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(ConnectRadius.md)),
              child: const Icon(Icons.campaign_outlined, color: ConnectColors.primaryGlow, size: 16),
            ),
            const SizedBox(width: ConnectSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                  if (body.isNotEmpty) Text(body, maxLines: 2, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
