import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/screens/ai_assistant_screen.dart';
import 'package:merncrest_connect/screens/attendance_screen.dart';
import 'package:merncrest_connect/screens/calendar_screen.dart';
import 'package:merncrest_connect/screens/chat_conversation_screen.dart';
import 'package:merncrest_connect/screens/client_detail_screen.dart';
import 'package:merncrest_connect/screens/internal_chat_screen.dart';
import 'package:merncrest_connect/screens/projects_screen.dart';
import 'package:merncrest_connect/screens/task_detail_screen.dart';
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
            title: 'Projects',
            subtitle: 'Progress · milestones · services',
            icon: Icons.folder_special_rounded,
            iconColor: ConnectModuleColors.projects,
            onTap: () => _open(context, const ProjectsScreen()),
          ),
          ConnectModuleRow(
            title: 'Calendar',
            subtitle: 'Meetings · events · deadlines',
            icon: Icons.calendar_month_rounded,
            iconColor: ConnectModuleColors.calendar,
            onTap: () => _open(context, const CalendarScreen()),
          ),
          ConnectModuleRow(
            title: 'Team Chat',
            subtitle: 'Internal messaging · general & DM',
            icon: Icons.chat_bubble_outline_rounded,
            iconColor: ConnectModuleColors.chat,
            onTap: () => _open(context, const InternalChatScreen()),
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

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});
  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  Map<String, dynamic>? _data;
  String _priorityFilter = 'all';

  static const _columns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];

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
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              ConnectChip(label: '${_data?['stats']?['open'] ?? _data?['total'] ?? 0} open', color: ConnectColors.info),
                              const SizedBox(width: 6),
                              ConnectChip(label: '${_data?['stats']?['trackedMinutesToday'] ?? 0}m tracked', color: ConnectModuleColors.projects),
                            ],
                          ),
                        ),
                        const SizedBox(height: ConnectSpacing.sm),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              _PriorityChip(label: 'All', value: 'all', selected: _priorityFilter == 'all', onTap: () => setState(() => _priorityFilter = 'all')),
                              _PriorityChip(label: 'High', value: 'HIGH', selected: _priorityFilter == 'HIGH', onTap: () => setState(() => _priorityFilter = 'HIGH')),
                              _PriorityChip(label: 'Medium', value: 'MEDIUM', selected: _priorityFilter == 'MEDIUM', onTap: () => setState(() => _priorityFilter = 'MEDIUM')),
                              _PriorityChip(label: 'Low', value: 'LOW', selected: _priorityFilter == 'LOW', onTap: () => setState(() => _priorityFilter = 'LOW')),
                            ],
                          ),
                        ),
                      ],
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
                            tasks: _filteredTasks(_tasksForColumn(byStatus, col)),
                            onTaskTap: (task) => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => TaskDetailScreen(task: task, onUpdated: _load),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  List<dynamic> _filteredTasks(List<dynamic> tasks) {
    if (_priorityFilter == 'all') return tasks;
    return tasks.where((t) => (t as Map)['priority']?.toString().toUpperCase() == _priorityFilter).toList();
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
  const _KanbanColumn({required this.title, required this.tasks, this.onTaskTap});
  final String title;
  final List<dynamic> tasks;
  final void Function(Map<String, dynamic> task)? onTaskTap;

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
                          onTap: onTaskTap != null ? () => onTaskTap!(t) : null,
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

class _PriorityChip extends StatelessWidget {
  const _PriorityChip({required this.label, required this.value, required this.selected, required this.onTap});
  final String label;
  final String value;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        label: Text(label, style: const TextStyle(fontSize: 10)),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: ConnectColors.primary.withValues(alpha: 0.25),
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

  void _openApplySheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: ConnectPalette.of(context).surfaceRaised,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(ConnectRadius.xl))),
      builder: (ctx) => _ApplyLeaveSheet(
        leaveTypes: (_data?['leaveTypes'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? ['ANNUAL', 'CASUAL', 'SICK'],
        onSubmitted: () {
          Navigator.pop(ctx);
          _load();
        },
      ),
    );
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
          IconButton(onPressed: _openApplySheet, icon: const Icon(Icons.add_rounded)),
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
                          final remaining = (b['entitled'] as num? ?? 0) - (b['used'] as num? ?? 0) - (b['pending'] as num? ?? 0);
                          return ConnectStatTile(
                            label: b['leaveType']?.toString() ?? 'Leave',
                            value: '$remaining',
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
                    ConnectPrimaryButton(label: 'Apply for Leave', icon: Icons.add_rounded, onPressed: _openApplySheet),
                  ],
                ),
              ),
      ),
    );
  }
}

