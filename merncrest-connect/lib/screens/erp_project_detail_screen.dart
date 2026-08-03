import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
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

/// ERP project hub — services, billing, invoices (staff mobile).
class ErpProjectDetailScreen extends StatefulWidget {
  const ErpProjectDetailScreen({super.key, required this.projectId, this.preview});
  final String projectId;
  final Map<String, dynamic>? preview;

  @override
  State<ErpProjectDetailScreen> createState() => _ErpProjectDetailScreenState();
}

class _ErpProjectDetailScreenState extends State<ErpProjectDetailScreen> {
  Map<String, dynamic>? _hub;
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
      final data = await context.read<AppState>().auth.api.get('/api/staff/projects/${widget.projectId}/hub');
      if (!mounted) return;
      setState(() {
        _hub = envelopeData(data);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _hub = widget.preview;
        _loading = false;
      });
    }
  }

  Future<void> _addService() async {
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
                    initialValue: serviceType,
                    decoration: const InputDecoration(labelText: 'Service type'),
                    items: serviceTypes.map((e) => DropdownMenuItem(value: e.$1, child: Text(e.$2))).toList(),
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
                  TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Notes (optional)'), maxLines: 2),
                  const SizedBox(height: ConnectSpacing.md),
                  ConnectPrimaryButton(
                    label: submitting ? 'Adding…' : 'Add service',
                    icon: Icons.add_rounded,
                    onPressed: submitting
                        ? null
                        : () async {
                            setSheetState(() => submitting = true);
                            try {
                              await context.read<AppState>().auth.api.post(
                                '/api/staff/projects/${widget.projectId}/services',
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

  void _openReceipt(String paymentId) {
    openInAppDocument(
      context,
      title: 'Payment receipt',
      apiPath: '/api/payments/$paymentId/receipt',
      filename: 'receipt-$paymentId.html',
    );
  }

  @override
  Widget build(BuildContext context) {
    final hub = _hub ?? widget.preview ?? {};
    final project = hub['erpProject'] as Map<String, dynamic>? ?? hub['project'] as Map<String, dynamic>? ?? hub;
    final services = (hub['services'] as List<dynamic>?) ?? [];
    final billingBlock = hub['billing'] as Map<String, dynamic>? ?? {};
    final invoices = (billingBlock['invoices'] as List<dynamic>?) ?? (hub['invoices'] as List<dynamic>?) ?? [];
    final receipts = (billingBlock['receipts'] as List<dynamic>?) ?? (hub['receipts'] as List<dynamic>?) ?? [];
    final billing = billingBlock['summary'] as Map<String, dynamic>? ?? hub['billingSummary'] as Map<String, dynamic>? ?? {};
    final client = hub['client'] as Map<String, dynamic>? ?? project['customer'] as Map<String, dynamic>?;
    final progressPct = (hub['progress'] as Map<String, dynamic>?)?['percent'];

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: Text(project['name']?.toString() ?? 'Project'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20))],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addService,
        icon: const Icon(Icons.cloud_upload_outlined),
        label: const Text('Add service'),
        backgroundColor: ConnectModuleColors.projects,
      ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : ListView(
                padding: const EdgeInsets.fromLTRB(ConnectSpacing.lg, ConnectSpacing.lg, ConnectSpacing.lg, 96),
                children: [
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                      child: Text(_error!, style: const TextStyle(color: ConnectColors.warning, fontSize: 12)),
                    ),
                  ConnectGlassCard(
                    featured: true,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(project['name']?.toString() ?? '', style: Theme.of(context).textTheme.titleLarge),
                        Text(project['projectCode']?.toString() ?? '', style: Theme.of(context).textTheme.labelSmall),
                        const SizedBox(height: ConnectSpacing.sm),
                        Wrap(
                          spacing: 6,
                          children: [
                            ConnectChip(label: project['status']?.toString() ?? 'ACTIVE', color: ConnectModuleColors.projects),
                            if (progressPct != null) ConnectChip(label: '$progressPct% complete'),
                          ],
                        ),
                        if (client != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            client['company']?.toString() ?? client['fullName']?.toString() ?? '',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12),
                          ),
                        ],
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
                      ConnectStatTile(label: 'Invoiced', value: formatCurrencyCents(billing['invoicedCents'] ?? 0), icon: Icons.receipt_long_rounded, color: ConnectModuleColors.finance, compact: true),
                      ConnectStatTile(label: 'Outstanding', value: formatCurrencyCents(billing['balanceCents'] ?? 0), icon: Icons.account_balance_wallet_rounded, color: ConnectColors.warning, compact: true),
                    ],
                  ),
                  const ConnectSectionHeader(title: 'Services'),
                  if (services.isEmpty)
                    const ConnectEmptyState(icon: Icons.cloud_off_outlined, title: 'No services', subtitle: 'Add hosting, domain, or other services.')
                  else
                    ...services.map((s) {
                      final svc = s as Map<String, dynamic>;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                        child: ConnectCard(
                          padding: const EdgeInsets.all(ConnectSpacing.sm),
                          child: Row(
                            children: [
                              const Icon(Icons.dns_outlined, size: 18, color: ConnectModuleColors.crm),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(svc['label']?.toString() ?? svc['serviceType']?.toString() ?? 'Service', style: const TextStyle(fontSize: 13)),
                                    if (svc['renewalDate'] != null) Text('Renews ${svc['renewalDate'].toString().split('T').first}', style: Theme.of(context).textTheme.labelSmall),
                                  ],
                                ),
                              ),
                              ConnectChip(label: svc['status']?.toString() ?? ''),
                            ],
                          ),
                        ),
                      );
                    }),
                  const ConnectSectionHeader(title: 'Invoices'),
                  if (invoices.isEmpty)
                    Text('No invoices', style: Theme.of(context).textTheme.bodyMedium)
                  else
                    ...invoices.take(10).map((inv) {
                      final i = inv as Map<String, dynamic>;
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
                              Expanded(child: Text(i['invoiceNumber']?.toString() ?? '', style: const TextStyle(fontSize: 13))),
                              Text(formatCurrencyCents(i['totalCents'] ?? 0), style: const TextStyle(fontSize: 12)),
                              const Icon(Icons.chevron_right_rounded, size: 18, color: ConnectColors.textMuted),
                            ],
                          ),
                        ),
                      );
                    }),
                  const ConnectSectionHeader(title: 'Receipts'),
                  if (receipts.isEmpty)
                    Text('No receipts', style: Theme.of(context).textTheme.bodyMedium)
                  else
                    ...receipts.take(10).map((r) {
                      final rec = r as Map<String, dynamic>;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                        child: ConnectCard(
                          onTap: () => _openReceipt(rec['id'].toString()),
                          padding: const EdgeInsets.all(ConnectSpacing.sm),
                          child: Row(
                            children: [
                              const Icon(Icons.receipt_rounded, size: 18, color: ConnectColors.success),
                              const SizedBox(width: 8),
                              Expanded(child: Text(rec['receiptNumber']?.toString() ?? rec['invoiceNumber']?.toString() ?? 'Receipt', style: const TextStyle(fontSize: 13))),
                              Text(formatCurrencyCents(rec['amountCents'] ?? 0), style: const TextStyle(fontSize: 12)),
                              const Icon(Icons.chevron_right_rounded, size: 18, color: ConnectColors.textMuted),
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
