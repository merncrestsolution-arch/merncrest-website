import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';

class EmployeeQrScreen extends StatelessWidget {
  const EmployeeQrScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final user = state.user?['user'] as Map<String, dynamic>?;
    final employee = state.user?['employee'] as Map<String, dynamic>?;
    final name = user?['fullName']?.toString() ?? state.displayName;
    final email = user?['email']?.toString() ?? '';
    final employeeId = employee?['id']?.toString() ?? user?['id']?.toString() ?? '';
    final employeeNumber = employee?['employeeNumber']?.toString() ?? employee?['employeeCode']?.toString() ?? '';
    final department = employee?['department']?.toString() ?? '';
    final payload = 'MERNCREST:EMP:$employeeId:$employeeNumber';

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(title: const Text('Employee QR Card')),
      body: ConnectAmbientBackground(
        child: ListView(
          padding: const EdgeInsets.all(ConnectSpacing.lg),
          children: [
            ConnectGlassCard(
              featured: true,
              child: Column(
                children: [
                  ConnectAvatar(label: name, size: 56),
                  const SizedBox(height: ConnectSpacing.sm),
                  Text(name, style: Theme.of(context).textTheme.titleLarge),
                  Text(email, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                  if (department.isNotEmpty) ConnectChip(label: department, color: ConnectModuleColors.hr),
                  const SizedBox(height: ConnectSpacing.md),
                  Container(
                    padding: const EdgeInsets.all(ConnectSpacing.md),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(ConnectRadius.md),
                    ),
                    child: QrImageView(
                      data: payload,
                      version: QrVersions.auto,
                      size: 200,
                      backgroundColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: ConnectSpacing.sm),
                  Text(employeeNumber.isNotEmpty ? 'ID $employeeNumber' : 'Staff identity', style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 4),
                  SelectableText(payload, style: const TextStyle(fontSize: 9, color: ConnectColors.textMuted)),
                ],
              ),
            ),
            const SizedBox(height: ConnectSpacing.sm),
            ConnectCard(
              padding: const EdgeInsets.all(ConnectSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('How to use', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                  const SizedBox(height: 6),
                  Text(
                    'Show this QR at office kiosks, events, or security checkpoints. Attendance tokens can also be generated from the Attendance module.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
