import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/screens/project_detail_screen.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/api_envelope.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> with SingleTickerProviderStateMixin {
  List<dynamic> _erpProjects = [];
  List<dynamic> _serviceProjects = [];
  bool _loading = true;
  String _filter = 'all';
  late TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final api = context.read<AppState>().auth.api;
    try {
      final results = await Future.wait([
        api.get('/api/staff/projects/progress'),
        api.get('/api/staff/service-projects'),
      ]);
      if (mounted) {
        setState(() {
          _erpProjects = envelopeList(results[0]);
          _serviceProjects = envelopeList(results[1]);
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  int _countStatus(List<dynamic> list, String status) =>
      list.where((p) => (p as Map)['status']?.toString().toUpperCase() == status).length;

  Color _statusColor(String? s) {
    switch (s?.toUpperCase()) {
      case 'ACTIVE':
        return ConnectColors.success;
      case 'ON_HOLD':
        return ConnectColors.warning;
      case 'COMPLETED':
        return ConnectModuleColors.projects;
      case 'CANCELLED':
        return ConnectColors.error;
      default:
        return ConnectColors.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final active = _countStatus(_erpProjects, 'ACTIVE') + _countStatus(_serviceProjects, 'ACTIVE');
    final completed = _countStatus(_erpProjects, 'COMPLETED') + _countStatus(_serviceProjects, 'COMPLETED');
    final onHold = _countStatus(_erpProjects, 'ON_HOLD') + _countStatus(_serviceProjects, 'ON_HOLD');

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Projects'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20))],
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'ERP Progress'),
            Tab(text: 'Service Projects'),
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
                          Expanded(child: _MiniKpi(label: 'Active', value: '$active', color: ConnectColors.success)),
                          Expanded(child: _MiniKpi(label: 'Completed', value: '$completed', color: ConnectModuleColors.projects)),
                          Expanded(child: _MiniKpi(label: 'On Hold', value: '$onHold', color: ConnectColors.warning)),
                        ],
                      ),
                    ).stitchEntrance(),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: ConnectSpacing.lg, vertical: ConnectSpacing.sm),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _FilterChip(label: 'All', selected: _filter == 'all', onTap: () => setState(() => _filter = 'all')),
                          _FilterChip(label: 'Active', selected: _filter == 'ACTIVE', onTap: () => setState(() => _filter = 'ACTIVE')),
                          _FilterChip(label: 'On Hold', selected: _filter == 'ON_HOLD', onTap: () => setState(() => _filter = 'ON_HOLD')),
                          _FilterChip(label: 'Completed', selected: _filter == 'COMPLETED', onTap: () => setState(() => _filter = 'COMPLETED')),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: TabBarView(
                      controller: _tabs,
                      children: [
                        _ErpProjectList(
                          projects: _filtered(_erpProjects),
                          statusColor: _statusColor,
                          onRefresh: _load,
                        ),
                        _ServiceProjectList(
                          projects: _filtered(_serviceProjects),
                          statusColor: _statusColor,
                          onRefresh: _load,
                          onTap: (p) => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => ProjectDetailScreen(projectId: p['id'].toString(), preview: p)),
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

  List<dynamic> _filtered(List<dynamic> list) {
    if (_filter == 'all') return list;
    return list.where((p) => (p as Map)['status']?.toString().toUpperCase() == _filter).toList();
  }
}

class _MiniKpi extends StatelessWidget {
  const _MiniKpi({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(color: color, fontSize: 18)),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.selected, required this.onTap});
  final String label;
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

class _ErpProjectList extends StatelessWidget {
  const _ErpProjectList({required this.projects, required this.statusColor, required this.onRefresh});
  final List<dynamic> projects;
  final Color Function(String?) statusColor;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    if (projects.isEmpty) {
      return const ConnectEmptyState(icon: Icons.folder_special_outlined, title: 'No ERP projects', subtitle: 'Assigned projects will appear here.');
    }
    return RefreshIndicator(
      color: ConnectColors.primary,
      onRefresh: onRefresh,
      child: ListView.builder(
        padding: const EdgeInsets.all(ConnectSpacing.lg),
        itemCount: projects.length,
        itemBuilder: (context, i) {
          final p = projects[i] as Map<String, dynamic>;
          final progress = (p['progressPct'] as num?)?.toDouble() ?? 0;
          return Padding(
            padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
            child: ConnectCard(
              padding: const EdgeInsets.all(ConnectSpacing.sm),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(p['name']?.toString() ?? '', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                            Text(p['projectCode']?.toString() ?? '', style: Theme.of(context).textTheme.labelSmall),
                          ],
                        ),
                      ),
                      ConnectChip(label: p['status']?.toString() ?? '', color: statusColor(p['status']?.toString())),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(ConnectRadius.pill),
                    child: LinearProgressIndicator(value: progress / 100, minHeight: 6, backgroundColor: ConnectPalette.of(context).surfaceOverlay, color: ConnectModuleColors.projects),
                  ),
                  const SizedBox(height: 4),
                  Text('${progress.round()}% · ${p['currentMilestone']?.toString() ?? 'In progress'}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 10)),
                  if (p['client'] != null) Text('Client: ${p['client']?['name'] ?? ''}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 10)),
                ],
              ),
            ).stitchEntrance(delay: Duration(milliseconds: 30 * i)),
          );
        },
      ),
    );
  }
}

class _ServiceProjectList extends StatelessWidget {
  const _ServiceProjectList({required this.projects, required this.statusColor, required this.onRefresh, required this.onTap});
  final List<dynamic> projects;
  final Color Function(String?) statusColor;
  final Future<void> Function() onRefresh;
  final void Function(Map<String, dynamic> p) onTap;

  @override
  Widget build(BuildContext context) {
    if (projects.isEmpty) {
      return const ConnectEmptyState(icon: Icons.folder_open_rounded, title: 'No service projects', subtitle: 'Client service projects sync from billing.');
    }
    return RefreshIndicator(
      color: ConnectColors.primary,
      onRefresh: onRefresh,
      child: ListView.builder(
        padding: const EdgeInsets.all(ConnectSpacing.lg),
        itemCount: projects.length,
        itemBuilder: (context, i) {
          final p = projects[i] as Map<String, dynamic>;
          final client = p['client'] as Map<String, dynamic>?;
          return Padding(
            padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
            child: ConnectCard(
              onTap: () => onTap(p),
              padding: const EdgeInsets.all(ConnectSpacing.sm),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: ConnectModuleColors.projects.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(ConnectRadius.sm)),
                    child: const Icon(Icons.folder_special_rounded, color: ConnectModuleColors.projects, size: 20),
                  ),
                  const SizedBox(width: ConnectSpacing.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(p['name']?.toString() ?? '', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                        Text(client?['company']?.toString() ?? client?['fullName']?.toString() ?? '', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                      ],
                    ),
                  ),
                  ConnectChip(label: p['status']?.toString() ?? '', color: statusColor(p['status']?.toString())),
                  const Icon(Icons.chevron_right_rounded, size: 18, color: ConnectColors.textMuted),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
