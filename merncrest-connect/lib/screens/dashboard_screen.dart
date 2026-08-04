import 'package:flutter/material.dart';
import 'package:merncrest_connect/navigation/module_router.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/screens/ai_assistant_screen.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_kpi_grid.dart';
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

class _DashboardScreenState extends State<DashboardScreen> with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _data;
  Map<String, dynamic>? _command;
  List<dynamic> _announcements = [];
  bool _loading = true;
  String? _error;
  late TabController _activityTabs;

  @override
  void initState() {
    super.initState();
    _activityTabs = TabController(length: 4, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _activityTabs.dispose();
    super.dispose();
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
    final roles = (state.user?['roles'] as List<dynamic>?) ?? [];

    return ConnectPage(
      onRefresh: _load,
      padding: const EdgeInsets.fromLTRB(ConnectSpacing.lg, 0, ConnectSpacing.lg, 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ConnectOfflineBanner(online: sync?.connected == true),
          if (_loading)
            const ConnectDashboardSkeleton()
          else if (_error != null)
            ConnectEmptyState(icon: Icons.cloud_off_outlined, title: 'Could not load dashboard', subtitle: _error)
          else ...[
            _WelcomeHero(
              name: state.displayName,
              role: employee?['jobTitle']?.toString() ?? 'MernCrest Staff',
              roles: roles.map((r) => r.toString()).toList(),
              branch: employee?['branch']?['name']?.toString() ?? 'MernCrest HQ',
              location: employee?['branch']?['city']?.toString() ?? 'Sri Lanka',
              lastLogin: state.user?['user']?['lastLoginAt']?.toString(),
              now: now,
              syncOnline: sync?.connected == true,
              serverStatus: ops['serverStatus']?.toString() ?? 'online',
              apiStatus: 'online',
              employeeStatus: employee?['status']?.toString() ?? 'ACTIVE',
            ).stitchEntrance(),
            const SizedBox(height: ConnectSpacing.sm),
            ConnectStatusRow(items: [
              ('Sync', sync?.connected == true ? ConnectStatusLevel.online : ConnectStatusLevel.degraded),
              ('Internet', ConnectStatusLevel.online),
              ('API', ConnectStatusLevel.online),
              ('Server', _serverLevel(ops['serverStatus']?.toString())),
              ('Employee', ConnectStatusLevel.online),
              ('Cloud', ConnectStatusLevel.online),
            ]),
            const SizedBox(height: ConnectSpacing.sm),
            ...DashboardKpiBuilder(ops: ops, data: _data, sync: sync).buildSections(),
            const ConnectSectionHeader(
              title: 'Upcoming',
              padding: EdgeInsets.fromLTRB(0, ConnectSpacing.xs, 0, ConnectSpacing.xs),
            ),
            _UpcomingSection(items: (_command?['upcomingCalendar'] as List<dynamic>?) ?? []),
            const ConnectSectionHeader(title: 'Quick Actions', padding: EdgeInsets.fromLTRB(0, ConnectSpacing.sm, 0, ConnectSpacing.xs)),
            ConnectQuickActionGrid(actions: _buildQuickActions(context, state)),
            const ConnectSectionHeader(title: 'Recent Activity'),
            _ActivityTabs(
              controller: _activityTabs,
              activities: activities,
              data: _data,
              announcements: _announcements,
            ),
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
      QuickActionItem(icon: Icons.schedule_rounded, label: 'Attendance', color: ConnectModuleColors.attendance, onTap: () => ModuleRouter.open(context, '/attendance')),
      QuickActionItem(icon: Icons.flight_takeoff_rounded, label: 'Leave', color: ConnectModuleColors.hr, onTap: () => ModuleRouter.open(context, '/leave')),
      QuickActionItem(icon: Icons.add_task_rounded, label: 'Task', color: ConnectModuleColors.projects, onTap: () => ModuleRouter.open(context, '/tasks')),
      QuickActionItem(icon: Icons.confirmation_number_outlined, label: 'Ticket', color: ConnectModuleColors.helpdesk, onTap: () => ModuleRouter.open(context, '/tickets')),
      QuickActionItem(icon: Icons.groups_rounded, label: 'CRM', color: ConnectModuleColors.crm, onTap: () => state.goToShellTab(3)),
      QuickActionItem(icon: Icons.receipt_long_rounded, label: 'Invoices', color: ConnectModuleColors.finance, onTap: () => ModuleRouter.open(context, '/billing')),
      QuickActionItem(icon: Icons.folder_special_rounded, label: 'Projects', color: ConnectModuleColors.projects, onTap: () => ModuleRouter.open(context, '/projects')),
      QuickActionItem(icon: Icons.trending_up_rounded, label: 'Sales', color: ConnectModuleColors.crm, onTap: () => state.goToShellTab(3)),
      QuickActionItem(icon: Icons.person_add_rounded, label: 'Clients', color: ConnectModuleColors.crm, onTap: () => state.goToShellTab(3)),
      QuickActionItem(icon: Icons.calendar_month_rounded, label: 'Calendar', color: ConnectModuleColors.calendar, onTap: () => ModuleRouter.open(context, '/calendar')),
      QuickActionItem(icon: Icons.event_rounded, label: 'Meetings', color: ConnectModuleColors.calendar, onTap: () => ModuleRouter.open(context, '/calendar')),
      QuickActionItem(icon: Icons.forum_rounded, label: 'Chat', color: ConnectModuleColors.chat, onTap: () => state.goToShellTab(2)),
      QuickActionItem(icon: Icons.qr_code_scanner_rounded, label: 'Scan QR', color: ConnectModuleColors.security, onTap: () => ModuleRouter.open(context, '/attendance')),
      QuickActionItem(icon: Icons.qr_code_2_rounded, label: 'Barcode', color: ConnectModuleColors.security, onTap: () => ModuleRouter.open(context, '/attendance')),
      QuickActionItem(icon: Icons.auto_awesome_rounded, label: 'AIRA', color: ConnectModuleColors.ai, onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AiAssistantScreen()))),
      QuickActionItem(icon: Icons.payments_rounded, label: 'Payments', color: ConnectModuleColors.finance, onTap: () => ModuleRouter.open(context, '/billing')),
      QuickActionItem(icon: Icons.money_off_rounded, label: 'Expenses', color: ConnectModuleColors.finance, onTap: () => ModuleRouter.open(context, '/billing')),
      QuickActionItem(icon: Icons.approval_rounded, label: 'Approvals', color: ConnectModuleColors.erp, onTap: () => ModuleRouter.open(context, '/approvals')),
      QuickActionItem(icon: Icons.campaign_rounded, label: 'News', color: ConnectModuleColors.hr, onTap: () => ModuleRouter.open(context, '/announcements')),
      QuickActionItem(icon: Icons.description_rounded, label: 'Documents', color: ConnectModuleColors.docs, onTap: () => ModuleRouter.open(context, '/documents')),
      QuickActionItem(icon: Icons.folder_open_rounded, label: 'Files', color: ConnectModuleColors.docs, onTap: () => ModuleRouter.open(context, '/documents')),
      QuickActionItem(icon: Icons.emergency_rounded, label: 'Emergency', color: ConnectColors.error, onTap: () => ModuleRouter.open(context, '/tickets')),
      QuickActionItem(icon: Icons.settings_rounded, label: 'Settings', color: ConnectModuleColors.settings, onTap: () => ModuleRouter.open(context, '/settings')),
    ];
  }
}

