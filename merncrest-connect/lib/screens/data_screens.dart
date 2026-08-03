import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/screens/ai_assistant_screen.dart';
import 'package:merncrest_connect/services/platform_sync_service.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class WorkHubScreen extends StatelessWidget {
  const WorkHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ConnectPage(
      title: 'Work Hub',
      subtitle: 'Attendance · Tasks · Leave · Calendar',
      child: Column(
        children: [
          ConnectGlassCard(
            featured: true,
            child: Row(
              children: [
                const Icon(Icons.workspaces_rounded, color: ConnectColors.primaryGlow, size: 28),
                const SizedBox(width: ConnectSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Your workspace', style: Theme.of(context).textTheme.titleMedium),
                      Text('Track time, tasks, and time off', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ).stitchEntrance(),
          const SizedBox(height: ConnectSpacing.sm),
          ConnectModuleRow(
            title: 'Attendance',
            subtitle: 'GPS · QR · Face · WiFi validation',
            icon: Icons.schedule_rounded,
            iconColor: ConnectModuleColors.attendance,
            onTap: () => _open(context, const AttendanceScreen()),
          ),
          ConnectModuleRow(
            title: 'Tasks',
            subtitle: 'Kanban board · priorities · sprints',
            icon: Icons.task_alt_rounded,
            iconColor: ConnectModuleColors.projects,
            onTap: () => _open(context, const TasksScreen()),
          ),
          ConnectModuleRow(
            title: 'Leave',
            subtitle: 'Apply · balances · approvals',
            icon: Icons.flight_takeoff_rounded,
            iconColor: ConnectModuleColors.hr,
            onTap: () => _open(context, const LeaveScreen()),
          ),
          ConnectModuleRow(
            title: 'Calendar',
            subtitle: 'Meetings · events · deadlines',
            icon: Icons.calendar_month_rounded,
            iconColor: ConnectModuleColors.calendar,
            onTap: () => _open(context, const ModuleListScreen(title: 'Calendar', endpoint: '/api/staff/calendar')),
          ),
          ConnectModuleRow(
            title: 'AIRA Assistant',
            subtitle: 'AI-powered work insights',
            icon: Icons.auto_awesome_rounded,
            iconColor: ConnectModuleColors.ai,
            onTap: () => _open(context, const AiAssistantScreen()),
          ),
        ],
      ),
    );
  }

  void _open(BuildContext context, Widget screen) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }
}

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});
  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _data;
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final data = await context.read<AppState>().auth.api.get('/api/staff/attendance');
    if (mounted) setState(() => _data = data);
  }

  Future<void> _clock(String action) async {
    await context.read<AppState>().auth.api.post('/api/staff/attendance', {'action': action});
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final today = _data?['today'] as Map<String, dynamic>?;
    final clockedIn = today?['clockIn'] != null && today?['clockOut'] == null;
    final onBreak = today?['breakStart'] != null && today?['breakEnd'] == null;
    final palette = ConnectPalette.of(context);

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Attendance'),
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          tabs: const [
            Tab(text: 'Clock'),
            Tab(text: 'GPS'),
            Tab(text: 'QR'),
            Tab(text: 'History'),
          ],
        ),
      ),
      body: ConnectAmbientBackground(
        child: TabBarView(
          controller: _tabs,
          children: [
            _ClockTab(
              clockedIn: clockedIn,
              onBreak: onBreak,
              today: today,
              onClock: _clock,
            ),
            _MethodTab(icon: Icons.location_on_rounded, title: 'GPS Attendance', subtitle: 'Location-based clock in with geo-fence validation.', color: ConnectModuleColors.attendance),
            _MethodTab(icon: Icons.qr_code_scanner_rounded, title: 'QR Attendance', subtitle: 'Scan office QR code to mark attendance.', color: ConnectModuleColors.security),
            _HistoryTab(records: (_data?['recent'] as List<dynamic>?) ?? []),
          ],
        ),
      ),
    );
  }
}

