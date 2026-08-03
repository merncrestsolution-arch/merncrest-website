import 'package:flutter/material.dart';
import 'package:merncrest_connect/navigation/module_router.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(title: const Text('Help & Support')),
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
                  Text('MernCrest Connect Help', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text('Quick links for staff self-service and IT support.', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                ],
              ),
            ),
            const SizedBox(height: ConnectSpacing.sm),
            ConnectModuleRow(title: 'Helpdesk', subtitle: 'Create or track support tickets', icon: Icons.headset_mic_rounded, iconColor: ConnectModuleColors.helpdesk, onTap: () => ModuleRouter.open(context, '/tickets')),
            ConnectModuleRow(title: 'AIRA Assistant', subtitle: 'Ask about HR, tasks, and operations', icon: Icons.auto_awesome_rounded, iconColor: ConnectModuleColors.ai, onTap: () => ModuleRouter.open(context, '/ai')),
            ConnectModuleRow(title: 'Security', subtitle: 'Biometric, PIN, login history', icon: Icons.shield_outlined, iconColor: ConnectModuleColors.security, onTap: () => ModuleRouter.open(context, '/security')),
            ConnectModuleRow(title: 'Attendance', subtitle: 'Clock, GPS, QR, and face options', icon: Icons.schedule_rounded, iconColor: ConnectModuleColors.attendance, onTap: () => ModuleRouter.open(context, '/attendance')),
          ],
        ),
      ),
    );
  }
}
