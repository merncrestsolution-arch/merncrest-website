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

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<AppState>().auth.api.get('/api/staff/notifications');
      if (mounted) {
        setState(() {
          _items = (data['notifications'] as List<dynamic>?) ??
              (data['items'] as List<dynamic>?) ??
              (data['data'] as List<dynamic>?) ??
              [];
          _loading = false;
        });
      }
    } catch (_) {
      try {
        final data = await context.read<AppState>().auth.api.get('/api/staff');
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

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(onPressed: () {}, child: const Text('Mark all read')),
        ],
      ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : _items.isEmpty
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
                      itemCount: _items.length,
                      itemBuilder: (context, i) {
                        final item = _items[i] as Map<String, dynamic>;
                        final title = item['title']?.toString() ?? 'Notification';
                        final body = item['body']?.toString() ?? '';
                        final created = item['createdAt']?.toString();
                        DateTime? dt;
                        if (created != null) dt = DateTime.tryParse(created);

                        return Padding(
                          padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                          child: ConnectCard(
                            onTap: () {},
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: ConnectColors.primary.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(ConnectRadius.md),
                                  ),
                                  child: const Icon(Icons.notifications_active_outlined, color: ConnectColors.primaryGlow, size: 18),
                                ),
                                const SizedBox(width: ConnectSpacing.sm),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(title, style: Theme.of(context).textTheme.titleMedium),
                                      if (body.isNotEmpty) ...[
                                        const SizedBox(height: 4),
                                        Text(body, style: Theme.of(context).textTheme.bodyMedium, maxLines: 3, overflow: TextOverflow.ellipsis),
                                      ],
                                      if (dt != null) ...[
                                        const SizedBox(height: 6),
                                        Text(formatDateTime(dt), style: TextStyle(fontSize: 11, color: palette.textMuted)),
                                      ],
                                    ],
                                  ),
                                ),
                                const ConnectChip(label: 'NEW', color: ConnectColors.accent),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
      ),
    );
  }
}