class _ClockTab extends StatelessWidget {
  const _ClockTab({
    required this.clockedIn,
    required this.onBreak,
    required this.today,
    required this.onClock,
  });

  final bool clockedIn;
  final bool onBreak;
  final Map<String, dynamic>? today;
  final Future<void> Function(String) onClock;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(ConnectSpacing.lg),
      children: [
        ConnectGlassCard(
          featured: true,
          child: Column(
            children: [
              Icon(
                clockedIn ? Icons.check_circle_rounded : Icons.access_time_rounded,
                size: 44,
                color: clockedIn ? ConnectColors.success : ConnectColors.primaryGlow,
              ),
              const SizedBox(height: ConnectSpacing.sm),
              Text(
                clockedIn ? (onBreak ? 'On break' : 'You are clocked in') : 'Ready to start your day',
                style: Theme.of(context).textTheme.headlineMedium,
                textAlign: TextAlign.center,
              ),
              if (today?['clockIn'] != null) ...[
                const SizedBox(height: 8),
                Text('Clock in: ${today!['clockIn']}', style: Theme.of(context).textTheme.bodyMedium),
              ],
              const SizedBox(height: ConnectSpacing.md),
              ConnectPrimaryButton(
                label: clockedIn ? 'Clock out' : 'Clock in',
                icon: clockedIn ? Icons.logout_rounded : Icons.login_rounded,
                onPressed: () => onClock(clockedIn ? 'clock_out' : 'clock_in'),
              ),
              if (clockedIn) ...[
                const SizedBox(height: ConnectSpacing.sm),
                ConnectPrimaryButton(
                  label: onBreak ? 'End break' : 'Start break',
                  icon: Icons.coffee_rounded,
                  onPressed: () => onClock(onBreak ? 'break_end' : 'break_start'),
                ),
              ],
            ],
          ),
        ).stitchEntrance(),
        const SizedBox(height: ConnectSpacing.md),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: ConnectSpacing.sm,
          crossAxisSpacing: ConnectSpacing.sm,
          childAspectRatio: 1.6,
          children: const [
            ConnectStatTile(label: 'Working Hours', value: '—', icon: Icons.timer_outlined, compact: true),
            ConnectStatTile(label: 'Overtime', value: '—', icon: Icons.more_time_rounded, color: ConnectColors.warning, compact: true),
          ],
        ),
      ],
    );
  }
}

class _MethodTab extends StatelessWidget {
  const _MethodTab({required this.icon, required this.title, required this.subtitle, required this.color});
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(ConnectSpacing.lg),
      child: ConnectGlassCard(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56, color: color),
            const SizedBox(height: ConnectSpacing.md),
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: ConnectSpacing.sm),
            Text(subtitle, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: ConnectSpacing.lg),
            ConnectPrimaryButton(label: 'Coming soon', onPressed: null),
          ],
        ),
      ),
    );
  }
}

class _HistoryTab extends StatelessWidget {
  const _HistoryTab({required this.records});
  final List<dynamic> records;

