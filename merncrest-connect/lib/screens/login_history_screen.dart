import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class LoginHistoryScreen extends StatefulWidget {
  const LoginHistoryScreen({super.key});

  @override
  State<LoginHistoryScreen> createState() => _LoginHistoryScreenState();
}

class _LoginHistoryScreenState extends State<LoginHistoryScreen> {
  List<dynamic> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await context.read<AppState>().auth.api.get('/api/portal/profile');
      if (mounted) {
        setState(() {
          _items = (data['loginHistory'] as List<dynamic>?) ?? [];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('Login History'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20))],
      ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : _error != null
                ? ConnectEmptyState(icon: Icons.error_outline, title: 'Could not load', subtitle: _error)
                : _items.isEmpty
                    ? const ConnectEmptyState(icon: Icons.history_rounded, title: 'No sign-ins', subtitle: 'Login activity will appear here.')
                    : RefreshIndicator(
                        color: ConnectColors.primary,
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(ConnectSpacing.lg),
                          itemCount: _items.length,
                          itemBuilder: (context, i) {
                            final item = _items[i] as Map<String, dynamic>;
                            final success = item['success'] == true;
                            final created = DateTime.tryParse(item['createdAt']?.toString() ?? '');
                            return Padding(
                              padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                              child: ConnectCard(
                                padding: const EdgeInsets.all(ConnectSpacing.sm),
                                child: Row(
                                  children: [
                                    Icon(
                                      success ? Icons.check_circle_outline : Icons.error_outline,
                                      color: success ? ConnectColors.success : ConnectColors.error,
                                      size: 20,
                                    ),
                                    const SizedBox(width: ConnectSpacing.sm),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            created != null ? formatDateTime(created) : item['createdAt']?.toString() ?? '',
                                            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13),
                                          ),
                                          Text(
                                            [
                                              item['ipAddress']?.toString(),
                                              item['userAgent']?.toString(),
                                            ].whereType<String>().where((s) => s.isNotEmpty).join(' · '),
                                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 10),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                    ConnectChip(label: success ? 'OK' : 'Failed', color: success ? ConnectColors.success : ConnectColors.error),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
      ),
    );
  }
}
