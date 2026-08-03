import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/services/offline_api.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class TaskDetailScreen extends StatefulWidget {
  const TaskDetailScreen({super.key, required this.task, this.onUpdated});
  final Map<String, dynamic> task;
  final VoidCallback? onUpdated;

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  final _comment = TextEditingController();
  bool _busy = false;
  String? _error;

  static const _statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _updateStatus(String status) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final state = context.read<AppState>();
      final ok = await patchWithOfflineQueue(state, path: '/api/staff/tasks', body: {
        'taskId': widget.task['id'],
        'action': 'status',
        'status': status,
      });
      if (!ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Offline — status change queued')));
        Navigator.pop(context);
        return;
      }
      widget.onUpdated?.call();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _addComment() async {
    final body = _comment.text.trim();
    if (body.isEmpty) return;
    setState(() => _busy = true);
    try {
      final state = context.read<AppState>();
      final ok = await patchWithOfflineQueue(state, path: '/api/staff/tasks', body: {
        'taskId': widget.task['id'],
        'action': 'comment',
        'body': body,
      });
      if (!ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Offline — comment queued')));
      }
      _comment.clear();
      widget.onUpdated?.call();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Color _priorityColor(String? p) {
    switch (p?.toUpperCase()) {
      case 'URGENT':
      case 'HIGH':
        return ConnectColors.error;
      case 'MEDIUM':
        return ConnectColors.warning;
      default:
        return ConnectColors.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final t = widget.task;
    final children = (t['children'] as List<dynamic>?) ?? [];

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(title: const Text('Task')),
      body: ConnectAmbientBackground(
        child: ListView(
          padding: const EdgeInsets.all(ConnectSpacing.lg),
          children: [
            ConnectCard(
              featured: true,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t['title']?.toString() ?? '', style: Theme.of(context).textTheme.titleLarge),
                  if (t['project']?['name'] != null) ...[
                    const SizedBox(height: 4),
                    Text(t['project']['name'].toString(), style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
                  ],
                  const SizedBox(height: ConnectSpacing.sm),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      ConnectChip(label: t['status']?.toString() ?? 'TODO'),
                      if (t['priority'] != null) ConnectChip(label: t['priority'].toString(), color: _priorityColor(t['priority']?.toString())),
                      if (t['dueDate'] != null) ConnectChip(label: t['dueDate'].toString().split('T').first, color: ConnectModuleColors.calendar),
                    ],
                  ),
                  if (t['description'] != null && t['description'].toString().isNotEmpty) ...[
                    const SizedBox(height: ConnectSpacing.sm),
                    Text(t['description'].toString(), style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ],
              ),
            ),
            const ConnectSectionHeader(title: 'Move to'),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: _statuses.map((s) {
                final selected = t['status']?.toString() == s;
                return FilterChip(
                  label: Text(s.replaceAll('_', ' '), style: const TextStyle(fontSize: 10)),
                  selected: selected,
                  onSelected: selected || _busy ? null : (_) => _updateStatus(s),
                );
              }).toList(),
            ),
            if (children.isNotEmpty) ...[
              const ConnectSectionHeader(title: 'Subtasks'),
              ...children.map((c) {
                final child = c as Map<String, dynamic>;
                return Padding(
                  padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                  child: ConnectCard(
                    padding: const EdgeInsets.all(ConnectSpacing.sm),
                    child: Row(
                      children: [
                        Icon(child['status'] == 'DONE' ? Icons.check_circle_rounded : Icons.radio_button_unchecked, size: 18, color: ConnectColors.success),
                        const SizedBox(width: 8),
                        Expanded(child: Text(child['title']?.toString() ?? '', style: const TextStyle(fontSize: 13))),
                      ],
                    ),
                  ),
                );
              }),
            ],
            const ConnectSectionHeader(title: 'Comments'),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _comment,
                    decoration: const InputDecoration(hintText: 'Add a comment…', isDense: true),
                  ),
                ),
                IconButton(onPressed: _busy ? null : _addComment, icon: const Icon(Icons.send_rounded, color: ConnectColors.primary)),
              ],
            ),
            if (_error != null) Text(_error!, style: const TextStyle(color: ConnectColors.error, fontSize: 12)),
            const SizedBox(height: ConnectSpacing.md),
            ConnectPrimaryButton(
              label: 'Start Pomodoro',
              icon: Icons.timer_rounded,
              onPressed: _busy
                  ? null
                  : () async {
                      await context.read<AppState>().auth.api.patch('/api/staff/tasks', {
                        'taskId': widget.task['id'],
                        'action': 'pomodoro',
                      });
                    },
            ),
          ],
        ),
      ),
    );
  }
}