  @override
  Widget build(BuildContext context) {
    if (records.isEmpty) {
      return const ConnectEmptyState(icon: Icons.history_rounded, title: 'No history yet', subtitle: 'Your attendance records will appear here.');
    }
    return ListView.builder(
      padding: const EdgeInsets.all(ConnectSpacing.lg),
      itemCount: records.length,
      itemBuilder: (context, i) {
        final r = records[i] as Map<String, dynamic>;
        return Padding(
          padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
          child: ConnectCard(
            child: Row(
              children: [
                const Icon(Icons.event_available_rounded, color: ConnectColors.success, size: 20),
                const SizedBox(width: ConnectSpacing.sm),
                Expanded(child: Text(r['workDate']?.toString() ?? r.toString(), style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13))),
              ],
            ),
          ),
        );
      },
    );
  }
}

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});
  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  Map<String, dynamic>? _data;

  static const _columns = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'TESTING', 'COMPLETED'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await context.read<AppState>().auth.api.get('/api/staff/tasks');
    if (mounted) setState(() => _data = data);
  }

  @override
  Widget build(BuildContext context) {
    final byStatus = (_data?['byStatus'] as Map<String, dynamic>?) ?? {};
    final palette = ConnectPalette.of(context);

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Tasks'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded)),
        ],
      ),
      body: ConnectAmbientBackground(
        child: _data == null
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(ConnectSpacing.lg, ConnectSpacing.sm, ConnectSpacing.lg, 0),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          ConnectChip(label: '${_data?['total'] ?? 0} total', color: ConnectColors.info),
                          const SizedBox(width: 6),
                          ConnectChip(label: 'Kanban view', color: ConnectColors.primary),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.all(ConnectSpacing.lg),
                      children: [
                        for (final col in _columns)
                          _KanbanColumn(
                            title: col.replaceAll('_', ' '),
                            tasks: _tasksForColumn(byStatus, col),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  List<dynamic> _tasksForColumn(Map<String, dynamic> byStatus, String col) {
    final key = col.toLowerCase();
    for (final entry in byStatus.entries) {
      if (entry.key.toUpperCase().replaceAll(' ', '_') == col || entry.key.toLowerCase() == key) {
        return entry.value as List<dynamic>? ?? [];
      }
    }
    return byStatus[col] as List<dynamic>? ?? byStatus[col.toLowerCase()] as List<dynamic>? ?? [];
  }
}

class _KanbanColumn extends StatelessWidget {
  const _KanbanColumn({required this.title, required this.tasks});
  final String title;
  final List<dynamic> tasks;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return Container(
      width: 260,
      margin: const EdgeInsets.only(right: ConnectSpacing.sm),
      decoration: BoxDecoration(
        color: palette.surfaceRaised.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(ConnectRadius.lg),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(ConnectSpacing.sm),
            child: Row(
              children: [
                Text(title, style: Theme.of(context).textTheme.labelSmall),
                const Spacer(),
                ConnectChip(label: '${tasks.length}', color: ConnectColors.primary),
              ],
            ),
          ),
          Expanded(
            child: tasks.isEmpty
                ? Center(child: Text('Empty', style: Theme.of(context).textTheme.bodyMedium))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: ConnectSpacing.sm),
                    itemCount: tasks.length,
                    itemBuilder: (context, i) {
                      final t = tasks[i] as Map<String, dynamic>;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                        child: ConnectCard(
                          padding: const EdgeInsets.all(ConnectSpacing.sm),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(t['title']?.toString() ?? '', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                              if (t['project']?['name'] != null)
                                Text(t['project']['name'].toString(), style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                              const SizedBox(height: 6),
                              if (t['priority'] != null) ConnectChip(label: t['priority'].toString(), color: ConnectColors.warning),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class LeaveScreen extends StatefulWidget {
  const LeaveScreen({super.key});
  @override
  State<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends State<LeaveScreen> {
  Map<String, dynamic>? _data;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<AppState>().auth.api.get('/api/staff/leave');
      if (mounted) setState(() => _data = data);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final balances = (_data?['balances'] as List<dynamic>?) ?? [];
    final requests = (_data?['requests'] as List<dynamic>?) ?? (_data?['items'] as List<dynamic>?) ?? [];
    final palette = ConnectPalette.of(context);

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Leave Management'),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.add_rounded)),
        ],
      ),
      body: ConnectAmbientBackground(
        child: _data == null
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : RefreshIndicator(
                color: ConnectColors.primary,
                onRefresh: _load,
                child: ListView(
                  padding: const EdgeInsets.all(ConnectSpacing.lg),
                  children: [
                    if (balances.isNotEmpty) ...[
                      const ConnectSectionHeader(title: 'Leave Balance', padding: EdgeInsets.zero),
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: ConnectSpacing.sm,
                          crossAxisSpacing: ConnectSpacing.sm,
                          childAspectRatio: 1.8,
                        ),
                        itemCount: balances.length,
                        itemBuilder: (context, i) {
                          final b = balances[i] as Map<String, dynamic>;
                          return ConnectStatTile(
                            label: b['type']?.toString() ?? b['leaveType']?.toString() ?? 'Leave',
                            value: '${b['remaining'] ?? b['balance'] ?? '—'}',
                            icon: Icons.beach_access_rounded,
                            color: ConnectModuleColors.hr,
                            compact: true,
                          );
                        },
                      ),
                    ],
                    const ConnectSectionHeader(title: 'Leave Types'),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: const [
                        ConnectChip(label: 'Annual', color: ConnectModuleColors.hr),
                        ConnectChip(label: 'Casual', color: ConnectColors.info),
                        ConnectChip(label: 'Medical', color: ConnectColors.error),
                        ConnectChip(label: 'Half Day', color: ConnectColors.warning),
                        ConnectChip(label: 'Comp Off', color: ConnectColors.success),
                      ],
                    ),
                    const ConnectSectionHeader(title: 'Requests'),
                    if (requests.isEmpty)
                      const ConnectEmptyState(icon: Icons.flight_takeoff_rounded, title: 'No leave requests', subtitle: 'Tap + to apply for leave.')
                    else
                      ...requests.map((r) {
                        final item = r as Map<String, dynamic>;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                          child: ConnectCard(
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(item['type']?.toString() ?? item['leaveType']?.toString() ?? 'Leave', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                      Text('${item['startDate'] ?? ''} → ${item['endDate'] ?? ''}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                                    ],
                                  ),
                                ),
                                ConnectChip(label: item['status']?.toString() ?? 'PENDING'),
                              ],
                            ),
                          ),
                        );
                      }),
                    const SizedBox(height: ConnectSpacing.md),
                    ConnectPrimaryButton(label: 'Apply for Leave', icon: Icons.add_rounded, onPressed: () {}),
                  ],
                ),
              ),
      ),
    );
  }
}

