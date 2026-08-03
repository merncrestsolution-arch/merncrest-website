import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class ErpProcurementScreen extends StatefulWidget {
  const ErpProcurementScreen({super.key});

  @override
  State<ErpProcurementScreen> createState() => _ErpProcurementScreenState();
}

class _ErpProcurementScreenState extends State<ErpProcurementScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  List<dynamic> _vendors = [];
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
      final data = await context.read<AppState>().auth.api.get('/api/erp/procurement');
      if (mounted) {
        setState(() {
          _vendors = (data['vendors'] as List<dynamic>?) ?? [];
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
        title: const Text('Purchasing'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Purchase Orders'),
            Tab(text: 'Vendors'),
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
                  _ordersList(),
                  _vendorsList(),
                ],
              ),
      ),
    );
  }

  Widget _ordersList() {
    if (_orders.isEmpty) {
      return const ConnectEmptyState(icon: Icons.shopping_cart_outlined, title: 'No purchase orders', subtitle: 'POs sync from procurement.');
    }
    return RefreshIndicator(
      color: ConnectColors.primary,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(ConnectSpacing.lg),
        children: _orders.map((raw) {
          final po = raw as Map<String, dynamic>;
          final vendor = po['vendor'] as Map<String, dynamic>?;
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
                        Text(po['poNumber']?.toString() ?? 'PO', style: const TextStyle(fontSize: 13)),
                        Text(po['description']?.toString() ?? vendor?['name']?.toString() ?? '', style: const TextStyle(fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(formatCurrencyCents(po['amountCents'] ?? 0), style: const TextStyle(fontSize: 12)),
                      ConnectChip(label: po['status']?.toString() ?? '', color: ConnectModuleColors.erp),
                    ],
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _vendorsList() {
    if (_vendors.isEmpty) {
      return const ConnectEmptyState(icon: Icons.store_outlined, title: 'No vendors', subtitle: 'Vendor master syncs from ERP.');
    }
    return RefreshIndicator(
      color: ConnectColors.primary,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(ConnectSpacing.lg),
        children: _vendors.map((raw) {
          final v = raw as Map<String, dynamic>;
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
                        Text(v['name']?.toString() ?? '', style: const TextStyle(fontSize: 13)),
                        Text(v['email']?.toString() ?? v['phone']?.toString() ?? '', style: const TextStyle(fontSize: 11)),
                      ],
                    ),
                  ),
                  if (v['vendorCode'] != null) ConnectChip(label: v['vendorCode'].toString()),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