class _ApplyLeaveSheet extends StatefulWidget {
  const _ApplyLeaveSheet({required this.leaveTypes, required this.onSubmitted});
  final List<String> leaveTypes;
  final VoidCallback onSubmitted;

  @override
  State<_ApplyLeaveSheet> createState() => _ApplyLeaveSheetState();
}

class _ApplyLeaveSheetState extends State<_ApplyLeaveSheet> {
  late String _leaveType = widget.leaveTypes.isNotEmpty ? widget.leaveTypes.first : 'ANNUAL';
  DateTime _start = DateTime.now();
  DateTime _end = DateTime.now();
  final _reason = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  String _fmt(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Future<void> _pickDate(bool isStart) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isStart ? _start : _end,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _start = picked;
          if (_end.isBefore(_start)) _end = _start;
        } else {
          _end = picked;
        }
      });
    }
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<AppState>().auth.api.post('/api/staff/leave', {
        'leaveType': _leaveType,
        'startDate': _fmt(_start),
        'endDate': _fmt(_end),
        'reason': _reason.text.trim().isEmpty ? null : _reason.text.trim(),
      });
      widget.onSubmitted();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(ConnectSpacing.lg, ConnectSpacing.md, ConnectSpacing.lg, bottom + ConnectSpacing.lg),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Apply for Leave', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: ConnectSpacing.md),
          DropdownButtonFormField<String>(
            value: _leaveType,
            decoration: const InputDecoration(labelText: 'Leave type'),
            items: widget.leaveTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
            onChanged: (v) => setState(() => _leaveType = v ?? _leaveType),
          ),
          const SizedBox(height: ConnectSpacing.sm),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Start date'),
            subtitle: Text(_fmt(_start)),
            trailing: const Icon(Icons.calendar_today_rounded, size: 18),
            onTap: () => _pickDate(true),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('End date'),
            subtitle: Text(_fmt(_end)),
            trailing: const Icon(Icons.calendar_today_rounded, size: 18),
            onTap: () => _pickDate(false),
          ),
          TextField(controller: _reason, maxLines: 3, decoration: const InputDecoration(labelText: 'Reason (optional)')),
          if (_error != null) ...[
            const SizedBox(height: ConnectSpacing.sm),
            Text(_error!, style: const TextStyle(color: ConnectColors.error, fontSize: 12)),
          ],
          const SizedBox(height: ConnectSpacing.md),
          ConnectPrimaryButton(label: 'Submit Request', icon: Icons.send_rounded, loading: _busy, onPressed: _submit),
        ],
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
  String _query = '';
  String _filter = 'all';

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
    final filtered = _inbox.where((c) {
      final item = c as Map<String, dynamic>;
      final name = item['lead']?['fullName']?.toString() ?? 'Visitor';
      final unread = item['unreadCount'] as int? ?? 0;
      final status = item['status']?.toString() ?? 'OPEN';

      if (_filter == 'unread' && unread == 0) return false;
      if (_filter == 'open' && status.toUpperCase() != 'OPEN') return false;
      if (_query.isNotEmpty && !name.toLowerCase().contains(_query.toLowerCase())) return false;
      return true;
    }).toList();

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
      subtitle: '${filtered.length} conversations',
      onRefresh: _load,
      child: Column(
        children: [
          ConnectSearchBar(hint: 'Search chats…', onChanged: (v) => setState(() => _query = v)),
          const SizedBox(height: ConnectSpacing.sm),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _FilterChip(label: 'All', value: 'all', selected: _filter == 'all', onTap: () => setState(() => _filter = 'all')),
                _FilterChip(label: 'Unread', value: 'unread', selected: _filter == 'unread', onTap: () => setState(() => _filter = 'unread')),
                _FilterChip(label: 'Open', value: 'open', selected: _filter == 'open', onTap: () => setState(() => _filter = 'open')),
                _FilterChip(label: 'Pinned', value: 'pinned', selected: _filter == 'pinned', onTap: () => setState(() => _filter = 'pinned')),
              ],
            ),
          ),
          const SizedBox(height: ConnectSpacing.sm),
          if (filtered.isEmpty)
            const ConnectEmptyState(icon: Icons.search_off_rounded, title: 'No matches', subtitle: 'Try a different search or filter.')
          else
            ...filtered.map((c) {
              final item = c as Map<String, dynamic>;
              final name = item['lead']?['fullName']?.toString() ?? 'Visitor';
              final unread = item['unreadCount'] as int? ?? 0;
              return Padding(
                padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                child: ConnectCard(
                  onTap: () {
                    final sessionId = item['id']?.toString();
                    if (sessionId == null) return;
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ChatConversationScreen(sessionId: sessionId, preview: item),
                      ),
                    );
                  },
                  child: Row(
                    children: [
                      Stack(
                        children: [
                          ConnectAvatar(label: name, size: 44),
                          if (unread > 0)
                            Positioned(
                              right: 0,
                              top: 0,
                              child: Container(
                                width: 10,
                                height: 10,
                                decoration: const BoxDecoration(color: ConnectColors.accent, shape: BoxShape.circle),
                              ),
                            ),
                        ],
                      ),
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
                            Text(
                              item['lastMessage']?['body']?.toString() ?? '',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      ConnectChip(label: item['status']?.toString() ?? 'OPEN'),
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

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.value, required this.selected, required this.onTap});
  final String label;
  final String value;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        label: Text(label, style: const TextStyle(fontSize: 11)),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: ConnectColors.primary.withValues(alpha: 0.25),
        checkmarkColor: ConnectColors.primaryGlow,
        side: BorderSide(color: selected ? ConnectColors.primary : ConnectPalette.of(context).borderSubtle),
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
    final api = context.read<AppState>().auth.api;
    try {
      final data = await api.get('/api/admin/customers');
      if (!mounted) return;
      setState(() {
        _clients = (data['customers'] as List<dynamic>?) ??
            (data['leads'] as List<dynamic>?) ??
            (data['clients'] as List<dynamic>?) ??
            (data['data'] as List<dynamic>?) ??
            [];
      });
    } catch (_) {
      try {
        final data = await api.get('/api/crm');
        if (!mounted) return;
        setState(() => _clients = (data['leads'] as List<dynamic>?) ?? []);
      } catch (_) {}
    }
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
          ConnectGlassCard(
            featured: true,
            padding: const EdgeInsets.all(ConnectSpacing.md),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: ConnectModuleColors.crm.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(ConnectRadius.md),
                  ),
                  child: const Icon(Icons.groups_rounded, color: ConnectModuleColors.crm, size: 24),
                ),
                const SizedBox(width: ConnectSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Client Dashboard', style: Theme.of(context).textTheme.titleMedium),
                      Text('Search · filter · customer 360', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                    ],
                  ),
                ),
              ],
            ),
          ).stitchEntrance(),
          const SizedBox(height: ConnectSpacing.sm),
          ConnectSearchBar(hint: 'Search clients…', onChanged: (v) => setState(() => _query = v)),
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
                  onTap: () {
                    final clientId = item['id']?.toString() ?? item['customerCode']?.toString();
                    if (clientId == null) return;
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ClientDetailScreen(clientId: clientId, preview: item),
                      ),
                    );
                  },
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
