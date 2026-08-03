import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class ErpManufacturingScreen extends StatefulWidget {
  const ErpManufacturingScreen({super.key});

  @override
  State<ErpManufacturingScreen> createState() => _ErpManufacturingScreenState();
}

class _ErpManufacturingScreenState extends State<ErpManufacturingScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  List<dynamic> _boms = [];
  List<dynamic> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await context.read<AppState>().auth.api.get('/api/erp/manufacturing');
      if (mounted) {
        setState(() {
          _boms = (data['boms'] as List<dynamic>?) ?? [];
          _orders = (data['orders'] as List<dynamic>?) ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('Manufacturing'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Production'),
            Tab(text: 'BOMs'),
          ],
        ),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20))],
      ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : TabBarView(
                controller: _tabs,
                children: [
                  _listPane(
                    context,
                    items: _orders,
                    emptyIcon: Icons.precision_manufacturing_outlined,
                    emptyTitle: 'No production orders',
                    builder: (item) => _row(
                      title: item['productName']?.toString() ?? item['orderNumber']?.toString() ?? 'Order',
                      subtitle: '${item['orderNumber'] ?? ''} · Qty ${item['quantity'] ?? 1}',
                      chip: item['status']?.toString(),
                    ),
                  ),
                  _listPane(
                    context,
                    items: _boms,
                    emptyIcon: Icons.list_alt_outlined,
                    emptyTitle: 'No BOMs',
                    builder: (item) => _row(
                      title: item['productName']?.toString() ?? '',
                      subtitle: '${item['bomCode'] ?? ''} · ${(item['lines'] as List?)?.length ?? 0} components',
                      chip: 'BOM',
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _listPane(
    BuildContext context, {
    required List<dynamic> items,
    required IconData emptyIcon,
    required String emptyTitle,
    required Widget Function(Map<String, dynamic> item) builder,
  }) {
    if (items.isEmpty) {
      return ConnectEmptyState(icon: emptyIcon, title: emptyTitle, subtitle: 'Manufacturing data syncs from ERP.');
    }
    return RefreshIndicator(
      color: ConnectColors.primary,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(ConnectSpacing.lg),
        children: [
          ConnectGlassCard(
            padding: const EdgeInsets.all(ConnectSpacing.md),
            child: Text('${items.length} records', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
          ),
          const SizedBox(height: ConnectSpacing.sm),
          ...items.map((raw) {
            final item = raw as Map<String, dynamic>;
            return Padding(
              padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
              child: ConnectCard(padding: const EdgeInsets.all(ConnectSpacing.sm), child: builder(item)),
            );
          }),
        ],
      ),
    );
  }

  Widget _row({required String title, required String subtitle, String? chip}) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 13)),
              Text(subtitle, style: const TextStyle(fontSize: 11)),
            ],
          ),
        ),
        if (chip != null) ConnectChip(label: chip, color: ConnectModuleColors.manufacturing),
      ],
    );
  }
}
