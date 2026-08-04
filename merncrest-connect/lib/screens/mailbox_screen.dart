import 'package:flutter/material.dart';
import 'package:merncrest_connect/config/api_config.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_expandable.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:url_launcher/url_launcher.dart';

/// Opens the MernCrest mail platform admin (same as web staff mailbox page).
class MailboxScreen extends StatelessWidget {
  const MailboxScreen({super.key});

  String get _mailAdminUrl {
    final base = ApiConfig.baseUrl.replaceAll(RegExp(r'/+$'), '');
    return '$base/mail-platform';
  }

  Future<void> _open(BuildContext context) async {
    final uri = Uri.parse(_mailAdminUrl);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open mail platform')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(title: const Text('Business Email')),
      body: ConnectAmbientBackground(
        child: Padding(
          padding: const EdgeInsets.all(ConnectSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ConnectGlassCard(
                featured: true,
                padding: const EdgeInsets.all(ConnectSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.mail_rounded, color: ConnectColors.primary, size: 32),
                    const SizedBox(height: ConnectSpacing.sm),
                    Text('MernCrest Mail Platform', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 6),
                    Text(
                      'Mailbox provisioning, aliases, and delivery management run in the dedicated mail admin.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12),
                    ),
                    const SizedBox(height: ConnectSpacing.md),
                    ConnectInfoField(label: 'Admin URL', value: _mailAdminUrl),
                  ],
                ),
              ),
              const SizedBox(height: ConnectSpacing.md),
              ConnectCard(
                onTap: () => _open(context),
                child: Row(
                  children: [
                    const Icon(Icons.open_in_new_rounded, color: ConnectColors.primary),
                    const SizedBox(width: ConnectSpacing.sm),
                    Expanded(
                      child: Text('Open mail admin', style: Theme.of(context).textTheme.titleMedium),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
