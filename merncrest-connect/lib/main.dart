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
      theme: ConnectTheme.dark(),
      darkTheme: ConnectTheme.dark(),
      themeMode: ThemeMode.dark,
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
      return Scaffold(
        backgroundColor: ConnectColors.background,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Image.asset('assets/images/app_icon.png', width: 88, height: 88),
              ),
              const SizedBox(height: 20),
              const CircularProgressIndicator(color: ConnectColors.primary),
              const SizedBox(height: 12),
              Text('MernCrest Connect', style: Theme.of(context).textTheme.titleMedium),
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
