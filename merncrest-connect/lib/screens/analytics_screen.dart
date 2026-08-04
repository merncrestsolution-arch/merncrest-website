import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/document_viewer.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_charts.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await context.read<AppState>().auth.api.get('/api/staff/command-center');
      if (mounted) setState(() {
        _data = data;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final kpis = _data?['kpis'] as Map<String, dynamic>? ?? {};
    final activities = (_data?['recentActivities'] as List<dynamic>?) ?? [];

    final revenueSeries = [
      (kpis['todayRevenueCents'] as num? ?? 0).toDouble() / 100,
      (kpis['monthRevenueCents'] as num? ?? 0).toDouble() / 100 * 0.3,
      (kpis['monthRevenueCents'] as num? ?? 0).toDouble() / 100 * 0.6,
      (kpis['monthRevenueCents'] as num? ?? 0).toDouble() / 100,
    ];

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('Analytics & Reports'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20))],
      ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : RefreshIndicator(
                color: ConnectColors.primary,
                onRefresh: _load,
                child: ListView(
                  padding: const EdgeInsets.all(ConnectSpacing.lg),
                  children: [
                    ConnectGlassCard(
                      featured: true,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Command Center', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 4),
                          Text(formatCurrencyCents(kpis['monthRevenueCents'] ?? 0), style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: ConnectColors.success)),
                          Text('Monthly revenue · Server ${kpis['serverStatus'] ?? 'online'}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                        ],
                      ),
                    ).stitchEntrance(),
                    const SizedBox(height: ConnectSpacing.sm),
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: ConnectSpacing.xs,
                      crossAxisSpacing: ConnectSpacing.xs,
                      childAspectRatio: 1.65,
                      children: [
                        ConnectStatTile(label: 'Open Tickets', value: '${kpis['openTickets'] ?? 0}', icon: Icons.headset_mic_outlined, color: ConnectModuleColors.helpdesk, compact: true),
                        ConnectStatTile(label: 'New Leads', value: '${kpis['newLeads'] ?? 0}', icon: Icons.leaderboard_rounded, color: ConnectModuleColors.crm, compact: true),
                        ConnectStatTile(label: 'Live Chats', value: '${kpis['liveChats'] ?? 0}', icon: Icons.forum_outlined, color: ConnectModuleColors.chat, compact: true),
                        ConnectStatTile(label: 'Attendance', value: '${kpis['staffAttendanceToday'] ?? 0}', icon: Icons.people_alt_rounded, color: ConnectModuleColors.attendance, compact: true),
                      ],
                    ),
                    const ConnectSectionHeader(title: 'Revenue Trend'),
                    ConnectChartCard(title: 'Performance', child: ConnectSparkline(values: revenueSeries, color: ConnectColors.primary)),
                    const ConnectSectionHeader(title: 'Reports'),
                    ConnectCard(
                      onTap: () => openInAppDocument(context, title: 'Finance summary', apiPath: '/api/staff/reports/finance', filename: 'finance-report.pdf'),
                      padding: const EdgeInsets.all(ConnectSpacing.sm),
                      child: const Row(
                        children: [
                          Icon(Icons.assessment_outlined, color: ConnectModuleColors.finance),
                          SizedBox(width: 8),
                          Expanded(child: Text('Finance summary report', style: TextStyle(fontSize: 13))),
                          Icon(Icons.visibility_rounded, size: 18, color: ConnectColors.textMuted),
                        ],
                      ),
                    ),
                    const ConnectSectionHeader(title: 'Recent Activity'),
                    if (activities.isEmpty)
                      const ConnectEmptyState(icon: Icons.timeline, title: 'No activity', subtitle: 'Platform events will appear here.')
                    else
                      ...activities.take(8).map((a) {
                        final item = a as Map<String, dynamic>;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                          child: ConnectCard(
                            padding: const EdgeInsets.all(ConnectSpacing.sm),
                            child: Row(
                              children: [
                                const Icon(Icons.bolt_rounded, color: ConnectColors.primaryGlow, size: 16),
                                const SizedBox(width: ConnectSpacing.sm),
                                Expanded(child: Text(item['summary']?.toString() ?? '', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis)),
                              ],
                            ),
                          ),
                        );
                      }),
                  ],
                ),
              ),
      ),
    );
  }
}
