import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_charts.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class PerformanceScreen extends StatefulWidget {
  const PerformanceScreen({super.key});

  @override
  State<PerformanceScreen> createState() => _PerformanceScreenState();
}

class _PerformanceScreenState extends State<PerformanceScreen> {
  List<dynamic> _reviews = [];
  List<dynamic> _targets = [];
  List<dynamic> _entries = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await context.read<AppState>().auth.api.get('/api/staff/performance');
      if (mounted) {
        setState(() {
          _reviews = (data['reviews'] as List<dynamic>?) ?? [];
          _targets = (data['targets'] as List<dynamic>?) ?? [];
          _entries = (data['entries'] as List<dynamic>?) ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final latestScore = _reviews.isNotEmpty ? (_reviews.first as Map)['overallScore'] ?? (_reviews.first as Map)['selfScore'] : null;

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('Performance'),
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
                          Text('Performance Rating', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 4),
                          Text(latestScore?.toString() ?? '—', style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: ConnectColors.success)),
                          Text('${_reviews.length} reviews · ${_targets.length} KPI targets', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                        ],
                      ),
                    ).stitchEntrance(),
                    if (_entries.isNotEmpty) ...[
                      const ConnectSectionHeader(title: 'KPI Trend', padding: EdgeInsets.fromLTRB(0, ConnectSpacing.md, 0, ConnectSpacing.xs)),
                      ConnectChartCard(
                        title: 'Recent KPI entries',
                        child: ConnectMiniBarChart(
                          values: _entries.take(6).map((e) => ((e as Map)['value'] as num?)?.toDouble() ?? 0).toList().reversed.toList(),
                          labels: List.generate(_entries.take(6).length, (i) => '${i + 1}'),
                          color: ConnectColors.primary,
                          height: 72,
                        ),
                      ),
                    ],
                    const ConnectSectionHeader(title: 'KPI Targets'),
                    if (_targets.isEmpty)
                      const ConnectEmptyState(icon: Icons.track_changes, title: 'No KPI targets', subtitle: 'Goals set by your manager appear here.')
                    else
                      ..._targets.map((t) {
                        final target = t as Map<String, dynamic>;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                          child: ConnectCard(
                            padding: const EdgeInsets.all(ConnectSpacing.sm),
                            child: Row(
                              children: [
                                const Icon(Icons.flag_outlined, color: ConnectModuleColors.projects, size: 18),
                                const SizedBox(width: ConnectSpacing.sm),
                                Expanded(child: Text(target['label']?.toString() ?? target['metricKey']?.toString() ?? 'KPI', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13))),
                                Text('${target['targetValue'] ?? target['target'] ?? '—'}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                        );
                      }),
                    const ConnectSectionHeader(title: 'Reviews'),
                    if (_reviews.isEmpty)
                      const ConnectEmptyState(icon: Icons.insights_outlined, title: 'No reviews yet', subtitle: 'Performance reviews will appear here.')
                    else
                      ..._reviews.map((r) {
                        final review = r as Map<String, dynamic>;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                          child: ConnectCard(
                            padding: const EdgeInsets.all(ConnectSpacing.sm),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(review['periodLabel']?.toString() ?? 'Review', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                Text('Status: ${review['status'] ?? '—'} · Score: ${review['overallScore'] ?? review['selfScore'] ?? '—'}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
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
