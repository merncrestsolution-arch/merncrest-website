import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/providers/theme_provider.dart';
import 'package:merncrest_connect/screens/notifications_screen.dart';
import 'package:merncrest_connect/screens/profile_screen.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _version = '';

  @override
  void initState() {
    super.initState();
    _loadVersion();
  }

  Future<void> _loadVersion() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) setState(() => _version = '${info.version}+${info.buildNumber}');
  }

  @override
  Widget build(BuildContext context) {
    final theme = context.watch<ThemeProvider>();
    final palette = ConnectPalette.of(context);

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(title: const Text('Settings')),
      body: ConnectAmbientBackground(
        child: ListView(
          padding: const EdgeInsets.all(ConnectSpacing.lg),
          children: [
            ConnectSectionHeader(title: 'Appearance'),
            ConnectCard(
              child: Column(
                children: [
                  _SettingTile(
                    icon: Icons.dark_mode_outlined,
                    title: 'Theme',
                    subtitle: theme.modeLabel,
                    trailing: SegmentedButton<ConnectThemeMode>(
                      segments: const [
                        ButtonSegment(value: ConnectThemeMode.light, icon: Icon(Icons.light_mode, size: 16)),
                        ButtonSegment(value: ConnectThemeMode.dark, icon: Icon(Icons.dark_mode, size: 16)),
                        ButtonSegment(value: ConnectThemeMode.amoled, icon: Icon(Icons.contrast, size: 16)),
                      ],
                      selected: {theme.mode},
                      onSelectionChanged: (s) => theme.setMode(s.first),
                      style: ButtonStyle(
                        visualDensity: VisualDensity.compact,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                  ),
                  const Divider(height: 1),
                  _SettingTile(
                    icon: Icons.language_rounded,
                    title: 'Language',
                    subtitle: 'English',
                    onTap: () {},
                  ),
                ],
              ),
            ),
            ConnectSectionHeader(title: 'Account'),
            ConnectModuleRow(
              title: 'Profile',
              subtitle: 'Personal information',
              icon: Icons.person_outline_rounded,
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProfileScreen())),
            ),
            ConnectModuleRow(
              title: 'Notifications',
              subtitle: 'Push · badges · categories',
              icon: Icons.notifications_outlined,
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NotificationsScreen())),
            ),
            ConnectModuleRow(
              title: 'Privacy & Security',
              subtitle: 'Biometric · PIN · sessions',
              icon: Icons.shield_outlined,
              onTap: () {},
            ),
            ConnectSectionHeader(title: 'System'),
            ConnectCard(
              child: Column(
                children: [
                  _SettingTile(icon: Icons.cloud_done_outlined, title: 'Cloud Status', subtitle: 'Connected'),
                  const Divider(height: 1),
                  _SettingTile(icon: Icons.storage_outlined, title: 'Storage', subtitle: 'Local cache'),
                  const Divider(height: 1),
                  _SettingTile(icon: Icons.info_outline_rounded, title: 'Version', subtitle: _version.isEmpty ? 'Loading…' : _version),
                ],
              ),
            ),
            const SizedBox(height: ConnectSpacing.xl),
            ConnectPrimaryButton(
              label: 'Sign out',
              icon: Icons.logout_rounded,
              onPressed: () => context.read<AppState>().logout(),
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingTile extends StatelessWidget {
  const _SettingTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: ConnectColors.primaryGlow, size: 22),
      title: Text(title, style: Theme.of(context).textTheme.titleMedium),
      subtitle: subtitle != null ? Text(subtitle!) : null,
      trailing: trailing ?? (onTap != null ? const Icon(Icons.chevron_right_rounded, color: ConnectColors.textMuted) : null),
      onTap: onTap,
    );
  }
}
