import 'package:flutter/material.dart';
import 'package:merncrest_connect/navigation/module_router.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

/// Staff administration shortcuts — ERP hub and permission-gated modules.
class AdminScreen extends StatelessWidget {
  const AdminScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final perms = (context.watch<AppState>().user?['permissions'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [];

    bool has(String p) => perms.contains(p) || perms.any((x) => x.startsWith('erp.'));

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(title: const Text('Administration')),
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
                  Text('Staff administration', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text('Quick access to ERP and ops modules you are permitted to use.', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                ],
              ),
            ),
            const SizedBox(height: ConnectSpacing.sm),
            ConnectModuleRow(title: 'ERP Hub', subtitle: 'Organization operations', icon: Icons.hub_rounded, iconColor: ConnectModuleColors.erp, onTap: () => ModuleRouter.open(context, '/erp')),
            ConnectModuleRow(title: 'Approvals', subtitle: 'Workflow decisions', icon: Icons.approval_rounded, iconColor: ConnectModuleColors.erp, onTap: () => ModuleRouter.open(context, '/approvals')),
            ConnectModuleRow(title: 'Analytics', subtitle: 'Command center KPIs', icon: Icons.analytics_rounded, iconColor: ConnectModuleColors.ai, onTap: () => ModuleRouter.open(context, '/analytics')),
            if (has('erp.hr.manage') || has('erp.hr.view'))
              ConnectModuleRow(title: 'HR (ERP)', subtitle: 'Employee registry', icon: Icons.people_alt_rounded, iconColor: ConnectModuleColors.hr, onTap: () => ModuleRouter.open(context, '/hr')),
            ConnectModuleRow(title: 'Security center', subtitle: 'Biometric, PIN, audit', icon: Icons.shield_outlined, iconColor: ConnectModuleColors.security, onTap: () => ModuleRouter.open(context, '/security')),
            ConnectModuleRow(title: 'Settings', subtitle: 'App preferences', icon: Icons.settings_rounded, iconColor: ConnectModuleColors.settings, onTap: () => ModuleRouter.open(context, '/settings')),
          ],
        ),
      ),
    );
  }
}
