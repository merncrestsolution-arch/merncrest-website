import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class ErpInventoryScreen extends StatefulWidget {
  const ErpInventoryScreen({super.key});

  @override
  State<ErpInventoryScreen> createState() => _ErpInventoryScreenState();
}

class _ErpInventoryScreenState extends State<ErpInventoryScreen> {
  List<dynamic> _items = [];
  List<dynamic> _lowStock = [];
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
      final data = await context.read<AppState>().auth.api.get('/api/erp/inventory');
      if (mounted) {
        setState(() {
          _items = (data['items'] as List<dynamic>?) ?? [];
          _lowStock = (data['lowStock'] as List<dynamic>?) ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _items.where((raw) {
      final item = raw as Map<String, dynamic>;
      if (_filter == 'low') {
        final qty = item['quantity'] as num? ?? 0;
        final reorder = item['reorderLevel'] as num? ?? 0;
        return qty <= reorder;
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('Inventory'),
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
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: ConnectModuleColors.inventory.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(ConnectRadius.md)),
                            child: const Icon(Icons.inventory_2_rounded, color: ConnectModuleColors.inventory, size: 24),
                          ),
                          const SizedBox(width: ConnectSpacing.sm),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Stock Control', style: Theme.of(context).textTheme.titleMedium),
                                Text('${_items.length} SKUs · ${_lowStock.length} below reorder', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: ConnectSpacing.sm),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _chip('All', 'all'),
                          _chip('Low stock', 'low'),
                        ],
                      ),
                    ),
                    const SizedBox(height: ConnectSpacing.sm),
                    if (filtered.isEmpty)
                      const ConnectEmptyState(icon: Icons.inventory_2_outlined, title: 'No items', subtitle: 'Inventory records sync from ERP.')
                    else
                      ...filtered.map((raw) {
                        final item = raw as Map<String, dynamic>;
                        final qty = item['quantity'] as num? ?? 0;
                        final reorder = item['reorderLevel'] as num? ?? 0;
                        final isLow = qty <= reorder;
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
                                      Text(item['name']?.toString() ?? '', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                      Text('${item['sku'] ?? ''} · ${item['category'] ?? ''}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                                      if (item['location'] != null) Text(item['location'].toString(), style: Theme.of(context).textTheme.labelSmall),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text('$qty units', style: TextStyle(fontSize: 12, color: isLow ? ConnectColors.warning : null)),
                                    if (item['unitCostCents'] != null) Text(formatCurrencyCents(item['unitCostCents']), style: const TextStyle(fontSize: 10)),
                                    if (isLow) ConnectChip(label: 'Low', color: ConnectColors.warning),
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
