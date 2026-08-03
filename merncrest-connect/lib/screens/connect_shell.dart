import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/screens/data_screens.dart';
import 'package:merncrest_connect/screens/dashboard_screen.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class ConnectShell extends StatefulWidget {
  const ConnectShell({super.key});

  @override
  State<ConnectShell> createState() => _ConnectShellState();
}

class _ConnectShellState extends State<ConnectShell> {
  int _index = 0;

  static const _pages = [
    DashboardScreen(),
    WorkHubScreen(),
    LiveChatScreen(),
    ClientsScreen(),
    MoreScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final role = state.user?['employee']?['jobTitle']?.toString() ?? 'MernCrest Staff';

    return Scaffold(
      backgroundColor: ConnectColors.background,
      body: Column(
        children: [
          ConnectTopBar(
            name: state.displayName,
            role: role,
            notificationCount: state.sync?.unreadNotifications ?? 0,
            onLogout: () => state.logout(),
          ),
          Expanded(child: IndexedStack(index: _index, children: _pages)),
        ],
      ),
      bottomNavigationBar: ConnectBottomNav(
        index: _index,
        onChanged: (i) => setState(() => _index = i),
      ),
    );
  }
}

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final nav = context.watch<AppState>().navigation;
    final groups = (nav?['groups'] as List<dynamic>?) ?? [];

    return ConnectPage(
      title: 'More modules',
      subtitle: 'Billing, projects, helpdesk, and ERP tools',
      child: Column(
        children: [
          for (final g in groups) ...[
            ConnectSectionHeader(title: g['label']?.toString() ?? 'Modules'),
            for (final item in (g['items'] as List<dynamic>? ?? []))
              ConnectModuleRow(
                title: item['label']?.toString() ?? '',
                subtitle: item['route']?.toString() ?? '',
                icon: Icons.widgets_outlined,
                onTap: () {},
              ),
          ],
          if (groups.isEmpty)
            const ConnectEmptyState(
              icon: Icons.apps_outlined,
              title: 'Modules loading',
              subtitle: 'Navigation will appear after sync with the server.',
            ),
        ],
      ),
    );
  }
}
