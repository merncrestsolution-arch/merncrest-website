import 'package:flutter/material.dart';
import 'package:merncrest_connect/config/api_config.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/providers/theme_provider.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _version = '';

  @override
  void initState() {
    super.initState();
    _loadVersion();
  }

  Future<void> _loadVersion() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) setState(() => _version = '${info.version} (${info.buildNumber})');
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final state = context.watch<AppState>();
    final theme = context.watch<ThemeProvider>();
    final user = state.user?['user'] as Map<String, dynamic>?;
    final employee = state.user?['employee'] as Map<String, dynamic>?;
    final name = user?['fullName']?.toString() ?? state.displayName;
    final email = user?['email']?.toString() ?? '';
    final department = employee?['department']?.toString() ?? '—';
    final jobTitle = employee?['jobTitle']?.toString() ?? 'MernCrest Staff';
    final sync = state.sync;

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(title: const Text('Profile & settings')),
      body: ConnectAmbientBackground(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
          children: [
            ConnectCard(
              featured: true,
              child: Row(
                children: [
                  ConnectAvatar(label: name, size: 56),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 2),
                        Text(jobTitle, style: Theme.of(context).textTheme.bodyMedium),
                        const SizedBox(height: 4),
                        Text(email, style: Theme.of(context).textTheme.labelSmall),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const ConnectSectionHeader(title: 'Appearance'),
            ConnectCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Theme', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text('Choose how MernCrest Connect looks on this device', style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 14),
                  SegmentedButton<ConnectThemeMode>(
                    segments: const [
                      ButtonSegment(value: ConnectThemeMode.light, label: Text('Light'), icon: Icon(Icons.light_mode_outlined, size: 16)),
                      ButtonSegment(value: ConnectThemeMode.dark, label: Text('Dark'), icon: Icon(Icons.dark_mode_outlined, size: 16)),
                      ButtonSegment(value: ConnectThemeMode.amoled, label: Text('AMOLED'), icon: Icon(Icons.brightness_2_outlined, size: 16)),
                    ],
                    selected: {theme.mode},
                    onSelectionChanged: (s) => theme.setMode(s.first),
                  ),
                ],
              ),
            ),
            const ConnectSectionHeader(title: 'Platform status'),
            ConnectCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ConnectStatusRow(items: [
                    ('API', ConnectStatusLevel.online),
                    ('Sync', sync?.connected == true ? ConnectStatusLevel.online : ConnectStatusLevel.degraded),
                  ]),
                  const SizedBox(height: 12),
                  _InfoRow(label: 'Server', value: ApiConfig.baseUrl),
                  _InfoRow(label: 'Department', value: department),
                  if (_version.isNotEmpty) _InfoRow(label: 'App version', value: _version),
                  if (sync?.lastSyncAt != null) _InfoRow(label: 'Last sync', value: sync!.lastSyncAt!),
                ],
              ),
            ),
            const SizedBox(height: 24),
            ConnectPrimaryButton(
              label: 'Sign out',
              icon: Icons.logout_rounded,
              onPressed: () {
                state.logout();
                Navigator.of(context).popUntil((r) => r.isFirst);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 110, child: Text(label, style: TextStyle(color: palette.textMuted, fontSize: 13))),
          Expanded(child: Text(value, style: Theme.of(context).textTheme.bodyMedium)),
        ],
      ),
    );
  }
}
