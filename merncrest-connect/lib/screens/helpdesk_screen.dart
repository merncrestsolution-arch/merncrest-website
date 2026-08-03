import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class HelpdeskScreen extends StatefulWidget {
  const HelpdeskScreen({super.key});

  @override
  State<HelpdeskScreen> createState() => _HelpdeskScreenState();
}

class _HelpdeskScreenState extends State<HelpdeskScreen> {
  List<dynamic> _tickets = [];
  bool _loading = true;
  String _filter = 'all';
  String _query = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await context.read<AppState>().auth.api.get('/api/tickets');
      if (mounted) {
        setState(() {
          _tickets = (data['tickets'] as List<dynamic>?) ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openCreate() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: ConnectPalette.of(context).surfaceRaised,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(ConnectRadius.xl))),
      builder: (ctx) => _CreateTicketSheet(onCreated: () {
        Navigator.pop(ctx);
        _load();
      }),
    );
  }

  Color _priorityColor(String? p) {
    switch (p?.toUpperCase()) {
      case 'URGENT':
        return ConnectColors.error;
      case 'HIGH':
        return ConnectColors.warning;
      case 'LOW':
        return ConnectColors.info;
      default:
        return ConnectModuleColors.helpdesk;
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final open = _tickets.where((t) => (t as Map)['status']?.toString().toUpperCase() != 'RESOLVED' && (t as Map)['status']?.toString().toUpperCase() != 'CLOSED').length;
    final resolved = _tickets.length - open;

    final filtered = _tickets.where((t) {
      final item = t as Map<String, dynamic>;
      final subject = '${item['subject']} ${item['ticketNumber']}'.toLowerCase();
      if (_query.isNotEmpty && !subject.contains(_query.toLowerCase())) return false;
      final status = item['status']?.toString().toUpperCase() ?? '';
      if (_filter == 'open' && (status == 'RESOLVED' || status == 'CLOSED')) return false;
      if (_filter == 'resolved' && status != 'RESOLVED' && status != 'CLOSED') return false;
      if (_filter == 'urgent' && item['priority']?.toString().toUpperCase() != 'URGENT') return false;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Helpdesk'),
        actions: [
          IconButton(onPressed: _openCreate, icon: const Icon(Icons.add_rounded)),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20)),
        ],
      ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(ConnectSpacing.lg, ConnectSpacing.sm, ConnectSpacing.lg, 0),
                    child: ConnectGlassCard(
                      padding: const EdgeInsets.all(ConnectSpacing.md),
                      child: Row(
                        children: [
                          Expanded(child: ConnectStatTile(label: 'Open', value: '$open', icon: Icons.confirmation_number_outlined, color: ConnectModuleColors.helpdesk, compact: true)),
                          const SizedBox(width: ConnectSpacing.sm),
                          Expanded(child: ConnectStatTile(label: 'Resolved', value: '$resolved', icon: Icons.done_all_rounded, color: ConnectColors.success, compact: true)),
                        ],
                      ),
                    ).stitchEntrance(),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(ConnectSpacing.lg),
                    child: ConnectSearchBar(hint: 'Search tickets…', onChanged: (v) => setState(() => _query = v)),
                  ),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: ConnectSpacing.lg),
                    child: Row(
                      children: [
                        _FilterChip(label: 'All', selected: _filter == 'all', onTap: () => setState(() => _filter = 'all')),
                        _FilterChip(label: 'Open', selected: _filter == 'open', onTap: () => setState(() => _filter = 'open')),
                        _FilterChip(label: 'Resolved', selected: _filter == 'resolved', onTap: () => setState(() => _filter = 'resolved')),
                        _FilterChip(label: 'Urgent', selected: _filter == 'urgent', onTap: () => setState(() => _filter = 'urgent')),
                      ],
                    ),
                  ),
                  Expanded(
                    child: filtered.isEmpty
                        ? const ConnectEmptyState(icon: Icons.headset_mic_outlined, title: 'No tickets', subtitle: 'Create a ticket for support or IT help.')
                        : RefreshIndicator(
                            color: ConnectColors.primary,
                            onRefresh: _load,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(ConnectSpacing.lg),
                              itemCount: filtered.length,
                              itemBuilder: (context, i) {
                                final t = filtered[i] as Map<String, dynamic>;
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                                  child: ConnectCard(
                                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => TicketDetailScreen(ticket: t, onUpdated: _load))),
                                    padding: const EdgeInsets.all(ConnectSpacing.sm),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: _priorityColor(t['priority']?.toString()).withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(ConnectRadius.sm),
                                          ),
                                          child: Icon(Icons.support_agent_rounded, color: _priorityColor(t['priority']?.toString()), size: 18),
                                        ),
                                        const SizedBox(width: ConnectSpacing.sm),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(t['subject']?.toString() ?? 'Ticket', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                              Text(t['ticketNumber']?.toString() ?? '', style: Theme.of(context).textTheme.labelSmall),
                                              const SizedBox(height: 4),
                                              Wrap(
                                                spacing: 6,
                                                children: [
                                                  ConnectChip(label: t['status']?.toString() ?? 'OPEN'),
                                                  if (t['priority'] != null) ConnectChip(label: t['priority'].toString(), color: _priorityColor(t['priority']?.toString())),
                                                  if (t['department'] != null) ConnectChip(label: t['department'].toString(), color: ConnectModuleColors.erp),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                        const Icon(Icons.chevron_right_rounded, size: 18, color: ConnectColors.textMuted),
                                      ],
                                    ),
                                  ).stitchEntrance(delay: Duration(milliseconds: 25 * i)),
                                );
                              },
                            ),
                          ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        label: Text(label, style: const TextStyle(fontSize: 11)),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: ConnectColors.primary.withValues(alpha: 0.25),
        checkmarkColor: ConnectColors.primaryGlow,
      ),
    );
  }
}

