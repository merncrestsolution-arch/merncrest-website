import 'package:flutter/material.dart';
import 'package:merncrest_connect/config/api_config.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/providers/theme_provider.dart';
import 'package:merncrest_connect/screens/settings_screen.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_expandable.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_quick_actions.dart';
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

  String _field(Map<String, dynamic>? map, String key) => map?[key]?.toString() ?? '';

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final state = context.watch<AppState>();
    final theme = context.watch<ThemeProvider>();
    final user = state.user?['user'] as Map<String, dynamic>?;
    final employee = state.user?['employee'] as Map<String, dynamic>?;
    final name = user?['fullName']?.toString() ?? state.displayName;
    final email = user?['email']?.toString() ?? '';
    final department = employee?['department']?.toString() ?? employee?['departmentName']?.toString() ?? '—';
    final jobTitle = employee?['jobTitle']?.toString() ?? 'MernCrest Staff';
    final branch = employee?['branch']?['name']?.toString() ?? 'MernCrest HQ';
    final sync = state.sync;

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, size: 20),
            onPressed: () {},
            tooltip: 'Edit profile',
          ),
        ],
      ),
      body: ConnectAmbientBackground(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(ConnectSpacing.lg, ConnectSpacing.xs, ConnectSpacing.lg, 40),
          children: [
            ConnectGlassCard(
              featured: true,
              padding: const EdgeInsets.all(ConnectSpacing.md),
              child: Row(
                children: [
                  ConnectAvatar(label: name, size: 56),
                  const SizedBox(width: ConnectSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: Theme.of(context).textTheme.titleLarge),
                        Text(jobTitle, style: const TextStyle(color: ConnectColors.primaryGlow, fontSize: 12)),
                        const SizedBox(height: 4),
                        Text(email, style: Theme.of(context).textTheme.labelSmall),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          children: [
                            ConnectChip(label: department, color: ConnectModuleColors.hr),
                            ConnectChip(label: branch, color: ConnectModuleColors.erp),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ).stitchEntrance(),
            const SizedBox(height: ConnectSpacing.sm),
            ConnectHorizontalQuickActions(
              actions: [
                QuickActionItem(icon: Icons.qr_code_2_rounded, label: 'QR Card', color: ConnectModuleColors.security, onTap: () {}),
                QuickActionItem(icon: Icons.download_rounded, label: 'ID Card', color: ConnectModuleColors.docs, onTap: () {}),
                QuickActionItem(icon: Icons.draw_rounded, label: 'Signature', color: ConnectModuleColors.hr, onTap: () {}),
                QuickActionItem(icon: Icons.upload_file_rounded, label: 'Upload', color: ConnectModuleColors.docs, onTap: () {}),
              ],
            ),
            const ConnectSectionHeader(title: 'Employee Profile', padding: EdgeInsets.fromLTRB(0, ConnectSpacing.md, 0, ConnectSpacing.xs)),
            ConnectExpandableSection(
              title: 'Personal Information',
              icon: Icons.person_outline_rounded,
              iconColor: ConnectModuleColors.hr,
              initiallyExpanded: true,
              children: [
                ConnectInfoField(label: 'Employee ID', value: _field(employee, 'employeeNumber'), icon: Icons.badge_outlined),
                ConnectInfoField(label: 'NIC', value: _field(employee, 'nic')),
                ConnectInfoField(label: 'Passport', value: _field(employee, 'passportNo')),
                ConnectInfoField(label: 'Blood Group', value: _field(employee, 'bloodGroup')),
                ConnectInfoField(label: 'Birthday', value: _field(employee, 'dateOfBirth')),
                ConnectInfoField(label: 'Emergency', value: _field(employee, 'emergencyContact')),
              ],
            ),
            ConnectExpandableSection(
              title: 'Employment',
              icon: Icons.work_outline_rounded,
              iconColor: ConnectModuleColors.erp,
              children: [
                ConnectInfoField(label: 'Department', value: department),
                ConnectInfoField(label: 'Branch', value: branch),
                ConnectInfoField(label: 'Designation', value: jobTitle),
                ConnectInfoField(label: 'Manager', value: _field(employee, 'managerName')),
                ConnectInfoField(label: 'Joining Date', value: _field(employee, 'joiningDate')),
                ConnectInfoField(label: 'Employment', value: _field(employee, 'employmentType')),
                ConnectInfoField(label: 'Shift', value: _field(employee, 'shift')),
              ],
            ),
            ConnectExpandableSection(
              title: 'Compensation & Tax',
              icon: Icons.payments_outlined,
              iconColor: ConnectModuleColors.payroll,
              children: [
                ConnectInfoField(label: 'Salary Grade', value: _field(employee, 'salaryGrade')),
                ConnectInfoField(label: 'Bank', value: _field(employee, 'bankName')),
                ConnectInfoField(label: 'Account', value: _field(employee, 'bankAccount')),
                ConnectInfoField(label: 'Tax ID', value: _field(employee, 'taxId')),
              ],
            ),
            ConnectExpandableSection(
              title: 'Skills & Education',
              icon: Icons.school_outlined,
              iconColor: ConnectModuleColors.projects,
              children: [
                ConnectInfoField(label: 'Skills', value: _field(employee, 'skills')),
                ConnectInfoField(label: 'Languages', value: _field(employee, 'languages')),
                ConnectInfoField(label: 'Education', value: _field(employee, 'education')),
                ConnectInfoField(label: 'Certificates', value: _field(employee, 'certificates')),
              ],
            ),
            ConnectExpandableSection(
              title: 'Performance & Leave',
              icon: Icons.insights_outlined,
              iconColor: ConnectColors.success,
              children: [
                ConnectInfoField(label: 'Performance', value: _field(employee, 'performanceRating')),
                ConnectInfoField(label: 'Attendance %', value: _field(employee, 'attendancePercent')),
                ConnectInfoField(label: 'Leave Balance', value: _field(employee, 'leaveBalance')),
              ],
            ),
            ConnectExpandableSection(
              title: 'Company Assets',
              icon: Icons.devices_outlined,
              iconColor: ConnectModuleColors.inventory,
              children: [
                ConnectInfoField(label: 'Laptop', value: _field(employee, 'assetLaptop')),
                ConnectInfoField(label: 'Phone', value: _field(employee, 'assetPhone')),
                ConnectInfoField(label: 'SIM', value: _field(employee, 'assetSim')),
                ConnectInfoField(label: 'Vehicle', value: _field(employee, 'assetVehicle')),
                ConnectInfoField(label: 'ID Card', value: _field(employee, 'idCardNo')),
              ],
            ),
            ConnectExpandableSection(
              title: 'Security & Sessions',
              icon: Icons.shield_outlined,
              iconColor: ConnectModuleColors.security,
              children: [
                ConnectInfoField(label: '2FA', value: user?['twoFactorEnabled'] == true ? 'Enabled' : 'Not enabled', onTap: () {}),
                ConnectInfoField(label: 'Face ID', value: 'Configure in settings', onTap: () => _openSettings(context)),
                ConnectInfoField(label: 'Fingerprint', value: 'Configure in settings', onTap: () => _openSettings(context)),
                ConnectInfoField(label: 'Last Login', value: _field(user, 'lastLoginAt')),
                ConnectInfoField(label: 'Server', value: ApiConfig.baseUrl),
              ],
            ),
            ConnectExpandableSection(
              title: 'Appearance & Language',
              icon: Icons.palette_outlined,
              iconColor: ConnectColors.primary,
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                  child: SegmentedButton<ConnectThemeMode>(
                    segments: const [
                      ButtonSegment(value: ConnectThemeMode.light, label: Text('Light'), icon: Icon(Icons.light_mode_outlined, size: 14)),
                      ButtonSegment(value: ConnectThemeMode.dark, label: Text('Dark'), icon: Icon(Icons.dark_mode_outlined, size: 14)),
                      ButtonSegment(value: ConnectThemeMode.amoled, label: Text('AMOLED'), icon: Icon(Icons.brightness_2_outlined, size: 14)),
                    ],
                    selected: {theme.mode},
                    onSelectionChanged: (s) => theme.setMode(s.first),
                  ),
                ),
                ConnectInfoField(label: 'Language', value: 'English'),
                ConnectInfoField(label: 'Notifications', value: 'Manage in settings', onTap: () => _openSettings(context)),
              ],
            ),
            ConnectExpandableSection(
              title: 'Platform Status',
              icon: Icons.cloud_outlined,
              iconColor: ConnectModuleColors.erp,
              children: [
                ConnectStatusRow(items: [
                  ('API', ConnectStatusLevel.online),
                  ('Sync', sync?.connected == true ? ConnectStatusLevel.online : ConnectStatusLevel.degraded),
                ]),
                const SizedBox(height: 8),
                ConnectInfoField(label: 'App Version', value: _version.isEmpty ? '—' : _version),
                if (sync?.lastSyncAt != null) ConnectInfoField(label: 'Last Sync', value: sync!.lastSyncAt!),
              ],
            ),
            const SizedBox(height: ConnectSpacing.lg),
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

  void _openSettings(BuildContext context) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen()));
  }
}
