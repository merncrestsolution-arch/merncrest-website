import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/screens/erp_project_detail_screen.dart';
import 'package:merncrest_connect/utils/document_viewer.dart';
import 'package:merncrest_connect/screens/invoice_detail_screen.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/api_envelope.dart';
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
      final data = await context.read<AppState>().auth.api.get('/api/staff/clients/${widget.clientId}');
      if (mounted) {
        setState(() {
          _client = envelopeData(data) ?? (data['data'] is Map ? Map<String, dynamic>.from(data['data'] as Map) : null);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _client = widget.preview;
          _loading = false;
        });
      }
    }
  }

  Future<void> _createProject({bool thenAddService = false}) async {
    final c = _client;
    if (c == null) return;
    final nameCtrl = TextEditingController(text: c['company']?.toString() ?? c['fullName']?.toString() ?? 'Client project');
    bool submitting = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: ConnectPalette.of(context).surface,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
            ConnectSpacing.lg,
            ConnectSpacing.md,
            ConnectSpacing.lg,
            MediaQuery.of(ctx).viewInsets.bottom + ConnectSpacing.lg,
          ),
          child: StatefulBuilder(
            builder: (context, setSheetState) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Create project', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: ConnectSpacing.sm),
                  TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Project name')),
                  const SizedBox(height: ConnectSpacing.md),
                  ConnectPrimaryButton(
                    label: submitting ? 'Creating…' : 'Create project',
                    icon: Icons.folder_special_rounded,
                    onPressed: submitting
                        ? null
                        : () async {
                            final name = nameCtrl.text.trim();
                            if (name.length < 2) {
                              ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Name must be at least 2 characters')));
                              return;
                            }
                            setSheetState(() => submitting = true);
                            try {
                              await context.read<AppState>().auth.api.post(
                                '/api/staff/clients/${widget.clientId}/projects',
                                {'name': name, 'status': 'ACTIVE'},
                              );
                              if (Navigator.of(ctx).canPop()) Navigator.of(ctx).pop();
                              await _load();
                              if (mounted) {
                                ScaffoldMessenger.of(this.context).showSnackBar(const SnackBar(content: Text('Project created')));
                                if (thenAddService) _addService();
                              }
                            } catch (e) {
                              setSheetState(() => submitting = false);
                              ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(e.toString())));
                            }
                          },
                  ),
                ],
              );
            },
          ),
        );
      },
    );
    nameCtrl.dispose();
  }

  Future<void> _addService() async {
    final c = _client;
    if (c == null) return;
    final projects = (c['projects'] as List<dynamic>?) ?? [];
    if (projects.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Create a project first to attach services')));
      await _createProject(thenAddService: true);
      return;
    }

    String projectId = projects.first['id']?.toString() ?? '';
    String serviceType = 'HOSTING';
    String billingCycle = 'ANNUAL';
    final notesCtrl = TextEditingController();
    bool submitting = false;

    const serviceTypes = [
      ('DOMAIN_REGISTRATION', 'Domain registration'),
      ('HOSTING', 'Hosting'),
      ('EMAIL_HOSTING', 'Email hosting'),
      ('SSL_CERTIFICATE', 'SSL certificate'),
      ('SECURITY', 'Security'),
      ('CLOUD_SERVICE', 'Cloud service'),
      ('MAINTENANCE', 'Maintenance'),
      ('BACKUP', 'Backup'),
      ('OTHER', 'Other'),
    ];

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: ConnectPalette.of(context).surface,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
            ConnectSpacing.lg,
            ConnectSpacing.md,
            ConnectSpacing.lg,
            MediaQuery.of(ctx).viewInsets.bottom + ConnectSpacing.lg,
          ),
          child: StatefulBuilder(
            builder: (context, setSheetState) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Add service', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: ConnectSpacing.sm),
                  DropdownButtonFormField<String>(
                    initialValue: projectId,
                    decoration: const InputDecoration(labelText: 'Project'),
                    items: projects.map((p) {
                      final proj = p as Map<String, dynamic>;
                      return DropdownMenuItem(
                        value: proj['id']?.toString() ?? '',
                        child: Text(proj['name']?.toString() ?? proj['projectCode']?.toString() ?? 'Project'),
                      );
                    }).toList(),
                    onChanged: (v) => setSheetState(() => projectId = v ?? projectId),
                  ),
                  const SizedBox(height: ConnectSpacing.sm),
                  DropdownButtonFormField<String>(
                    initialValue: serviceType,
                    decoration: const InputDecoration(labelText: 'Service type'),
                    items: serviceTypes
                        .map((e) => DropdownMenuItem(value: e.$1, child: Text(e.$2)))
                        .toList(),
                    onChanged: (v) => setSheetState(() => serviceType = v ?? serviceType),
                  ),
                  const SizedBox(height: ConnectSpacing.sm),
                  DropdownButtonFormField<String>(
                    initialValue: billingCycle,
                    decoration: const InputDecoration(labelText: 'Billing cycle'),
                    items: const [
                      DropdownMenuItem(value: 'MONTHLY', child: Text('Monthly')),
                      DropdownMenuItem(value: 'QUARTERLY', child: Text('Quarterly')),
                      DropdownMenuItem(value: 'ANNUAL', child: Text('Annual')),
                      DropdownMenuItem(value: 'ONE_TIME', child: Text('One time')),
                    ],
                    onChanged: (v) => setSheetState(() => billingCycle = v ?? billingCycle),
                  ),
                  const SizedBox(height: ConnectSpacing.sm),
                  TextField(
                    controller: notesCtrl,
                    decoration: const InputDecoration(labelText: 'Notes (optional)'),
                    maxLines: 2,
                  ),
                  const SizedBox(height: ConnectSpacing.md),
                  ConnectPrimaryButton(
                    label: submitting ? 'Adding…' : 'Add service',
                    icon: Icons.add_rounded,
                    onPressed: submitting
                        ? null
                        : () async {
                            if (projectId.isEmpty) return;
                            setSheetState(() => submitting = true);
                            try {
                              await context.read<AppState>().auth.api.post(
                                '/api/staff/projects/$projectId/services',
                                {
                                  'serviceType': serviceType,
                                  'startDate': DateTime.now().toUtc().toIso8601String(),
                                  'billingCycle': billingCycle,
                                  if (notesCtrl.text.trim().isNotEmpty) 'notes': notesCtrl.text.trim(),
                                },
                              );
                              if (Navigator.of(ctx).canPop()) Navigator.of(ctx).pop();
                              await _load();
                              if (mounted) {
                                ScaffoldMessenger.of(this.context).showSnackBar(const SnackBar(content: Text('Service added')));
                              }
                            } catch (e) {
                              setSheetState(() => submitting = false);
                              ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(e.toString())));
                            }
                          },
                  ),
                ],
              );
            },
          ),
        );
      },
    );
    notesCtrl.dispose();
  }

  Future<void> _createInvoice() async {
    final c = _client;
    if (c == null) return;
    final userId = c['id']?.toString() ?? widget.clientId;
    final descCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    bool submitting = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: ConnectPalette.of(context).surface,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
            ConnectSpacing.lg,
            ConnectSpacing.md,
            ConnectSpacing.lg,
            MediaQuery.of(ctx).viewInsets.bottom + ConnectSpacing.lg,
          ),
          child: StatefulBuilder(
            builder: (context, setSheetState) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Create invoice', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: ConnectSpacing.sm),
                  TextField(
                    controller: descCtrl,
                    decoration: const InputDecoration(labelText: 'Description'),
                  ),
                  const SizedBox(height: ConnectSpacing.sm),
                  TextField(
                    controller: amountCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Amount (LKR)'),
                  ),
                  const SizedBox(height: ConnectSpacing.md),
                  ConnectPrimaryButton(
                    label: submitting ? 'Creating…' : 'Create & send',
                    icon: Icons.receipt_long_rounded,
                    onPressed: submitting
                        ? null
                        : () async {
                            final desc = descCtrl.text.trim();
                            final parsed = double.tryParse(amountCtrl.text.replaceAll(',', ''));
                            if (desc.isEmpty || parsed == null || parsed <= 0) {
                              ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Enter description and amount')));
                              return;
                            }
                            final cents = (parsed * 100).round();
                            setSheetState(() => submitting = true);
                            try {
                              final res = await context.read<AppState>().auth.api.post(
                                '/api/staff/invoices',
                                {
                                  'userId': userId,
                                  'status': 'SENT',
                                  'lineItems': [
                                    {'description': desc, 'qty': 1, 'unitCents': cents},
                                  ],
                                },
                              );
                              final invoice = envelopeData(res);
                              if (Navigator.of(ctx).canPop()) Navigator.of(ctx).pop();
                              await _load();
                              if (mounted && invoice != null) {
                                Navigator.of(this.context).push(
                                  MaterialPageRoute(
                                    builder: (_) => InvoiceDetailScreen(invoiceId: invoice['id']?.toString(), invoice: invoice),
                                  ),
                                );
                              }
                            } catch (e) {
                              setSheetState(() => submitting = false);
                              ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(e.toString())));
                            }
                          },
                  ),
                ],
              );
            },
          ),
        );
      },
    );
    descCtrl.dispose();
    amountCtrl.dispose();
  }

  void _openPaymentReceipt(Map<String, dynamic> pay) {
    final id = pay['id']?.toString();
    if (id == null || pay['status']?.toString() != 'SUCCEEDED') return;
    openInAppDocument(
      context,
      title: 'Payment receipt',
      apiPath: '/api/payments/$id/receipt',
      filename: 'receipt-$id.pdf',
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = _client ?? widget.preview ?? {};
    final stats = c['stats'] as Map<String, dynamic>? ?? {};
    final services = (c['services'] as List<dynamic>?) ?? [];
    final projects = (c['projects'] as List<dynamic>?) ?? [];
    final invoices = (c['invoices'] as List<dynamic>?) ?? [];
    final payments = (c['payments'] as List<dynamic>?) ?? [];

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: Text(c['fullName']?.toString() ?? c['company']?.toString() ?? 'Client 360'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20)),
        ],
      ),
      floatingActionButton: _loading
          ? null
          : Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                FloatingActionButton.extended(
                  heroTag: 'add_project',
                  onPressed: _createProject,
                  icon: const Icon(Icons.folder_special_rounded),
                  label: const Text('Project'),
                  backgroundColor: ConnectModuleColors.projects,
                ),
                const SizedBox(height: ConnectSpacing.sm),
                FloatingActionButton.extended(
                  heroTag: 'add_service',
                  onPressed: _addService,
                  icon: const Icon(Icons.cloud_upload_outlined),
                  label: const Text('Service'),
                  backgroundColor: ConnectModuleColors.crm,
                ),
                const SizedBox(height: ConnectSpacing.sm),
                FloatingActionButton.extended(
                  heroTag: 'create_invoice',
                  onPressed: _createInvoice,
                  icon: const Icon(Icons.receipt_long_rounded),
                  label: const Text('Invoice'),
                  backgroundColor: ConnectColors.primary,
                ),
              ],
            ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : ListView(
                padding: const EdgeInsets.fromLTRB(
                  ConnectSpacing.lg,
                  ConnectSpacing.lg,
                  ConnectSpacing.lg,
                  160,
                ),
                children: [
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                      child: Text(_error!, style: TextStyle(color: ConnectColors.warning, fontSize: 12)),
                    ),
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
                    const ConnectEmptyState(icon: Icons.cloud_off_outlined, title: 'No services', subtitle: 'Add hosting, domain, or other services.')
                  else
                    ...services.take(8).map((s) {
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
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ErpProjectDetailScreen(projectId: proj['id']?.toString() ?? '', preview: proj),
                            ),
                          ),
                          padding: const EdgeInsets.all(ConnectSpacing.sm),
                          child: Row(
                            children: [
                              Expanded(child: Text(proj['name']?.toString() ?? '', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13))),
                              ConnectChip(label: proj['status']?.toString() ?? ''),
                              const Icon(Icons.chevron_right_rounded, size: 18, color: ConnectColors.textMuted),
                            ],
                          ),
                        ),
                      );
                    }),
                  const ConnectSectionHeader(title: 'Recent Invoices'),
                  if (invoices.isEmpty)
                    Text('No invoices', style: Theme.of(context).textTheme.bodyMedium)
                  else
                    ...invoices.take(8).map((inv) {
                      final i = inv as Map<String, dynamic>;
                      final balance = (i['remainingBalanceCents'] as num?) ?? i['balanceCents'] as num? ?? 0;
                      final total = i['totalCents'] as num? ?? 0;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                        child: ConnectCard(
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => InvoiceDetailScreen(invoiceId: i['id']?.toString(), invoice: i),
                            ),
                          ),
                          padding: const EdgeInsets.all(ConnectSpacing.sm),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(i['invoiceNumber']?.toString() ?? '', style: const TextStyle(fontSize: 13)),
                                    Text(i['status']?.toString() ?? '', style: Theme.of(context).textTheme.labelSmall),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(formatCurrencyCents(total), style: const TextStyle(fontSize: 12)),
                                  if (balance > 0)
                                    Text(
                                      'Due ${formatCurrencyCents(balance)}',
                                      style: Theme.of(context).textTheme.labelSmall?.copyWith(color: ConnectColors.warning, fontSize: 10),
                                    ),
                                ],
                              ),
                              const Icon(Icons.chevron_right_rounded, size: 18, color: ConnectColors.textMuted),
                            ],
                          ),
                        ),
                      );
                    }),
                  const ConnectSectionHeader(title: 'Payments'),
                  if (payments.isEmpty)
                    Text('No payments recorded', style: Theme.of(context).textTheme.bodyMedium)
                  else
                    ...payments.take(8).map((p) {
                      final pay = p as Map<String, dynamic>;
                      final canReceipt = pay['status']?.toString() == 'SUCCEEDED';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                        child: ConnectCard(
                          onTap: canReceipt ? () => _openPaymentReceipt(pay) : null,
                          padding: const EdgeInsets.all(ConnectSpacing.sm),
                          child: Row(
                            children: [
                              Icon(
                                canReceipt ? Icons.receipt_rounded : Icons.hourglass_empty_rounded,
                                size: 18,
                                color: canReceipt ? ConnectColors.success : ConnectColors.warning,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(pay['method']?.toString() ?? 'Payment', style: const TextStyle(fontSize: 13)),
                                    if (pay['reference'] != null) Text(pay['reference'].toString(), style: Theme.of(context).textTheme.labelSmall),
                                  ],
                                ),
                              ),
                              Text(formatCurrencyCents(pay['amountCents'] ?? 0), style: const TextStyle(fontSize: 12)),
                              if (canReceipt) const Icon(Icons.chevron_right_rounded, size: 18, color: ConnectColors.textMuted),
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
