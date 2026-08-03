import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:provider/provider.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:merncrest_connect/widgets/connect_voice_input.dart';

/// AIRA — Enterprise AI Assistant for MernCrest Connect.
class AiAssistantScreen extends StatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final _controller = TextEditingController();
  final _messages = <_ChatMessage>[
    const _ChatMessage(
      isUser: false,
      text: 'Hello! I\'m AIRA, your MernCrest enterprise assistant. I can help with HR, attendance, projects, CRM, and more. How can I assist you today?',
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _messages.add(_ChatMessage(isUser: true, text: text));
      _controller.clear();
    });

    String reply;
    try {
      final data = await context.read<AppState>().auth.api.post('/api/staff/ai', {
        'prompt': text,
        'category': 'ASSISTANT',
        'locale': context.read<AppState>().user?['user']?['preferredLanguage'] ?? 'en',
      });
      reply = data['reply']?.toString() ?? _generateResponse(text);
    } catch (_) {
      try {
        final data = await context.read<AppState>().auth.api.post('/api/erp/ai', {'prompt': text, 'category': 'ASSISTANT'});
        reply = data['reply']?.toString() ?? data['insight']?['summary']?.toString() ?? _generateResponse(text);
      } catch (_) {
        reply = _generateResponse(text);
      }
    }

    if (!mounted) return;
    setState(() => _messages.add(_ChatMessage(isUser: false, text: reply)));
  }

  String _generateResponse(String input) {
    final q = input.toLowerCase();
    if (q.contains('attendance')) return 'Today\'s attendance data is available on your dashboard. You can clock in/out from Quick Actions or the Attendance module.';
    if (q.contains('leave')) return 'You can apply for leave from Work → Leave. Your balance and approval timeline are shown there.';
    if (q.contains('task') || q.contains('project')) return 'Open the Tasks module for your Kanban board, or Projects from the More tab for full project dashboards.';
    if (q.contains('revenue') || q.contains('sales')) return 'Revenue KPIs are on your executive dashboard. Today\'s and monthly figures sync from the command center.';
    return 'I\'m processing your request. For full AI capabilities, connect AIRA to the MernCrest platform AI service. Try asking about attendance, leave, tasks, or revenue.';
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: ConnectColors.brandGradient,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            const Text('AIRA'),
          ],
        ),
      ),
      body: ConnectAmbientBackground(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(ConnectSpacing.lg, ConnectSpacing.sm, ConnectSpacing.lg, 0),
              child: ConnectGlassCard(
                padding: const EdgeInsets.all(ConnectSpacing.sm),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _SuggestionChip(label: 'My attendance today', onTap: () => _controller.text = 'What is my attendance today?'),
                    _SuggestionChip(label: 'Pending tasks', onTap: () => _controller.text = 'Show my pending tasks'),
                    _SuggestionChip(label: 'Revenue summary', onTap: () => _controller.text = 'Today\'s revenue summary'),
                    _SuggestionChip(label: 'Apply leave', onTap: () => _controller.text = 'How do I apply for leave?'),
                  ],
                ),
              ).stitchEntrance(),
            ),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(ConnectSpacing.lg),
                itemCount: _messages.length,
                itemBuilder: (context, i) {
                  final msg = _messages[i];
                  return Align(
                    alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                      decoration: BoxDecoration(
                        color: msg.isUser ? ConnectColors.primary.withValues(alpha: 0.25) : palette.surfaceRaised,
                        borderRadius: BorderRadius.circular(ConnectRadius.lg),
                        border: Border.all(color: msg.isUser ? ConnectColors.primary.withValues(alpha: 0.4) : palette.borderSubtle),
                      ),
                      child: Text(msg.text, style: TextStyle(color: palette.textPrimary, fontSize: 14, height: 1.4)),
                    ),
                  ).stitchEntrance(delay: Duration(milliseconds: 40 * i));
                },
              ),
            ),
            Container(
              padding: EdgeInsets.fromLTRB(ConnectSpacing.lg, ConnectSpacing.sm, ConnectSpacing.lg, ConnectSpacing.lg + MediaQuery.of(context).padding.bottom),
              decoration: BoxDecoration(
                color: palette.surfaceRaised.withValues(alpha: 0.95),
                border: Border(top: BorderSide(color: palette.borderSubtle)),
              ),
              child: Row(
                children: [
                  ConnectVoiceInputButton(controller: _controller, onFinal: _send),
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: const InputDecoration(
                        hintText: 'Ask AIRA anything…',
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 12),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  IconButton(
                    onPressed: _send,
                    icon: const Icon(Icons.send_rounded, color: ConnectColors.primary),
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

class _ChatMessage {
  const _ChatMessage({required this.isUser, required this.text});
  final bool isUser;
  final String text;
}

class _SuggestionChip extends StatelessWidget {
  const _SuggestionChip({required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      label: Text(label, style: const TextStyle(fontSize: 11)),
      backgroundColor: ConnectColors.primary.withValues(alpha: 0.12),
      side: BorderSide(color: ConnectColors.primary.withValues(alpha: 0.3)),
      onPressed: onTap,
    );
  }
}
