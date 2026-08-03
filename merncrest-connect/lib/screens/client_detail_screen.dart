import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class ClientDetailScreen extends StatefulWidget {
  const ClientDetailScreen({super.key, required this.clientId, this.preview});
  final String clientId;
  final Map<String, dynamic>? preview;

  @override
  State<ClientDetailScreen> createState() => _ClientDetailScreenState();
}

class _ClientDetailScreenState extends State<ClientDetailScreen> {
  Map<String, dynamic>? _client;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<AppState>().auth.api.get('/api/staff/clients/${widget.clientId}');
      if (mounted) {
        setState(() {
          final payload = data['data'];
          _client = payload is Map<String, dynamic> ? payload : data;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _client = widget.preview;
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _client ?? widget.preview ?? {};
    final stats = c['stats'] as Map<String, dynamic>? ?? {};
    final services = (c['services'] as List<dynamic>?) ?? [];
    final projects = (c['projects'] as List<dynamic>?) ?? [];
    final invoices = (c['invoices'] as List<dynamic>?) ?? [];

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(title: Text(c['fullName']?.toString() ?? c['company']?.toString() ?? 'Client 360')),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : ListView(
                padding: const EdgeInsets.all(ConnectSpacing.lg),
                children: [
                  ConnectGlassCard(
                    featured: true,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            ConnectAvatar(label: c['fullName']?.toString() ?? 'C', size: 48),
                            const SizedBox(width: ConnectSpacing.sm),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(c['fullName']?.toString() ?? '', style: Theme.of(context).textTheme.titleLarge),
                                  Text(c['company']?.toString() ?? '', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
                                  Text(c['email']?.toString() ?? '', style: Theme.of(context).textTheme.labelSmall),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: ConnectSpacing.sm),
                        Wrap(
                          spacing: 6,
                          children: [
                            if (c['customerCode'] != null) ConnectChip(label: c['customerCode'].toString(), color: ConnectModuleColors.crm),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: ConnectSpacing.sm),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: ConnectSpacing.xs,
                    crossAxisSpacing: ConnectSpacing.xs,
                    childAspectRatio: 1.65,
                    children: [
                      ConnectStatTile(label: 'Revenue', value: formatCurrencyCents(stats['totalRevenueCents'] ?? 0), icon: Icons.trending_up_rounded, color: ConnectColors.success, compact: true),
                      ConnectStatTile(label: 'Outstanding', value: formatCurrencyCents(stats['outstandingBalanceCents'] ?? 0), icon: Icons.receipt_long_rounded, color: ConnectColors.warning, compact: true),
                      ConnectStatTile(label: 'Projects', value: '${stats['activeProjects'] ?? projects.length}', icon: Icons.folder_special_rounded, color: ConnectModuleColors.projects, compact: true),
                      ConnectStatTile(label: 'Services', value: '${stats['serviceCount'] ?? services.length}', icon: Icons.cloud_outlined, color: ConnectModuleColors.crm, compact: true),
                    ],
                  ),
                  const ConnectSectionHeader(title: 'Services'),
                  if (services.isEmpty)
                    const ConnectEmptyState(icon: Icons.cloud_off_outlined, title: 'No services', subtitle: 'Domains and hosting appear when activated.')
                  else
                    ...services.take(6).map((s) {
                      final svc = s as Map<String, dynamic>;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                        child: ConnectCard(
                          padding: const EdgeInsets.all(ConnectSpacing.sm),
                          child: Row(
                            children: [
                              const Icon(Icons.dns_outlined, size: 18, color: ConnectModuleColors.crm),
                              const SizedBox(width: 8),
                              Expanded(child: Text(svc['label']?.toString() ?? '', style: const TextStyle(fontSize: 13))),
                              ConnectChip(label: svc['status']?.toString() ?? ''),
                            ],
                          ),
                        ),
                      );
                    }),
                  const ConnectSectionHeader(title: 'Projects'),
                  if (projects.isEmpty)
                    Text('No linked projects', style: Theme.of(context).textTheme.bodyMedium)
                  else
                    ...projects.take(5).map((p) {
                      final proj = p as Map<String, dynamic>;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                        child: ConnectCard(
                          padding: const EdgeInsets.all(ConnectSpacing.sm),
                          child: Text(proj['name']?.toString() ?? '', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                        ),
                      );
                    }),
                  const ConnectSectionHeader(title: 'Recent Invoices'),
                  if (invoices.isEmpty)
                    Text('No invoices', style: Theme.of(context).textTheme.bodyMedium)
                  else
                    ...invoices.take(5).map((inv) {
                      final i = inv as Map<String, dynamic>;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                        child: ConnectCard(
                          padding: const EdgeInsets.all(ConnectSpacing.sm),
                          child: Row(
                            children: [
                              Expanded(child: Text(i['invoiceNumber']?.toString() ?? '', style: const TextStyle(fontSize: 13))),
                              Text(formatCurrencyCents(i['totalCents'] ?? 0), style: const TextStyle(fontSize: 12)),
                            ],
                          ),
                        ),
                      );
                    }),
                ],
              ),
      ),
    );
  }
}
