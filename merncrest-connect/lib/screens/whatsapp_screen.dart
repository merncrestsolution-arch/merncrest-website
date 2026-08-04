import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

/// WhatsApp CRM inbox — mirrors web `/api/crm/whatsapp`.
class WhatsAppScreen extends StatefulWidget {
  const WhatsAppScreen({super.key});

  @override
  State<WhatsAppScreen> createState() => _WhatsAppScreenState();
}

class _WhatsAppScreenState extends State<WhatsAppScreen> {
  List<dynamic> _conversations = [];
  Map<String, dynamic>? _status;
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
      final data = await context.read<AppState>().auth.api.get('/api/crm/whatsapp');
      if (!mounted) return;
      setState(() {
        _conversations = (data['conversations'] as List<dynamic>?) ?? [];
        _status = (data['status'] as Map<String, dynamic>?) ?? (data['business'] as Map<String, dynamic>?);
        _loading = false;
      });
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
    final connected = _status?['connected'] == true || _status?['status']?.toString() == 'CONNECTED';

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('WhatsApp CRM'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20))],
      ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : _error != null
                ? ConnectEmptyState(icon: Icons.error_outline, title: 'Could not load', subtitle: _error)
                : RefreshIndicator(
                    color: ConnectColors.primary,
                    onRefresh: _load,
                    child: ListView(
                      padding: const EdgeInsets.all(ConnectSpacing.lg),
                      children: [
                        ConnectGlassCard(
                          featured: true,
                          padding: const EdgeInsets.all(ConnectSpacing.md),
                          child: Row(
                            children: [
                              Icon(Icons.chat_rounded, color: connected ? ConnectColors.success : ConnectColors.warning),
                              const SizedBox(width: ConnectSpacing.sm),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('WhatsApp Business', style: Theme.of(context).textTheme.titleMedium),
                                    Text(
                                      connected ? 'Connected' : 'Check connection in admin',
                                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: ConnectSpacing.md),
                        if (_conversations.isEmpty)
                          const ConnectEmptyState(
                            icon: Icons.forum_outlined,
                            title: 'No conversations',
                            subtitle: 'WhatsApp chats will appear when customers message your business number.',
                          )
                        else
                          ..._conversations.map((raw) {
                            final c = raw as Map<String, dynamic>;
                            final phone = c['phone']?.toString() ?? c['waId']?.toString() ?? 'Contact';
                            final name = c['profileName']?.toString() ?? c['customerName']?.toString() ?? phone;
                            final last = c['lastMessageAt']?.toString();
                            return Padding(
                              padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                              child: ConnectCard(
                                child: Row(
                                  children: [
                                    ConnectAvatar(label: name),
                                    const SizedBox(width: ConnectSpacing.sm),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(name, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                          Text(
                                            c['lastMessagePreview']?.toString() ?? phone,
                                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (last != null)
                                      Text(
                                        formatApiDateTime(last),
                                        style: Theme.of(context).textTheme.labelSmall?.copyWith(fontSize: 10),
                                      ),
                                  ],
                                ),
                              ),
                            );
                          }),
                      ],
                    ),
                  ),
      ),
    );
  }
}
