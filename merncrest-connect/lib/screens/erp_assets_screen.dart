import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class ErpAssetsScreen extends StatefulWidget {
  const ErpAssetsScreen({super.key});

  @override
  State<ErpAssetsScreen> createState() => _ErpAssetsScreenState();
}

class _ErpAssetsScreenState extends State<ErpAssetsScreen> {
  List<dynamic> _assets = [];
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
      final data = await context.read<AppState>().auth.api.get('/api/erp/assets');
      if (mounted) {
        setState(() {
          _assets = (data['assets'] as List<dynamic>?) ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _assets.where((raw) {
      if (_filter == 'all') return true;
      return (raw as Map<String, dynamic>)['status']?.toString() == _filter;
    }).toList();

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('Assets'),
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
                      padding: const EdgeInsets.all(ConnectSpacing.md),
                      child: Text('${_assets.length} registered assets', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                    ),
                    const SizedBox(height: ConnectSpacing.sm),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _chip('All', 'all'),
                          _chip('Available', 'AVAILABLE'),
                          _chip('Assigned', 'ASSIGNED'),
                          _chip('Maintenance', 'MAINTENANCE'),
                        ],
                      ),
                    ),
                    const SizedBox(height: ConnectSpacing.sm),
                    if (filtered.isEmpty)
                      const ConnectEmptyState(icon: Icons.devices_outlined, title: 'No assets', subtitle: 'Asset registry syncs from ERP.')
                    else
                      ...filtered.map((raw) {
                        final a = raw as Map<String, dynamic>;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                          child: ConnectCard(
                            padding: const EdgeInsets.all(ConnectSpacing.sm),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(a['name']?.toString() ?? '', style: const TextStyle(fontSize: 13)),
                                      Text('${a['assetCode'] ?? ''} · ${a['category'] ?? ''}', style: const TextStyle(fontSize: 11)),
                                      if (a['location'] != null) Text(a['location'].toString(), style: const TextStyle(fontSize: 10)),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    if (a['purchaseCents'] != null) Text(formatCurrencyCents(a['purchaseCents']), style: const TextStyle(fontSize: 11)),
                                    ConnectChip(label: a['status']?.toString() ?? '', color: ConnectModuleColors.erp),
                                  ],
                                ),
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

  Widget _chip(String label, String value) {
    final selected = _filter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        label: Text(label, style: const TextStyle(fontSize: 11)),
        selected: selected,
        onSelected: (_) => setState(() => _filter = value),
        selectedColor: ConnectColors.primary.withValues(alpha: 0.25),
        checkmarkColor: ConnectColors.primaryGlow,
      ),
    );
  }
}