class _WelcomeHero extends StatelessWidget {
  const _WelcomeHero({
    required this.name,
    required this.role,
    required this.roles,
    required this.branch,
    required this.location,
    required this.lastLogin,
    required this.now,
    required this.syncOnline,
    required this.serverStatus,
    required this.apiStatus,
    required this.employeeStatus,
  });

  final String name;
  final String role;
  final List<String> roles;
  final String branch;
  final String location;
  final String? lastLogin;
  final DateTime now;
  final bool syncOnline;
  final String serverStatus;
  final String apiStatus;
  final String employeeStatus;

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
              ClipRRect(
                borderRadius: BorderRadius.circular(ConnectRadius.sm),
                child: Image.asset('assets/images/app_icon.png', width: 32, height: 32),
              ),
              const SizedBox(width: ConnectSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${greetingForHour(now.hour)}, $name', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16)),
                    const SizedBox(height: 2),
                    Text(role, style: const TextStyle(color: ConnectColors.primaryGlow, fontSize: 12, fontWeight: FontWeight.w600)),
                    if (roles.isNotEmpty)
                      Text(roles.first, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 10)),
                    Text('$branch · $location', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 10)),
                  ],
                ),
              ),
              ConnectAvatar(label: name, size: 44),
            ],
          ),
          const SizedBox(height: ConnectSpacing.sm),
          Row(
            children: [
              _MetaChip(icon: Icons.access_time_rounded, label: formatTime(nowInSriLanka())),
              const SizedBox(width: 6),
              _MetaChip(icon: Icons.calendar_today_rounded, label: formatDate(now)),
            ],
          ),
          if (lastLogin != null) ...[
            const SizedBox(height: 6),
            Text('Last login: $lastLogin', style: Theme.of(context).textTheme.labelSmall?.copyWith(fontSize: 9)),
          ],
          const SizedBox(height: ConnectSpacing.sm),
          Wrap(
            spacing: 5,
            runSpacing: 5,
            children: [
              ConnectStatusPill(label: syncOnline ? 'LIVE SYNC' : 'SYNCING', status: syncOnline ? ConnectStatusLevel.online : ConnectStatusLevel.degraded, compact: true),
              const ConnectStatusPill(label: 'INTERNET', status: ConnectStatusLevel.online, compact: true),
              ConnectStatusPill(label: apiStatus.toUpperCase(), status: ConnectStatusLevel.online, compact: true),
              ConnectStatusPill(
                label: serverStatus.toUpperCase(),
                status: serverStatus == 'online' ? ConnectStatusLevel.online : ConnectStatusLevel.degraded,
                compact: true,
              ),
              ConnectStatusPill(label: employeeStatus.toUpperCase(), status: ConnectStatusLevel.online, compact: true),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label, this.color});
  final IconData icon;
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: palette.surfaceOverlay.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(ConnectRadius.pill),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color ?? palette.textMuted),
          const SizedBox(width: 4),
          Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(fontSize: 9)),
        ],
      ),
    );
  }
}

