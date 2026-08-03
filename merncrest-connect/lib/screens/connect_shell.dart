import 'package:flutter/material.dart';
import 'package:merncrest_connect/navigation/module_router.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/screens/ai_assistant_screen.dart';
import 'package:merncrest_connect/screens/dashboard_screen.dart';
import 'package:merncrest_connect/screens/data_screens.dart';
import 'package:merncrest_connect/screens/more_screen.dart';
import 'package:merncrest_connect/screens/profile_screen.dart';
import 'package:merncrest_connect/screens/settings_screen.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class ConnectShell extends StatelessWidget {
  const ConnectShell({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final palette = ConnectPalette.of(context);
    final role = state.user?['employee']?['jobTitle']?.toString() ?? 'MernCrest Staff';

    final pages = [
      const DashboardScreen(),
      const WorkHubScreen(),
      const LiveChatScreen(),
      const ClientsScreen(),
      const MoreScreen(),
    ];

    return Scaffold(
      backgroundColor: palette.background,
      floatingActionButton: state.shellTab == 0
          ? ConnectFab(
              icon: Icons.auto_awesome_rounded,
              label: 'AIRA',
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AiAssistantScreen())),
            )
          : null,
      body: Column(
        children: [
          ConnectOfflineBanner(
            online: state.sync?.connected == true,
            pendingMutations: state.sync?.pendingMutations ?? 0,
          ),
          ConnectTopBar(
            name: state.displayName,
            role: role,
            notificationCount: state.sync?.unreadNotifications ?? 0,
            onNotifications: () => ModuleRouter.open(context, '/notifications'),
            onProfile: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProfileScreen())),
            onSettings: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsScreen())),
            onLogout: () => state.logout(),
          ),
          Expanded(child: IndexedStack(index: state.shellTab, children: pages)),
        ],
      ),
      bottomNavigationBar: ConnectBottomNav(index: state.shellTab, onChanged: state.goToShellTab),
    );
  }
}
