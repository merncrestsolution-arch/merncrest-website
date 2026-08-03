import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
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
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = context.read<AppState>().auth.api;
    try {
      final results = await Future.wait([
        api.get('/api/staff'),
        api.get('/api/staff/command-center'),
      ]);
      if (mounted) {
        setState(() {
          _data = results[0];
          _command = results[1];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final firstName = state.displayName.split(' ').first;
    final ops = _command?['kpis'] as Map<String, dynamic>?;

    return ConnectPage(
      onRefresh: _load,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ConnectCard(
            featured: true,
            gradient: ConnectColors.cardGradient,
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Good day, $firstName', style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: Colors.white)),
                      const SizedBox(height: 4),
                      Text(
                        state.user?['employee']?['jobTitle']?.toString() ?? 'MernCrest Staff',
                        style: const TextStyle(color: ConnectColors.primaryGlow),
                      ),
                      const SizedBox(height: 12),
                      const ConnectChip(label: 'LIVE SYNC', color: ConnectColors.success),
                    ],
                  ),
                ),
                const ConnectAvatar(label: 'MC', size: 52),
              ],
            ),
          ).stitchEntrance(),
          const SizedBox(height: 16),
          if (_loading)
            const Padding(padding: EdgeInsets.all(40), child: Center(child: CircularProgressIndicator(color: ConnectColors.primary)))
          else ...[
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.2,
              children: [
                ConnectStatTile(label: 'Open tickets', value: '${ops?['openTickets'] ?? _data?['ops']?['openTickets'] ?? 0}', icon: Icons.headset_mic_outlined),
                ConnectStatTile(label: 'Live chats', value: '${ops?['liveChats'] ?? _data?['ops']?['liveChats'] ?? 0}', icon: Icons.forum_outlined, color: ConnectColors.accent),
                ConnectStatTile(label: 'My tasks', value: '${_data?['pendingTaskCount'] ?? 0}', icon: Icons.task_alt_outlined, color: ConnectColors.success),
                ConnectStatTile(label: 'New leads', value: '${ops?['newLeads'] ?? _data?['ops']?['newLeads'] ?? 0}', icon: Icons.trending_up_rounded, color: ConnectColors.info),
              ],
            ),
            const ConnectSectionHeader(title: 'Quick actions'),
            SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _QuickPill(icon: Icons.schedule_rounded, label: 'Clock in'),
                  _QuickPill(icon: Icons.task_alt_rounded, label: 'Tasks'),
                  _QuickPill(icon: Icons.forum_rounded, label: 'Chat'),
                  _QuickPill(icon: Icons.groups_rounded, label: 'Clients'),
                ],
              ),
            ),
            const ConnectSectionHeader(title: 'Announcements'),
            ...((_data?['notifications'] as List<dynamic>?) ?? []).take(4).map((n) {
              final item = n as Map<String, dynamic>;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: ConnectCard(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: ConnectColors.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.campaign_outlined, color: ConnectColors.primaryGlow, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item['title']?.toString() ?? '', style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 4),
                            Text(item['body']?.toString() ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodyMedium),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }
}

class _QuickPill extends StatelessWidget {
  const _QuickPill({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: ActionChip(
        avatar: Icon(icon, size: 16, color: ConnectColors.primaryGlow),
        label: Text(label),
        backgroundColor: ConnectColors.surfaceRaised,
        side: const BorderSide(color: ConnectColors.borderSubtle),
        labelStyle: const TextStyle(color: ConnectColors.textPrimary, fontWeight: FontWeight.w600),
        onPressed: () {},
      ),
    );
  }
}
