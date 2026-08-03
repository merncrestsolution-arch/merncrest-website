import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/screens/connect_shell.dart';
import 'package:merncrest_connect/screens/login_screen.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/widgets/app_update_gate.dart';
import 'package:provider/provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppState()..bootstrap(),
      child: const MernCrestConnectApp(),
    ),
  );
}

class MernCrestConnectApp extends StatelessWidget {
  const MernCrestConnectApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MernCrest Connect',
      debugShowCheckedModeBanner: false,
      theme: ConnectTheme.light(),
      home: const AppUpdateGate(child: _RootGate()),
    );
  }
}

class _RootGate extends StatelessWidget {
  const _RootGate();

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    if (state.loading) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image(image: AssetImage('assets/images/app_icon.png'), width: 96, height: 96),
              SizedBox(height: 16),
              CircularProgressIndicator(),
              SizedBox(height: 8),
              Text('MernCrest Connect'),
            ],
          ),
        ),
      );
    }

    if (!state.authenticated) {
      return LoginScreen(
        onLogin: (email, password, {turnstileToken}) =>
            state.login(email, password, turnstileToken: turnstileToken),
      );
    }

    return const ConnectShell();
  }
}
