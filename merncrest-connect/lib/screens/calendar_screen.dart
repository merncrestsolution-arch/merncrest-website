import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> with SingleTickerProviderStateMixin {
  List<dynamic> _events = [];
  List<dynamic> _holidays = [];
  List<dynamic> _leaves = [];
  bool _loading = true;
  late TabController _viewTabs;
  String _mode = 'agenda';

  @override
  void initState() {
    super.initState();
    _viewTabs = TabController(length: 4, vsync: this);
    _viewTabs.addListener(() {
      if (!_viewTabs.indexIsChanging) setState(() => _mode = _modeForIndex(_viewTabs.index));
    });
    _load();
  }

  @override
  void dispose() {
    _viewTabs.dispose();
    super.dispose();
  }

  String _modeForIndex(int i) => switch (i) {
        0 => 'day',
        1 => 'week',
        2 => 'month',
        _ => 'agenda',
      };

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await context.read<AppState>().auth.api.get('/api/staff/calendar');
      if (mounted) {
        setState(() {
          _events = (data['events'] as List<dynamic>?) ?? [];
          _holidays = (data['holidays'] as List<dynamic>?) ?? [];
          _leaves = (data['leaves'] as List<dynamic>?) ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<dynamic> _filteredEvents() {
    final now = nowInSriLanka();
    if (_mode == 'day') {
      return _events.where((e) {
        final start = parseApiDateTime((e as Map)['startsAt']?.toString());
        return start != null && isSameCalendarDay(start, now);
      }).toList();
    }
    if (_mode == 'week') {
      final weekEnd = now.add(const Duration(days: 7));
      return _events.where((e) {
        final start = parseApiDateTime((e as Map)['startsAt']?.toString());
        return start != null && start.isBefore(weekEnd) && start.isAfter(now.subtract(const Duration(days: 1)));
      }).toList();
    }
    return _events;
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final filtered = _filteredEvents();

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Calendar'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20))],
        bottom: TabBar(
          controller: _viewTabs,
          tabs: const [
            Tab(text: 'Today'),
            Tab(text: 'Week'),
            Tab(text: 'Month'),
            Tab(text: 'Agenda'),
          ],
        ),
      ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(ConnectSpacing.lg, ConnectSpacing.sm, ConnectSpacing.lg, 0),
                    child: ConnectGlassCard(
                      padding: const EdgeInsets.all(ConnectSpacing.md),
                      child: Row(
                        children: [
                          const Icon(Icons.event_rounded, color: ConnectModuleColors.calendar, size: 24),
                          const SizedBox(width: ConnectSpacing.sm),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(formatDate(nowInSriLanka()), style: Theme.of(context).textTheme.titleMedium),
                                Text('${filtered.length} events · ${_holidays.length} holidays · ${_leaves.length} leave', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ).stitchEntrance(),
                  ),
                  Expanded(
                    child: RefreshIndicator(
                      color: ConnectColors.primary,
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.all(ConnectSpacing.lg),
                        children: [
                          if (_holidays.isNotEmpty) ...[
                            const ConnectSectionHeader(title: 'Public Holidays', padding: EdgeInsets.zero),
                            ..._holidays.take(5).map((h) => _CalendarTile(
                                  icon: Icons.flag_rounded,
                                  color: ConnectColors.warning,
                                  title: (h as Map)['name']?.toString() ?? 'Holiday',
                                  subtitle: h['date']?.toString().split('T').first ?? '',
                                )),
                          ],
                          if (_leaves.isNotEmpty) ...[
                            const ConnectSectionHeader(title: 'Leave & Time Off'),
                            ..._leaves.take(8).map((l) {
                              final item = l as Map<String, dynamic>;
                              return _CalendarTile(
                                icon: Icons.flight_takeoff_rounded,
                                color: ConnectModuleColors.hr,
                                title: item['user']?['fullName']?.toString() ?? 'Leave',
                                subtitle: '${item['startDate']?.toString().split('T').first} → ${item['endDate']?.toString().split('T').first}',
                              );
                            }),
                          ],
                          const ConnectSectionHeader(title: 'Events & Meetings'),
                          if (filtered.isEmpty)
                            const ConnectEmptyState(icon: Icons.calendar_month_outlined, title: 'No events', subtitle: 'Meetings and deadlines will appear here.')
                          else
                            ...filtered.map((e) {
                              final item = e as Map<String, dynamic>;
                              final start = parseApiDateTime(item['startsAt']?.toString());
                              return _CalendarTile(
                                icon: _iconForKind(item['kind']?.toString()),
                                color: ConnectModuleColors.calendar,
                                title: item['title']?.toString() ?? 'Event',
                                subtitle: start != null ? formatDateTime(start) : '',
                                trailing: item['location'] != null ? ConnectChip(label: item['location'].toString(), color: ConnectModuleColors.erp) : null,
                                onTap: () => _showEventDetail(context, item),
                              );
                            }),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  void _showEventDetail(BuildContext context, Map<String, dynamic> item) {
    final start = parseApiDateTime(item['startsAt']?.toString());
    final end = parseApiDateTime(item['endsAt']?.toString());
    showModalBottomSheet(
      context: context,
      backgroundColor: ConnectPalette.of(context).surfaceRaised,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(ConnectSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(item['title']?.toString() ?? 'Event', style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: 8),
            if (start != null) Text('Starts ${formatDateTime(start)}', style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(fontSize: 12)),
            if (end != null) Text('Ends ${formatDateTime(end)}', style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(fontSize: 12)),
            if (item['location'] != null) Text('Location: ${item['location']}', style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(fontSize: 12)),
            if (item['description'] != null) ...[
              const SizedBox(height: 8),
              Text(item['description'].toString(), style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(fontSize: 11)),
            ],
            const SizedBox(height: ConnectSpacing.md),
            ConnectChip(label: item['kind']?.toString() ?? 'EVENT', color: ConnectModuleColors.calendar),
          ],
        ),
      ),
    );
  }

  IconData _iconForKind(String? kind) {
    switch (kind?.toUpperCase()) {
      case 'MEETING':
        return Icons.groups_rounded;
      case 'REMINDER':
        return Icons.notifications_active_outlined;
      case 'LEAVE':
        return Icons.flight_takeoff_rounded;
      default:
        return Icons.event_rounded;
    }
  }
}

class _CalendarTile extends StatelessWidget {
  const _CalendarTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.onTap,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
      child: ConnectCard(
        onTap: onTap,
        padding: const EdgeInsets.all(ConnectSpacing.sm),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(ConnectRadius.sm)),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(width: ConnectSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                  Text(subtitle, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                ],
              ),
            ),
            if (trailing != null) trailing!,
          ],
        ),
      ),
    );
  }
}
