import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/services/platform_sync_service.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class WorkHubScreen extends StatelessWidget {
  const WorkHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ConnectPage(
      title: 'Work hub',
      subtitle: 'Attendance, tasks, leave, and calendar',
      child: Column(
        children: [
          ConnectModuleRow(title: 'Attendance', subtitle: 'Clock in / out · history', icon: Icons.schedule_rounded, onTap: () => _open(context, const AttendanceScreen())),
          ConnectModuleRow(title: 'Tasks', subtitle: 'Kanban · priorities', icon: Icons.task_alt_rounded, onTap: () => _open(context, const TasksScreen())),
          ConnectModuleRow(title: 'Leave', subtitle: 'Apply · balances', icon: Icons.flight_takeoff_rounded, onTap: () => _open(context, const LeaveScreen())),
          ConnectModuleRow(title: 'Calendar', subtitle: 'Events · team view', icon: Icons.calendar_month_rounded, onTap: () => _open(context, const ModuleListScreen(title: 'Calendar', endpoint: '/api/staff/calendar'))),
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

class _AttendanceScreenState extends State<AttendanceScreen> {
  Map<String, dynamic>? _data;

  @override
  void initState() {
    super.initState();
    _load();
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

    return Scaffold(
      backgroundColor: ConnectColors.background,
      appBar: AppBar(title: const Text('Attendance')),
      body: ConnectAmbientBackground(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: ConnectCard(
            featured: true,
            child: Column(
              children: [
                Icon(clockedIn ? Icons.check_circle_rounded : Icons.access_time_rounded, size: 48, color: clockedIn ? ConnectColors.success : ConnectColors.primaryGlow),
                const SizedBox(height: 12),
                Text(clockedIn ? 'You are clocked in' : 'Ready to start your day', style: Theme.of(context).textTheme.headlineMedium, textAlign: TextAlign.center),
                const SizedBox(height: 20),
                ConnectPrimaryButton(
                  label: clockedIn ? 'Clock out' : 'Clock in',
                  icon: clockedIn ? Icons.logout_rounded : Icons.login_rounded,
                  onPressed: () => _clock(clockedIn ? 'clock_out' : 'clock_in'),
                ),
              ],
            ),
          ),
        ),
      ),
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
    return Scaffold(
      backgroundColor: ConnectColors.background,
      appBar: AppBar(title: const Text('Tasks')),
      body: ConnectAmbientBackground(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            for (final entry in byStatus.entries) ...[
              ConnectSectionHeader(title: entry.key.replaceAll('_', ' ').toUpperCase()),
              for (final t in (entry.value as List<dynamic>))
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: ConnectCard(
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(t['title']?.toString() ?? '', style: Theme.of(context).textTheme.titleMedium),
                              Text(t['project']?['name']?.toString() ?? '', style: Theme.of(context).textTheme.bodyMedium),
                            ],
                          ),
                        ),
                        ConnectChip(label: t['status']?.toString() ?? ''),
                      ],
                    ),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class LeaveScreen extends StatelessWidget {
  const LeaveScreen({super.key});
  @override
  Widget build(BuildContext context) => const ModuleListScreen(title: 'Leave', endpoint: '/api/staff/leave');
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
        title: 'Live chat',
        subtitle: 'Customer conversations from the website',
        onRefresh: _load,
        child: const ConnectEmptyState(icon: Icons.forum_outlined, title: 'No active conversations', subtitle: 'New chats will appear here in real time.'),
      );
    }

    return ConnectPage(
      title: 'Live chat',
      subtitle: '${_inbox.length} active conversations',
      onRefresh: _load,
      child: Column(
        children: _inbox.map((c) {
          final item = c as Map<String, dynamic>;
          final name = item['lead']?['fullName']?.toString() ?? 'Visitor';
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: ConnectCard(
              child: Row(
                children: [
                  ConnectAvatar(label: name, size: 44),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(item['lastMessage']?['body']?.toString() ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodyMedium),
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

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<AppState>().auth.api.get('/api/crm');
      if (mounted) setState(() => _clients = (data['clients'] as List<dynamic>?) ?? []);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return ConnectPage(
      title: 'Clients',
      subtitle: 'CRM customer directory',
      onRefresh: _load,
      child: _clients.isEmpty
          ? const ConnectEmptyState(icon: Icons.groups_outlined, title: 'No clients yet', subtitle: 'CRM records will sync from the server.')
          : Column(
              children: _clients.map((c) {
                final item = c as Map<String, dynamic>;
                final name = item['fullName']?.toString() ?? item['company']?.toString() ?? 'Client';
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: ConnectCard(
                    child: Row(
                      children: [
                        ConnectAvatar(label: name),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(name, style: Theme.of(context).textTheme.titleMedium),
                              Text(item['customerCode']?.toString() ?? item['email']?.toString() ?? '', style: Theme.of(context).textTheme.bodyMedium),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
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
    return Scaffold(
      backgroundColor: ConnectColors.background,
      appBar: AppBar(title: Text(widget.title)),
      body: ConnectAmbientBackground(
        child: _error != null
            ? ConnectEmptyState(icon: Icons.error_outline, title: 'Could not load', subtitle: _error)
            : _payload == null
                ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
                : ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      ConnectCard(
                        child: Text(_payload.toString(), style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontFamily: 'monospace', fontSize: 12)),
                      ),
                    ],
                  ),
      ),
    );
  }
}
