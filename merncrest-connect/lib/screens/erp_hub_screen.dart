import 'package:flutter/material.dart';
import 'package:merncrest_connect/navigation/module_router.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/screens/erp_approvals_screen.dart';
import 'package:merncrest_connect/screens/erp_assets_screen.dart';
import 'package:merncrest_connect/screens/erp_fleet_screen.dart';
import 'package:merncrest_connect/screens/erp_inventory_screen.dart';
import 'package:merncrest_connect/screens/erp_manufacturing_screen.dart';
import 'package:merncrest_connect/screens/erp_procurement_screen.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class ErpHubScreen extends StatefulWidget {
  const ErpHubScreen({super.key});

  @override
  State<ErpHubScreen> createState() => _ErpHubScreenState();
}

class _ErpHubScreenState extends State<ErpHubScreen> {
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
      final data = await context.read<AppState>().auth.api.get('/api/erp');
      if (mounted) {
        setState(() {
          _data = data;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _open(Widget screen) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) {
    final stats = _data?['stats'] as Map<String, dynamic>? ?? {};
    final lowStock = (_data?['lowStock'] as List<dynamic>?) ?? [];

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('ERP Hub'),
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
                          Text('Enterprise Operations', style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 4),
                          Text(
                            formatCurrencyCents(stats['netCents'] ?? 0),
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: ConnectColors.success),
                          ),
                          Text(
                            'Net finance · ${stats['organizations'] ?? 0} orgs · ${stats['approvalsPending'] ?? 0} approvals pending',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11),
                          ),
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
                      childAspectRatio: 1.55,
                      children: [
                        ConnectStatTile(label: 'Employees', value: '${stats['employees'] ?? 0}', icon: Icons.people_alt_rounded, color: ConnectModuleColors.hr, compact: true),
                        ConnectStatTile(label: 'Projects', value: '${stats['projects'] ?? 0}', icon: Icons.folder_special_rounded, color: ConnectModuleColors.projects, compact: true),
                        ConnectStatTile(label: 'Inventory', value: '${stats['inventory'] ?? 0}', icon: Icons.inventory_2_rounded, color: ConnectModuleColors.inventory, compact: true),
                        ConnectStatTile(label: 'Work Orders', value: '${stats['workOrders'] ?? 0}', icon: Icons.build_circle_outlined, color: ConnectModuleColors.manufacturing, compact: true),
                      ],
                    ),
                    const ConnectSectionHeader(title: 'Modules'),
                    ConnectModuleRow(
                      title: 'Inventory',
                      subtitle: '${stats['lowStockCount'] ?? 0} low-stock alerts',
                      icon: Icons.inventory_2_rounded,
                      iconColor: ConnectModuleColors.inventory,
                      onTap: () => _open(const ErpInventoryScreen()),
                    ),
                    ConnectModuleRow(
                      title: 'Manufacturing',
                      subtitle: 'BOMs · production orders',
                      icon: Icons.precision_manufacturing_rounded,
                      iconColor: ConnectModuleColors.manufacturing,
                      onTap: () => _open(const ErpManufacturingScreen()),
                    ),
                    ConnectModuleRow(
                      title: 'Purchasing',
                      subtitle: 'Vendors · purchase orders',
                      icon: Icons.shopping_cart_outlined,
                      iconColor: ConnectModuleColors.erp,
                      onTap: () => _open(const ErpProcurementScreen()),
                    ),
                    ConnectModuleRow(
                      title: 'Assets',
                      subtitle: '${stats['assets'] ?? 0} tracked assets',
                      icon: Icons.devices_rounded,
                      iconColor: ConnectModuleColors.erp,
                      onTap: () => _open(const ErpAssetsScreen()),
                    ),
                    ConnectModuleRow(
                      title: 'Fleet & Field',
                      subtitle: 'Work orders · dispatch',
                      icon: Icons.local_shipping_rounded,
                      iconColor: ConnectModuleColors.manufacturing,
                      onTap: () => _open(const ErpFleetScreen()),
                    ),
                    ConnectModuleRow(
                      title: 'Approvals',
                      subtitle: '${stats['approvalsPending'] ?? 0} pending workflows',
                      icon: Icons.approval_rounded,
                      iconColor: ConnectModuleColors.erp,
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ErpApprovalsScreen())),
                    ),
                    ConnectModuleRow(
                      title: 'Finance',
                      subtitle: 'Income ${formatCurrencyCents(stats['incomeCents'] ?? 0)}',
                      icon: Icons.account_balance_wallet_rounded,
                      iconColor: ConnectModuleColors.finance,
                      onTap: () => ModuleRouter.open(context, '/finance'),
                    ),
                    ConnectModuleRow(
                      title: 'Projects',
                      subtitle: 'ERP & service delivery',
                      icon: Icons.folder_special_rounded,
                      iconColor: ConnectModuleColors.projects,
                      onTap: () => ModuleRouter.open(context, '/projects'),
                    ),
                    if (lowStock.isNotEmpty) ...[
                      const ConnectSectionHeader(title: 'Low Stock'),
                      ...lowStock.take(5).map((item) {
                        final m = item as Map<String, dynamic>;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                          child: ConnectCard(
                            padding: const EdgeInsets.all(ConnectSpacing.sm),
                            child: Row(
                              children: [
                                const Icon(Icons.warning_amber_rounded, color: ConnectColors.warning, size: 18),
                                const SizedBox(width: 8),
                                Expanded(child: Text(m['name']?.toString() ?? '', style: const TextStyle(fontSize: 13))),
                                ConnectChip(label: '${m['quantity'] ?? 0} left', color: ConnectColors.warning),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  ],
                ),
              ),
      ),
    );
  }
}
