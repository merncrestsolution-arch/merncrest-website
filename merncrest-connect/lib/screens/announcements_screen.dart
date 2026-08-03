import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/api_envelope.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  List<dynamic> _items = [];
  bool _loading = true;
  String _toneFilter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await context.read<AppState>().auth.api.get('/api/staff/announcements');
      if (mounted) {
        setState(() {
          _items = envelopeList(data);
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _toneColor(String? tone) {
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

  IconData _toneIcon(String? tone) {
    switch (tone?.toUpperCase()) {
      case 'WARNING':
        return Icons.warning_amber_rounded;
      case 'SUCCESS':
        return Icons.celebration_outlined;
      case 'PROMO':
        return Icons.local_offer_outlined;
      default:
        return Icons.campaign_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _items.where((a) {
      if (_toneFilter == 'all') return true;
      return (a as Map)['tone']?.toString().toUpperCase() == _toneFilter;
    }).toList();

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('Announcements'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20))],
      ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(ConnectSpacing.lg, ConnectSpacing.sm, ConnectSpacing.lg, 0),
                    child: ConnectGlassCard(
                      child: Row(
                        children: [
                          const Icon(Icons.campaign_rounded, color: ConnectModuleColors.hr, size: 24),
                          const SizedBox(width: ConnectSpacing.sm),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Company News', style: Theme.of(context).textTheme.titleMedium),
                                Text('${filtered.length} updates for staff', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                              ],
                            ),
                          ),
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
                          _Chip(label: 'All', value: 'all', selected: _toneFilter == 'all', onTap: () => setState(() => _toneFilter = 'all')),
                          _Chip(label: 'Info', value: 'INFO', selected: _toneFilter == 'INFO', onTap: () => setState(() => _toneFilter = 'INFO')),
                          _Chip(label: 'Warning', value: 'WARNING', selected: _toneFilter == 'WARNING', onTap: () => setState(() => _toneFilter = 'WARNING')),
                          _Chip(label: 'Success', value: 'SUCCESS', selected: _toneFilter == 'SUCCESS', onTap: () => setState(() => _toneFilter = 'SUCCESS')),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: filtered.isEmpty
                        ? const ConnectEmptyState(icon: Icons.campaign_outlined, title: 'No announcements', subtitle: 'Company updates will appear here.')
                        : RefreshIndicator(
                            color: ConnectColors.primary,
                            onRefresh: _load,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(ConnectSpacing.lg),
                              itemCount: filtered.length,
                              itemBuilder: (context, i) {
                                final a = filtered[i] as Map<String, dynamic>;
                                final tone = a['tone']?.toString();
                                final published = a['publishedAt']?.toString();
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                                  child: ConnectCard(
                                    onTap: () {
                                      final href = a['href']?.toString();
                                      if (href != null && href.isNotEmpty) launchUrl(Uri.parse(href));
                                    },
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(10),
                                          decoration: BoxDecoration(
                                            color: _toneColor(tone).withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(ConnectRadius.sm),
                                          ),
                                          child: Icon(_toneIcon(tone), color: _toneColor(tone), size: 18),
                                        ),
                                        const SizedBox(width: ConnectSpacing.sm),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(a['title']?.toString() ?? '', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                              if (a['body'] != null) Text(a['body'].toString(), maxLines: 3, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
                                              if (published != null) ...[
                                                const SizedBox(height: 4),
                                                Text(
                                                  DateTime.tryParse(published) != null ? formatDateTime(DateTime.parse(published)) : published,
                                                  style: TextStyle(fontSize: 10, color: ConnectPalette.of(context).textMuted),
                                                ),
                                              ],
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ).stitchEntrance(delay: Duration(milliseconds: 25 * i)),
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

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.value, required this.selected, required this.onTap});
  final String label;
  final String value;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(label: Text(label, style: const TextStyle(fontSize: 10)), selected: selected, onSelected: (_) => onTap(), selectedColor: ConnectColors.primary.withValues(alpha: 0.25)),
    );
  }
}
