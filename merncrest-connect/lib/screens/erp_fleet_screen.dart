import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class ErpFleetScreen extends StatefulWidget {
  const ErpFleetScreen({super.key});

  @override
  State<ErpFleetScreen> createState() => _ErpFleetScreenState();
}

class _ErpFleetScreenState extends State<ErpFleetScreen> {
  List<dynamic> _orders = [];
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
      final data = await context.read<AppState>().auth.api.get('/api/erp/fsm');
      if (mounted) {
        setState(() {
          _orders = (data['workOrders'] as List<dynamic>?) ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final openStatuses = {'OPEN', 'SCHEDULED', 'IN_PROGRESS'};
    final filtered = _orders.where((raw) {
      final wo = raw as Map<String, dynamic>;
      if (_filter == 'open') return openStatuses.contains(wo['status']?.toString());
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('Fleet & Field'),
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
                            decoration: BoxDecoration(color: ConnectModuleColors.manufacturing.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(ConnectRadius.md)),
                            child: const Icon(Icons.local_shipping_rounded, color: ConnectModuleColors.manufacturing, size: 24),
                          ),
                          const SizedBox(width: ConnectSpacing.sm),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Field Service', style: Theme.of(context).textTheme.titleMedium),
                                Text('${_orders.length} work orders', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
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
                          _chip('Open', 'open'),
                        ],
                      ),
                    ),
                    const SizedBox(height: ConnectSpacing.sm),
                    if (filtered.isEmpty)
                      const ConnectEmptyState(icon: Icons.local_shipping_outlined, title: 'No work orders', subtitle: 'Dispatch jobs sync from FSM.')
                    else
                      ...filtered.map((raw) {
                        final wo = raw as Map<String, dynamic>;
                        final assignee = wo['assignee'] as Map<String, dynamic>?;
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
                                      Text(wo['title']?.toString() ?? wo['workOrderNumber']?.toString() ?? 'Work order', style: const TextStyle(fontSize: 13)),
                                      Text(
                                        [
                                          wo['workOrderNumber']?.toString(),
                                          assignee?['fullName']?.toString(),
                                          wo['priority']?.toString(),
                                        ].whereType<String>().where((s) => s.isNotEmpty).join(' · '),
                                        style: const TextStyle(fontSize: 11),
                                      ),
                                    ],
                                  ),
                                ),
                                ConnectChip(label: wo['status']?.toString() ?? '', color: ConnectModuleColors.manufacturing),
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
