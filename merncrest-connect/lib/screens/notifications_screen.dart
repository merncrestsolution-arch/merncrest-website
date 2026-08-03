import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _items = [];
  bool _loading = true;
  int _unread = 0;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      final data = await context.read<AppState>().auth.api.get('/api/staff/notifications');
      if (mounted) {
        setState(() {
          _items = (data['notifications'] as List<dynamic>?) ??
              (data['items'] as List<dynamic>?) ??
              (data['data'] as List<dynamic>?) ??
              [];
          _unread = data['unread'] as int? ?? _items.where((n) => (n as Map)['readAt'] == null).length;
          _loading = false;
        });
      }
    } catch (_) {
      try {
        final api = context.read<AppState>().auth.api;
        final data = await api.get('/api/staff');
        if (mounted) {
          setState(() {
            _items = (data['notifications'] as List<dynamic>?) ?? [];
            _loading = false;
          });
        }
      } catch (_) {
        if (mounted) setState(() => _loading = false);
      }
    }
  }

  Future<void> _markAllRead() async {
    try {
      await context.read<AppState>().auth.api.patch('/api/staff/notifications', {'markAll': true});
      await _load();
    } catch (_) {}
  }

  Future<void> _markRead(String id) async {
    try {
      await context.read<AppState>().auth.api.patch('/api/staff/notifications', {'ids': [id]});
      await _load();
    } catch (_) {}
  }

  IconData _iconForTone(String? tone) {
    switch (tone?.toUpperCase()) {
      case 'WARNING':
        return Icons.warning_amber_rounded;
      case 'SUCCESS':
        return Icons.check_circle_outline_rounded;
      case 'PROMO':
        return Icons.campaign_outlined;
      default:
        return Icons.notifications_active_outlined;
    }
  }

  Color _colorForTone(String? tone) {
    switch (tone?.toUpperCase()) {
      case 'WARNING':
        return ConnectColors.warning;
      case 'SUCCESS':
        return ConnectColors.success;
      case 'PROMO':
        return ConnectColors.accent;
      default:
        return ConnectColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final filtered = _items.where((n) {
      final item = n as Map<String, dynamic>;
      final isRead = item['readAt'] != null;
      if (_filter == 'unread' && isRead) return false;
      if (_filter == 'archive' && !isRead) return false;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: Row(
          children: [
            const Text('Notifications'),
            if (_unread > 0) ...[
              const SizedBox(width: 8),
              ConnectChip(label: '$_unread', color: ConnectColors.accent),
            ],
          ],
        ),
        actions: [
          if (_unread > 0)
            TextButton(onPressed: _markAllRead, child: const Text('Mark all read')),
        ],
      ),
      body: ConnectAmbientBackground(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(ConnectSpacing.lg, ConnectSpacing.sm, ConnectSpacing.lg, 0),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _FilterChip(label: 'All', selected: _filter == 'all', onTap: () => setState(() => _filter = 'all')),
                    _FilterChip(label: 'Unread', selected: _filter == 'unread', onTap: () => setState(() => _filter = 'unread')),
                    _FilterChip(label: 'Archive', selected: _filter == 'archive', onTap: () => setState(() => _filter = 'archive')),
                  ],
                ),
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
                  : filtered.isEmpty
                      ? const ConnectEmptyState(
                          icon: Icons.notifications_none_rounded,
                          title: 'No notifications',
                          subtitle: 'Announcements and alerts will appear here.',
                        )
                      : RefreshIndicator(
                          color: ConnectColors.primary,
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(ConnectSpacing.lg),
                            itemCount: filtered.length,
                            itemBuilder: (context, i) {
                              final item = filtered[i] as Map<String, dynamic>;
                              final title = item['title']?.toString() ?? 'Notification';
                              final body = item['body']?.toString() ?? '';
                              final tone = item['tone']?.toString();
                              final isRead = item['readAt'] != null;
                              final created = item['createdAt']?.toString();
                              DateTime? dt;
                              if (created != null) dt = DateTime.tryParse(created);

                              return Padding(
                                padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                                child: ConnectCard(
                                  onTap: () {
                                    if (!isRead && item['id'] != null) _markRead(item['id'].toString());
                                  },
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: _colorForTone(tone).withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(ConnectRadius.md),
                                        ),
                                        child: Icon(_iconForTone(tone), color: _colorForTone(tone), size: 18),
                                      ),
                                      const SizedBox(width: ConnectSpacing.sm),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              title,
                                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                                    fontSize: 13,
                                                    fontWeight: isRead ? FontWeight.w500 : FontWeight.w700,
                                                  ),
                                            ),
                                            if (body.isNotEmpty) ...[
                                              const SizedBox(height: 4),
                                              Text(body, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12), maxLines: 3, overflow: TextOverflow.ellipsis),
                                            ],
                                            if (dt != null) ...[
                                              const SizedBox(height: 6),
                                              Text(formatDateTime(dt), style: TextStyle(fontSize: 10, color: palette.textMuted)),
                                            ],
                                          ],
                                        ),
                                      ),
                                      if (!isRead) const ConnectChip(label: 'NEW', color: ConnectColors.accent),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
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
        label: Text(label, style: const TextStyle(fontSize: 11)),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: ConnectColors.primary.withValues(alpha: 0.25),
        checkmarkColor: ConnectColors.primaryGlow,
      ),
    );
  }
}