class _ActivityTabs extends StatelessWidget {
  const _ActivityTabs({
    required this.controller,
    required this.activities,
    required this.data,
    required this.announcements,
  });

  final TabController controller;
  final List<dynamic> activities;
  final Map<String, dynamic>? data;
  final List<dynamic> announcements;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return Column(
      children: [
        TabBar(
          controller: controller,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          indicatorColor: ConnectColors.primary,
          dividerColor: palette.borderSubtle,
          tabs: const [
            Tab(text: 'Activity'),
            Tab(text: 'Notifications'),
            Tab(text: 'Announcements'),
            Tab(text: 'Tickets'),
          ],
        ),
        SizedBox(
          height: 220,
          child: TabBarView(
            controller: controller,
            children: [
              _ActivityList(items: activities.isNotEmpty ? activities : (data?['notifications'] as List<dynamic>?) ?? []),
              _ActivityList(items: (data?['notifications'] as List<dynamic>?) ?? [], emptyIcon: Icons.notifications_none_rounded, emptyTitle: 'No notifications'),
              _AnnouncementList(items: announcements),
              _ActivityList(items: _ticketItems(data), emptyIcon: Icons.headset_mic_outlined, emptyTitle: 'No tickets'),
            ],
          ),
        ),
      ],
    );
  }

  List<dynamic> _ticketItems(Map<String, dynamic>? data) {
    final ops = data?['ops'] as Map<String, dynamic>?;
    if (ops?['recentTickets'] is List) return ops!['recentTickets'] as List;
    return [];
  }
}

