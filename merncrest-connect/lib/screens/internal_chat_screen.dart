import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

/// Staff internal messaging — general channel + direct messages.
class InternalChatScreen extends StatefulWidget {
  const InternalChatScreen({super.key});

  @override
  State<InternalChatScreen> createState() => _InternalChatScreenState();
}

class _InternalChatScreenState extends State<InternalChatScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  List<dynamic> _messages = [];
  List<dynamic> _staff = [];
  String? _peerId;
  String? _peerName;
  String _channel = 'general';
  bool _loading = true;
  bool _sending = false;
  final _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _tabs.addListener(() {
      if (!_tabs.indexIsChanging) {
        if (_tabs.index == 0) {
          _peerId = null;
          _channel = 'general';
          _load();
        }
      }
    });
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final api = context.read<AppState>().auth.api;
    final path = _peerId != null ? '/api/staff/chat?peerId=$_peerId' : '/api/staff/chat?channel=$_channel';
    try {
      final data = await api.get(path);
      if (!mounted) return;
      setState(() {
        _messages = (data['messages'] as List<dynamic>?) ?? [];
        _staff = (data['staff'] as List<dynamic>?) ?? _staff;
        _channel = data['channel']?.toString() ?? _channel;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    _controller.clear();
    final api = context.read<AppState>().auth.api;
    try {
      await api.post('/api/staff/chat', {
        'body': text,
        if (_peerId != null) 'recipientId': _peerId,
        if (_peerId == null) 'channel': _channel,
      });
      await _load();
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _selectPeer(Map<String, dynamic> peer) {
    _peerId = peer['id']?.toString();
    _peerName = peer['fullName']?.toString();
    _tabs.animateTo(1);
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final me = context.watch<AppState>().user?['id']?.toString();

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Team Chat'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'General'),
            Tab(text: 'Direct'),
          ],
        ),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20))],
      ),
      body: ConnectAmbientBackground(
        child: TabBarView(
          controller: _tabs,
          children: [
            _MessagePane(
              loading: _loading,
              messages: _messages,
              myId: me,
              controller: _controller,
              sending: _sending,
              onSend: _send,
              emptyTitle: 'General channel',
              emptySubtitle: 'Post updates for the whole team.',
            ),
            Column(
              children: [
                if (_peerId == null)
                  Expanded(
                    child: _loading && _staff.isEmpty
                        ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
                        : ListView(
                            padding: const EdgeInsets.all(ConnectSpacing.lg),
                            children: [
                              const ConnectSectionHeader(title: 'Message a colleague'),
                              ..._staff.map((s) {
                                final peer = s as Map<String, dynamic>;
                                if (peer['id']?.toString() == me) return const SizedBox.shrink();
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                                  child: ConnectCard(
                                    onTap: () => _selectPeer(peer),
                                    child: Row(
                                      children: [
                                        ConnectAvatar(label: peer['fullName']?.toString() ?? 'S', size: 40),
                                        const SizedBox(width: ConnectSpacing.sm),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(peer['fullName']?.toString() ?? '', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                              Text(peer['email']?.toString() ?? '', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                                            ],
                                          ),
                                        ),
                                        const Icon(Icons.chevron_right_rounded, size: 18, color: ConnectColors.textMuted),
                                      ],
                                    ),
                                  ),
                                );
                              }),
                            ],
                          ),
                  )
                else
                  Expanded(
                    child: Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(ConnectSpacing.sm),
                          child: ConnectGlassCard(
                            padding: const EdgeInsets.symmetric(horizontal: ConnectSpacing.sm, vertical: ConnectSpacing.xs),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    _peerName ?? 'Colleague',
                                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 12),
                                  ),
                                ),
                                TextButton(onPressed: () { _peerId = null; _peerName = null; _load(); }, child: const Text('Back', style: TextStyle(fontSize: 11))),
                              ],
                            ),
                          ),
                        ),
                        Expanded(
                          child: _MessagePane(
                            loading: _loading,
                            messages: _messages,
                            myId: me,
                            controller: _controller,
                            sending: _sending,
                            onSend: _send,
                            emptyTitle: 'Direct message',
                            emptySubtitle: 'Send a private message.',
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MessagePane extends StatelessWidget {
  const _MessagePane({
    required this.loading,
    required this.messages,
    required this.myId,
    required this.controller,
    required this.sending,
    required this.onSend,
    required this.emptyTitle,
    required this.emptySubtitle,
  });

  final bool loading;
  final List<dynamic> messages;
  final String? myId;
  final TextEditingController controller;
  final bool sending;
  final VoidCallback onSend;
  final String emptyTitle;
  final String emptySubtitle;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);

    return Column(
      children: [
        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
              : messages.isEmpty
                  ? ConnectEmptyState(icon: Icons.chat_outlined, title: emptyTitle, subtitle: emptySubtitle)
                  : ListView.builder(
                      padding: const EdgeInsets.all(ConnectSpacing.lg),
                      itemCount: messages.length,
                      itemBuilder: (context, i) {
                        final m = messages[i] as Map<String, dynamic>;
                        final senderId = m['senderId']?.toString() ?? m['sender']?['id']?.toString();
                        final isMine = senderId == myId;
                        final senderName = m['sender']?['fullName']?.toString() ?? '';
                        return Align(
                          alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                            decoration: BoxDecoration(
                              color: isMine ? ConnectColors.primary.withValues(alpha: 0.22) : palette.surfaceRaised,
                              borderRadius: BorderRadius.circular(ConnectRadius.md),
                              border: Border.all(color: palette.borderSubtle),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (!isMine && senderName.isNotEmpty)
                                  Text(senderName, style: TextStyle(fontSize: 10, color: ConnectColors.primaryGlow)),
                                Text(m['body']?.toString() ?? '', style: TextStyle(color: palette.textPrimary, fontSize: 13)),
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
        Container(
          padding: EdgeInsets.fromLTRB(ConnectSpacing.lg, ConnectSpacing.sm, ConnectSpacing.lg, ConnectSpacing.lg + MediaQuery.of(context).padding.bottom),
          decoration: BoxDecoration(color: palette.surfaceRaised.withValues(alpha: 0.95), border: Border(top: BorderSide(color: palette.borderSubtle))),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  decoration: const InputDecoration(hintText: 'Message team…', isDense: true, border: InputBorder.none),
                  onSubmitted: (_) => onSend(),
                ),
              ),
              IconButton(
                onPressed: sending ? null : onSend,
                icon: sending
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.send_rounded, color: ConnectColors.primary),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
