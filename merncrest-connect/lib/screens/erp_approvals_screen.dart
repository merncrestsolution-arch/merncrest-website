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

class ErpApprovalsScreen extends StatefulWidget {
  const ErpApprovalsScreen({super.key});

  @override
  State<ErpApprovalsScreen> createState() => _ErpApprovalsScreenState();
}

class _ErpApprovalsScreenState extends State<ErpApprovalsScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  List<dynamic> _mine = [];
  List<dynamic> _pending = [];
  List<dynamic> _recent = [];
  Map<String, dynamic>? _stats;
  bool _loading = true;
  String? _actingId;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await context.read<AppState>().auth.api.get('/api/erp/approvals');
      if (mounted) {
        setState(() {
          _mine = (data['mine'] as List<dynamic>?) ?? [];
          _pending = (data['pending'] as List<dynamic>?) ?? [];
          _recent = (data['recent'] as List<dynamic>?) ?? [];
          _stats = data['stats'] as Map<String, dynamic>?;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _decide(String id, String action) async {
    setState(() => _actingId = id);
    try {
      await context.read<AppState>().auth.api.patch('/api/erp/approvals', {'id': id, 'action': action});
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(action == 'approve' ? 'Approved' : 'Rejected')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
      }
    } finally {
      if (mounted) setState(() => _actingId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('Approvals'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Pending'),
            Tab(text: 'My Requests'),
            Tab(text: 'Recent'),
          ],
        ),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20))],
      ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(ConnectSpacing.lg),
                    child: ConnectGlassCard(
                      featured: true,
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Approval Hub', style: Theme.of(context).textTheme.titleMedium),
                                Text(
                                  '${_stats?['pending'] ?? _pending.length} pending · ${_stats?['mineOpen'] ?? 0} mine open',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.approval_rounded, color: ConnectModuleColors.erp, size: 28),
                        ],
                      ),
                    ),
                  ).stitchEntrance(),
                  Expanded(
                    child: TabBarView(
                      controller: _tabs,
                      children: [
                        _list(_pending, showActions: true),
                        _list(_mine),
                        _list(_recent),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _list(List<dynamic> items, {bool showActions = false}) {
    if (items.isEmpty) {
      return const ConnectEmptyState(icon: Icons.approval_outlined, title: 'No approvals', subtitle: 'Workflow requests will appear here.');
    }
    return RefreshIndicator(
      color: ConnectColors.primary,
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: ConnectSpacing.lg),
        itemCount: items.length,
        itemBuilder: (context, i) {
          final item = items[i] as Map<String, dynamic>;
          final status = item['status']?.toString() ?? 'PENDING';
          final acting = _actingId == item['id']?.toString();
          return Padding(
            padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
            child: ConnectCard(
              padding: const EdgeInsets.all(ConnectSpacing.sm),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(item['title']?.toString() ?? '', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                      ),
                      ConnectChip(label: status, color: _statusColor(status)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    [
                      item['requestNumber']?.toString(),
                      item['type']?.toString(),
                      if (item['amountCents'] != null) formatCurrencyCents(item['amountCents'] as num),
                    ].whereType<String>().join(' · '),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11),
                  ),
                  if (item['description'] != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(item['description'].toString(), style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 10), maxLines: 2, overflow: TextOverflow.ellipsis),
                    ),
                  if (showActions && status == 'PENDING') ...[
                    const SizedBox(height: ConnectSpacing.sm),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: acting ? null : () => _decide(item['id'].toString(), 'reject'),
                            child: const Text('Reject', style: TextStyle(fontSize: 12)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: FilledButton(
                            onPressed: acting ? null : () => _decide(item['id'].toString(), 'approve'),
                            child: acting
                                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                                : const Text('Approve', style: TextStyle(fontSize: 12)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'APPROVED':
        return ConnectColors.success;
      case 'REJECTED':
      case 'CANCELLED':
        return ConnectColors.error;
      default:
        return ConnectColors.warning;
    }
  }
}
