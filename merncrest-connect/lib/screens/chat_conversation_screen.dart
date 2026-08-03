import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class ChatConversationScreen extends StatefulWidget {
  const ChatConversationScreen({super.key, required this.sessionId, required this.preview});
  final String sessionId;
  final Map<String, dynamic> preview;

  @override
  State<ChatConversationScreen> createState() => _ChatConversationScreenState();
}

class _ChatConversationScreenState extends State<ChatConversationScreen> {
  List<dynamic> _messages = [];
  Map<String, dynamic>? _context;
  final _controller = TextEditingController();
  bool _loading = true;
  bool _sending = false;
  bool _acting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final api = context.read<AppState>().auth.api;
    try {
      final results = await Future.wait([
        api.get('/api/chat/conversations/${widget.sessionId}/messages'),
        api.get('/api/staff/chat/inbox/${widget.sessionId}/context'),
      ]);
      if (mounted) {
        setState(() {
          _messages = (results[0]['messages'] as List<dynamic>?) ?? [];
          _context = (results[1]['context'] as Map<String, dynamic>?) ?? results[1];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    _controller.clear();
    try {
      await context.read<AppState>().auth.api.post('/api/chat/conversations/${widget.sessionId}/messages', {
        'message': text,
        'asAgent': true,
      });
      await _load();
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _chatAction(String action) async {
    if (_acting) return;
    setState(() => _acting = true);
    final api = context.read<AppState>().auth.api;
    try {
      final result = await api.patch('/api/staff/chat/inbox', {
        'sessionId': widget.sessionId,
        'action': action,
      });
      if (!mounted) return;
      if (action == 'close') {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Conversation closed')));
        Navigator.of(context).pop();
        return;
      }
      if (action == 'to_ticket') {
        final ticket = result['ticket'] as Map<String, dynamic>?;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Ticket created · ${ticket?['ticketNumber'] ?? ''}')));
      } else if (action == 'to_lead') {
        final lead = result['lead'] as Map<String, dynamic>?;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lead created · ${lead?['leadNumber'] ?? ''}')));
      }
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
      }
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final name = widget.preview['lead']?['fullName']?.toString() ?? 'Visitor';
    final customer = _context?['customer'] as Map<String, dynamic>?;
    final status = widget.preview['status']?.toString() ?? 'OPEN';
    final isClosed = status == 'CLOSED' || status == 'RESOLVED';

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(name, style: const TextStyle(fontSize: 14)),
            Text(status, style: const TextStyle(fontSize: 10)),
          ],
        ),
        actions: [
          if (!isClosed)
            PopupMenuButton<String>(
              enabled: !_acting,
              onSelected: _chatAction,
              itemBuilder: (context) => [
                const PopupMenuItem(value: 'to_ticket', child: Text('Convert to ticket', style: TextStyle(fontSize: 13))),
                const PopupMenuItem(value: 'to_lead', child: Text('Convert to lead', style: TextStyle(fontSize: 13))),
                const PopupMenuItem(value: 'close', child: Text('Close chat', style: TextStyle(fontSize: 13))),
              ],
            ),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20)),
        ],
      ),
      body: ConnectAmbientBackground(
        child: Column(
          children: [
            if (customer != null)
              Padding(
                padding: const EdgeInsets.all(ConnectSpacing.sm),
                child: ConnectGlassCard(
                  padding: const EdgeInsets.all(ConnectSpacing.sm),
                  child: Row(
                    children: [
                      const Icon(Icons.verified_user_rounded, color: ConnectColors.success, size: 18),
                      const SizedBox(width: 8),
                      Expanded(child: Text('Known customer · ${customer['customerCode'] ?? ''}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11))),
                    ],
                  ),
                ),
              ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
                  : _messages.isEmpty
                      ? const ConnectEmptyState(icon: Icons.chat_bubble_outline, title: 'No messages', subtitle: 'Start the conversation below.')
                      : ListView.builder(
                          padding: const EdgeInsets.all(ConnectSpacing.lg),
                          itemCount: _messages.length,
                          itemBuilder: (context, i) {
                            final m = _messages[i] as Map<String, dynamic>;
                            final isStaff = m['role'] == 'AGENT' || m['role'] == 'STAFF' || m['isAgent'] == true;
                            return Align(
                              alignment: isStaff ? Alignment.centerRight : Alignment.centerLeft,
                              child: Container(
                                margin: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                                decoration: BoxDecoration(
                                  color: isStaff ? ConnectColors.primary.withValues(alpha: 0.22) : palette.surfaceRaised,
                                  borderRadius: BorderRadius.circular(ConnectRadius.md),
                                  border: Border.all(color: palette.borderSubtle),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(m['body']?.toString() ?? m['message']?.toString() ?? '', style: TextStyle(color: palette.textPrimary, fontSize: 13)),
                                    if (m['createdAt'] != null)
                                      Text(
                                        DateTime.tryParse(m['createdAt'].toString()) != null ? formatDateTime(DateTime.parse(m['createdAt'].toString())) : '',
                                        style: TextStyle(fontSize: 9, color: palette.textMuted),
                                      ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
            if (!isClosed)
              Container(
                padding: EdgeInsets.fromLTRB(ConnectSpacing.lg, ConnectSpacing.sm, ConnectSpacing.lg, ConnectSpacing.lg + MediaQuery.of(context).padding.bottom),
                decoration: BoxDecoration(color: palette.surfaceRaised.withValues(alpha: 0.95), border: Border(top: BorderSide(color: palette.borderSubtle))),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        decoration: const InputDecoration(hintText: 'Type a message…', isDense: true, border: InputBorder.none),
                        onSubmitted: (_) => _send(),
                      ),
                    ),
                    IconButton(
                      onPressed: _sending ? null : _send,
                      icon: _sending
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.send_rounded, color: ConnectColors.primary),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