class _ActivityList extends StatelessWidget {
  const _ActivityList({required this.items, this.emptyIcon = Icons.history_rounded, this.emptyTitle = 'No activity yet'});

  final List<dynamic> items;
  final IconData emptyIcon;
  final String emptyTitle;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return ConnectEmptyState(icon: emptyIcon, title: emptyTitle, subtitle: 'Updates will appear here.');
    }
    return ListView.builder(
      padding: const EdgeInsets.only(top: ConnectSpacing.sm),
      itemCount: items.length.clamp(0, 8),
      itemBuilder: (context, i) {
        final item = items[i] as Map<String, dynamic>;
        return _ActivityTile(
          title: item['summary']?.toString() ?? item['title']?.toString() ?? item['action']?.toString() ?? 'Activity',
          subtitle: '${item['module'] ?? item['body'] ?? ''} · ${item['actorName'] ?? 'System'}',
          time: item['createdAt']?.toString(),
        ).stitchEntrance(delay: Duration(milliseconds: 30 * i));
      },
    );
  }
}

class _AnnouncementList extends StatelessWidget {
  const _AnnouncementList({required this.items});
  final List<dynamic> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const ConnectEmptyState(icon: Icons.campaign_outlined, title: 'No announcements', subtitle: 'Company updates will appear here.');
    }
    return ListView.builder(
      padding: const EdgeInsets.only(top: ConnectSpacing.sm),
      itemCount: items.length.clamp(0, 8),
      itemBuilder: (context, i) {
        final n = items[i] as Map<String, dynamic>;
        return _AnnouncementTile(title: n['title']?.toString() ?? '', body: n['body']?.toString() ?? '');
      },
    );
  }
}

class _UpcomingSection extends StatelessWidget {
  const _UpcomingSection({required this.items});
  final List<dynamic> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return ConnectCard(
        padding: const EdgeInsets.all(ConnectSpacing.md),
        child: Text('No upcoming events on your calendar.', style: Theme.of(context).textTheme.bodyMedium),
      );
    }
    return Column(
      children: items.take(6).map((raw) {
        final item = raw as Map<String, dynamic>;
        final title = item['title']?.toString() ?? 'Event';
        final when = item['startsAt']?.toString();
        final dt = when != null ? DateTime.tryParse(when) : null;
        return Padding(
          padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
          child: ConnectCard(
            padding: const EdgeInsets.all(ConnectSpacing.sm),
            child: Row(
              children: [
                const Icon(Icons.event_rounded, color: ConnectColors.primaryGlow, size: 18),
                const SizedBox(width: ConnectSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 12)),
                      Text(
                        dt != null ? formatDateTime(dt) : (item['kind']?.toString() ?? ''),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 10),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
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
      padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
      child: ConnectCard(
        padding: const EdgeInsets.all(ConnectSpacing.sm),
        child: Row(
          children: [
            Container(width: 3, height: 32, decoration: BoxDecoration(color: ConnectColors.primary, borderRadius: BorderRadius.circular(2))),
            const SizedBox(width: ConnectSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                  Text(subtitle, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 10), maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            if (time != null)
              Text(
                DateTime.tryParse(time!) != null ? formatDateTime(DateTime.parse(time!)) : '',
                style: TextStyle(fontSize: 9, color: ConnectPalette.of(context).textMuted),
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
      padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
      child: ConnectCard(
        padding: const EdgeInsets.all(ConnectSpacing.sm),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(color: ConnectColors.primary.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(ConnectRadius.sm)),
              child: const Icon(Icons.campaign_outlined, color: ConnectColors.primaryGlow, size: 14),
            ),
            const SizedBox(width: ConnectSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 12)),
                  if (body.isNotEmpty) Text(body, maxLines: 2, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
