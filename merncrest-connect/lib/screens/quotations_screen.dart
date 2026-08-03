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

class QuotationsScreen extends StatefulWidget {
  const QuotationsScreen({super.key});

  @override
  State<QuotationsScreen> createState() => _QuotationsScreenState();
}

class _QuotationsScreenState extends State<QuotationsScreen> {
  List<dynamic> _quotes = [];
  bool _loading = true;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await context.read<AppState>().auth.api.get('/api/quotations');
      if (mounted) {
        setState(() {
          _quotes = (data['quotations'] as List<dynamic>?) ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _statusColor(String? s) {
    switch (s?.toUpperCase()) {
      case 'ACCEPTED':
      case 'WON':
        return ConnectColors.success;
      case 'REJECTED':
      case 'LOST':
        return ConnectColors.error;
      case 'SENT':
        return ConnectColors.info;
      default:
        return ConnectModuleColors.crm;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _quotes.where((q) {
      if (_filter == 'all') return true;
      return (q as Map)['status']?.toString().toUpperCase() == _filter;
    }).toList();
    final totalValue = filtered.fold<num>(0, (s, q) => s + ((q as Map)['totalCents'] as num? ?? 0));

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('Quotations'),
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
                          Expanded(child: ConnectStatTile(label: 'Quotes', value: '${filtered.length}', icon: Icons.request_quote_rounded, color: ConnectModuleColors.crm, compact: true)),
                          const SizedBox(width: ConnectSpacing.sm),
                          Expanded(child: ConnectStatTile(label: 'Pipeline', value: formatCurrencyCents(totalValue), icon: Icons.trending_up_rounded, color: ConnectColors.success, compact: true)),
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
                          _Chip(label: 'All', selected: _filter == 'all', onTap: () => setState(() => _filter = 'all')),
                          _Chip(label: 'Draft', selected: _filter == 'DRAFT', onTap: () => setState(() => _filter = 'DRAFT')),
                          _Chip(label: 'Sent', selected: _filter == 'SENT', onTap: () => setState(() => _filter = 'SENT')),
                          _Chip(label: 'Accepted', selected: _filter == 'ACCEPTED', onTap: () => setState(() => _filter = 'ACCEPTED')),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: filtered.isEmpty
                        ? const ConnectEmptyState(icon: Icons.request_quote_outlined, title: 'No quotations', subtitle: 'Sales quotes will sync from CRM.')
                        : RefreshIndicator(
                            color: ConnectColors.primary,
                            onRefresh: _load,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(ConnectSpacing.lg),
                              itemCount: filtered.length,
                              itemBuilder: (context, i) {
                                final q = filtered[i] as Map<String, dynamic>;
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                                  child: ConnectCard(
                                    padding: const EdgeInsets.all(ConnectSpacing.sm),
                                    child: Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(color: _statusColor(q['status']?.toString()).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(ConnectRadius.sm)),
                                          child: Icon(Icons.description_outlined, color: _statusColor(q['status']?.toString()), size: 18),
                                        ),
                                        const SizedBox(width: ConnectSpacing.sm),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(q['quoteNumber']?.toString() ?? q['title']?.toString() ?? 'Quote', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                              Text(q['lead']?['fullName']?.toString() ?? q['lead']?['interest']?.toString() ?? '', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                                            ],
                                          ),
                                        ),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Text(formatCurrencyCents(q['totalCents'] ?? 0), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                            ConnectChip(label: q['status']?.toString() ?? '', color: _statusColor(q['status']?.toString())),
                                          ],
                                        ),
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

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.selected, required this.onTap});
  final String label;
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