class LiveChatScreen extends StatefulWidget {
  const LiveChatScreen({super.key});
  @override
  State<LiveChatScreen> createState() => _LiveChatScreenState();
}

class _LiveChatScreenState extends State<LiveChatScreen> {
  List<dynamic> _inbox = [];
  PlatformSyncService? _sync;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final next = context.read<AppState>().sync;
    if (_sync != next) {
      _sync?.removeListener(_onSync);
      _sync = next?..addListener(_onSync);
    }
  }

  @override
  void dispose() {
    _sync?.removeListener(_onSync);
    super.dispose();
  }

  void _onSync() {
    final t = _sync?.lastEventType;
    if (t == 'chat_inbox' || t == 'chat_message' || t == 'snapshot') _load();
  }

  Future<void> _load() async {
    final data = await context.read<AppState>().auth.api.get('/api/staff/chat/inbox');
    if (mounted) setState(() => _inbox = (data['conversations'] as List<dynamic>?) ?? []);
  }

  @override
  Widget build(BuildContext context) {
    if (_inbox.isEmpty) {
      return ConnectPage(
        title: 'Live Chat',
        subtitle: 'Customer conversations from the website',
        onRefresh: _load,
        child: const ConnectEmptyState(icon: Icons.forum_outlined, title: 'No active conversations', subtitle: 'New chats will appear here in real time.'),
      );
    }

    return ConnectPage(
      title: 'Live Chat',
      subtitle: '${_inbox.length} active conversations',
      onRefresh: _load,
      child: Column(
        children: _inbox.map((c) {
          final item = c as Map<String, dynamic>;
          final name = item['lead']?['fullName']?.toString() ?? 'Visitor';
          final unread = item['unreadCount'] as int? ?? 0;
          return Padding(
            padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
            child: ConnectCard(
              onTap: () {},
              child: Row(
                children: [
                  ConnectAvatar(label: name, size: 44),
                  const SizedBox(width: ConnectSpacing.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(child: Text(name, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13))),
                            if (unread > 0) ConnectChip(label: '$unread', color: ConnectColors.accent),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(item['lastMessage']?['body']?.toString() ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
                      ],
                    ),
                  ),
                  ConnectChip(label: item['status']?.toString() ?? 'OPEN'),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class ClientsScreen extends StatefulWidget {
  const ClientsScreen({super.key});
  @override
  State<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends State<ClientsScreen> {
  List<dynamic> _clients = [];
  String _query = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<AppState>().auth.api.get('/api/crm');
      if (mounted) {
        setState(() {
          _clients = (data['leads'] as List<dynamic>?) ??
              (data['clients'] as List<dynamic>?) ??
              (data['data'] as List<dynamic>?) ??
              [];
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _clients.where((c) {
      if (_query.isEmpty) return true;
      final item = c as Map<String, dynamic>;
      final name = '${item['fullName']} ${item['company']} ${item['email']} ${item['customerCode']} ${item['leadNumber']}'.toLowerCase();
      return name.contains(_query.toLowerCase());
    }).toList();

    return ConnectPage(
      title: 'CRM Clients',
      subtitle: '${filtered.length} customers',
      onRefresh: _load,
      child: Column(
        children: [
          TextField(
            decoration: const InputDecoration(
              hintText: 'Search clients…',
              prefixIcon: Icon(Icons.search_rounded, size: 20),
              isDense: true,
            ),
            onChanged: (v) => setState(() => _query = v),
          ),
          const SizedBox(height: ConnectSpacing.md),
          if (filtered.isEmpty)
            const ConnectEmptyState(icon: Icons.groups_outlined, title: 'No clients yet', subtitle: 'CRM records will sync from the server.')
          else
            ...filtered.map((c) {
              final item = c as Map<String, dynamic>;
              final name = item['fullName']?.toString() ?? item['company']?.toString() ?? 'Client';
              return Padding(
                padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                child: ConnectCard(
                  onTap: () {},
                  child: Row(
                    children: [
                      ConnectAvatar(label: name),
                      const SizedBox(width: ConnectSpacing.sm),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                            Text(item['customerCode']?.toString() ?? item['leadNumber']?.toString() ?? item['email']?.toString() ?? '', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right_rounded, size: 18, color: ConnectColors.textMuted),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}

class ModuleListScreen extends StatefulWidget {
  const ModuleListScreen({super.key, required this.title, required this.endpoint});
  final String title;
  final String endpoint;
  @override
  State<ModuleListScreen> createState() => _ModuleListScreenState();
}

class _ModuleListScreenState extends State<ModuleListScreen> {
  dynamic _payload;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<AppState>().auth.api.get(widget.endpoint);
      if (mounted) setState(() => _payload = data);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(title: Text(widget.title)),
      body: ConnectAmbientBackground(
        child: _error != null
            ? ConnectEmptyState(icon: Icons.error_outline, title: 'Could not load', subtitle: _error)
            : _payload == null
                ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
                : RefreshIndicator(
                    onRefresh: _load,
                    color: ConnectColors.primary,
                    child: ListView(
                      padding: const EdgeInsets.all(ConnectSpacing.lg),
                      children: [
                        ConnectCard(
                          child: Text(
                            _formatPayload(_payload),
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
      ),
    );
  }

  String _formatPayload(dynamic payload) {
    if (payload is Map) {
      final items = payload['items'] ?? payload['data'] ?? payload['records'];
      if (items is List && items.isNotEmpty) {
        return items.map((e) => e.toString()).join('\n\n');
      }
    }
    return payload.toString();
  }
}
