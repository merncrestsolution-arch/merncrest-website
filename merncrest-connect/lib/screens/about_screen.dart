import 'package:flutter/material.dart';
import 'package:merncrest_connect/config/api_config.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_expandable.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:package_info_plus/package_info_plus.dart';

class AboutScreen extends StatefulWidget {
  const AboutScreen({super.key});

  @override
  State<AboutScreen> createState() => _AboutScreenState();
}

class _AboutScreenState extends State<AboutScreen> {
  String _version = '';

  @override
  void initState() {
    super.initState();
    PackageInfo.fromPlatform().then((info) {
      if (mounted) setState(() => _version = '${info.version}+${info.buildNumber}');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(title: const Text('About')),
      body: ConnectAmbientBackground(
        child: ListView(
          padding: const EdgeInsets.all(ConnectSpacing.lg),
          children: [
            Center(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Image.asset('assets/images/app_icon.png', width: 88, height: 88),
              ),
            ),
            const SizedBox(height: ConnectSpacing.md),
            Text('MernCrest Connect', textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge),
            Text('Enterprise employee super app', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
            const SizedBox(height: ConnectSpacing.lg),
            ConnectCard(
              padding: const EdgeInsets.all(ConnectSpacing.md),
              child: Column(
                children: [
                  ConnectInfoField(label: 'Version', value: _version.isEmpty ? '—' : _version),
                  ConnectInfoField(label: 'API', value: ApiConfig.baseUrl),
                  const ConnectInfoField(label: 'Publisher', value: 'MernCrest Solutions'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