class TicketDetailScreen extends StatelessWidget {
  const TicketDetailScreen({super.key, required this.ticket, this.onUpdated});
  final Map<String, dynamic> ticket;
  final VoidCallback? onUpdated;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final messages = (ticket['messages'] as List<dynamic>?) ?? [];

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(title: Text(ticket['ticketNumber']?.toString() ?? 'Ticket')),
      body: ConnectAmbientBackground(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(ConnectSpacing.lg),
              child: ConnectCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(ticket['subject']?.toString() ?? '', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        ConnectChip(label: ticket['status']?.toString() ?? 'OPEN'),
                        ConnectChip(label: ticket['priority']?.toString() ?? 'MEDIUM', color: ConnectColors.warning),
                        ConnectChip(label: ticket['department']?.toString() ?? 'GENERAL', color: ConnectModuleColors.erp),
                      ],
                    ),
                    if (ticket['user'] != null) ...[
                      const SizedBox(height: 8),
                      Text('Customer: ${ticket['user']?['fullName'] ?? ticket['user']?['email'] ?? ''}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
                    ],
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: ConnectSpacing.lg),
              child: Text('Conversation', style: Theme.of(context).textTheme.titleMedium),
            ),
            Expanded(
              child: messages.isEmpty
                  ? const ConnectEmptyState(icon: Icons.chat_bubble_outline, title: 'No messages', subtitle: 'Replies will appear here.')
                  : ListView.builder(
                      padding: const EdgeInsets.all(ConnectSpacing.lg),
                      itemCount: messages.length,
                      itemBuilder: (context, i) {
                        final m = messages[i] as Map<String, dynamic>;
                        final isStaff = m['isStaff'] == true;
                        return Align(
                          alignment: isStaff ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                            decoration: BoxDecoration(
                              color: isStaff ? ConnectColors.primary.withValues(alpha: 0.2) : palette.surfaceRaised,
                              borderRadius: BorderRadius.circular(ConnectRadius.md),
                              border: Border.all(color: palette.borderSubtle),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(m['body']?.toString() ?? '', style: TextStyle(color: palette.textPrimary, fontSize: 13)),
                                if (m['createdAt'] != null) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    DateTime.tryParse(m['createdAt'].toString()) != null
                                        ? formatDateTime(DateTime.parse(m['createdAt'].toString()))
                                        : '',
                                    style: TextStyle(fontSize: 9, color: palette.textMuted),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CreateTicketSheet extends StatefulWidget {
  const _CreateTicketSheet({required this.onCreated});
  final VoidCallback onCreated;

  @override
  State<_CreateTicketSheet> createState() => _CreateTicketSheetState();
}

class _CreateTicketSheetState extends State<_CreateTicketSheet> {
  final _subject = TextEditingController();
  final _body = TextEditingController();
  String _priority = 'MEDIUM';
  String _department = 'GENERAL';
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _subject.dispose();
    _body.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_subject.text.trim().length < 3 || _body.text.trim().length < 5) {
      setState(() => _error = 'Subject and description are required.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await context.read<AppState>().auth.api.post('/api/tickets', {
        'subject': _subject.text.trim(),
        'body': _body.text.trim(),
        'priority': _priority,
        'department': _department,
        'channel': 'PORTAL',
      });
      widget.onCreated();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(ConnectSpacing.lg, ConnectSpacing.md, ConnectSpacing.lg, bottom + ConnectSpacing.lg),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Create Ticket', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: ConnectSpacing.md),
          TextField(controller: _subject, decoration: const InputDecoration(labelText: 'Subject')),
          const SizedBox(height: ConnectSpacing.sm),
          TextField(controller: _body, maxLines: 4, decoration: const InputDecoration(labelText: 'Description')),
          const SizedBox(height: ConnectSpacing.sm),
          DropdownButtonFormField<String>(
            value: _priority,
            decoration: const InputDecoration(labelText: 'Priority'),
            items: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
            onChanged: (v) => setState(() => _priority = v ?? 'MEDIUM'),
          ),
          const SizedBox(height: ConnectSpacing.sm),
          DropdownButtonFormField<String>(
            value: _department,
            decoration: const InputDecoration(labelText: 'Department'),
            items: ['GENERAL', 'TECHNICAL', 'BILLING', 'SALES', 'DOMAIN', 'HOSTING']
                .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                .toList(),
            onChanged: (v) => setState(() => _department = v ?? 'GENERAL'),
          ),
          if (_error != null) ...[
            const SizedBox(height: ConnectSpacing.sm),
            Text(_error!, style: const TextStyle(color: ConnectColors.error, fontSize: 12)),
          ],
          const SizedBox(height: ConnectSpacing.md),
          ConnectPrimaryButton(label: 'Submit Ticket', icon: Icons.send_rounded, loading: _busy, onPressed: _submit),
        ],
      ),
    );
  }
}
