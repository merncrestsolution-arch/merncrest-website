import 'package:flutter/material.dart';
import 'package:merncrest_connect/config/api_config.dart';
import 'package:merncrest_connect/navigation/module_router.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/utils/navigation_items.dart';
import 'package:merncrest_connect/services/ssl_pinning_service.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_expandable.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

/// Connected platform surfaces — API, sync, and staff module integrations.
class IntegrationsScreen extends StatelessWidget {
  const IntegrationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final sync = state.sync;
    final nav = state.navigation;
    final modules = flattenNavigationGroups(nav);

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(title: const Text('Integrations')),
      body: ConnectAmbientBackground(
        child: ListView(
          padding: const EdgeInsets.all(ConnectSpacing.lg),
          children: [
            ConnectCard(
              featured: true,
              padding: const EdgeInsets.all(ConnectSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('MernCrest Platform', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text('Live connections between Connect and system.merncrest.lk', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                  const SizedBox(height: ConnectSpacing.sm),
                  ConnectStatusRow(items: [
                    ('REST API', ConnectStatusLevel.online),
                    ('SSE Sync', sync?.connected == true ? ConnectStatusLevel.online : ConnectStatusLevel.degraded),
                    ('TLS', SslPinningService.enforced ? ConnectStatusLevel.online : ConnectStatusLevel.degraded),
                  ]),
                ],
              ),
            ),
            const SizedBox(height: ConnectSpacing.sm),
            ConnectInfoField(label: 'API base', value: ApiConfig.baseUrl),
            if (sync?.lastSyncAt != null) ConnectInfoField(label: 'Last sync', value: sync!.lastSyncAt!),
            ConnectInfoField(label: 'SSL pinning', value: SslPinningService.statusLabel()),
            const ConnectSectionHeader(title: 'Staff modules'),
            if (modules.isEmpty)
              const ConnectEmptyState(
                icon: Icons.extension_off_outlined,
                title: 'No module map',
                subtitle: 'Navigation will sync after login.',
              )
            else
              ...modules.map((raw) {
                final m = raw as Map<String, dynamic>;
                final route = m['route']?.toString() ?? m['href']?.toString() ?? '';
                final label = m['label']?.toString() ?? m['title']?.toString() ?? route;
                if (route.isEmpty) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                  child: ConnectModuleRow(
                    title: label,
                    subtitle: route,
                    icon: ModuleRouter.iconForRoute(route),
                    iconColor: ModuleRouter.colorForRoute(route),
                    onTap: () => ModuleRouter.open(context, route, label: label),
                  ),
                );
              }),
            const SizedBox(height: ConnectSpacing.md),
            ConnectCard(
              padding: const EdgeInsets.all(ConnectSpacing.md),
              child: Text(
                'CRM, ERP, chat, and notifications share one identity and audit trail on the MernCrest platform.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
