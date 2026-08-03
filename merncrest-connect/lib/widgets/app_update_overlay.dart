import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:merncrest_connect/services/app_update_service.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:url_launcher/url_launcher.dart';

/// Centered in-app update prompt shown when a newer APK is available.
class AppUpdateOverlay extends StatelessWidget {
  const AppUpdateOverlay({
    super.key,
    required this.info,
    this.onDismiss,
  });

  final AppUpdateInfo info;
  final VoidCallback? onDismiss;

  Future<void> _download() async {
    final uri = Uri.parse(info.downloadUrl);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw Exception('Could not open download link');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.55),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 380),
            child: Card(
              elevation: 12,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: Image.asset(
                        'assets/images/app_icon.png',
                        width: 72,
                        height: 72,
                      ),
                    )
                        .animate()
                        .scale(
                          begin: const Offset(0.92, 0.92),
                          end: const Offset(1, 1),
                          duration: 420.ms,
                          curve: Curves.easeOutBack,
                        ),
                    const SizedBox(height: 16),
                    Text(
                      'Update available',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'v${info.localVersion} → v${info.version}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: ConnectColors.textSecondary),
                    ),
                    const SizedBox(height: 16),
                    if (info.releaseNotes.isNotEmpty) ...[
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          "What's new",
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      ...info.releaseNotes.map(
                        (note) => Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(
                                Icons.check_circle_outline,
                                size: 16,
                                color: ConnectColors.primary,
                              ),
                              const SizedBox(width: 8),
                              Expanded(child: Text(note, style: const TextStyle(fontSize: 13))),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _download,
                        icon: const Icon(Icons.download_rounded),
                        label: const Text('Download update'),
                      ),
                    ),
                    if (!info.forceUpdate && onDismiss != null) ...[
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: onDismiss,
                        child: const Text('Later'),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
