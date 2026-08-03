import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/api_envelope.dart';
import 'package:merncrest_connect/utils/document_viewer.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class InvoiceDetailScreen extends StatefulWidget {
  const InvoiceDetailScreen({super.key, this.invoiceId, this.invoice});

  final String? invoiceId;
  final Map<String, dynamic>? invoice;

  @override
  State<InvoiceDetailScreen> createState() => _InvoiceDetailScreenState();
}

class _InvoiceDetailScreenState extends State<InvoiceDetailScreen> {
  Map<String, dynamic>? _invoice;
  bool _loading = true;
  String? _error;

  String get _id => widget.invoiceId ?? widget.invoice?['id']?.toString() ?? '';

  @override
  void initState() {
    super.initState();
    _invoice = widget.invoice;
    _load();
  }

  Future<void> _load() async {
    if (_id.isEmpty) {
      setState(() {
        _error = 'Invoice id missing';
        _loading = false;
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await context.read<AppState>().auth.api.get('/api/staff/invoices/$_id');
      if (!mounted) return;
      setState(() {
        _invoice = envelopeData(data) ?? _invoice;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  List<Map<String, dynamic>> _lineItems() {
    final inv = _invoice;
    if (inv == null) return [];
    final raw = inv['lineItemsJson'];
    try {
      if (raw is Map) {
        final lines = raw['lines'];
        if (lines is List) return lines.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      }
      if (raw is String && raw.isNotEmpty) {
        final parsed = jsonDecode(raw) as Map<String, dynamic>;
        final lines = parsed['lines'];
        if (lines is List) return lines.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      }
    } catch (_) {}
    return [];
  }

  void _openInvoicePdf() {
    final number = _invoice?['invoiceNumber']?.toString() ?? _id;
    openInAppDocument(
      context,
      title: 'Invoice $number',
      apiPath: '/api/invoices/$_id/pdf',
      filename: 'invoice-$number.html',
    );
  }

  void _openReceipt(String paymentId, String? receiptNumber) {
    openInAppDocument(
      context,
      title: receiptNumber != null ? 'Receipt $receiptNumber' : 'Payment receipt',
      apiPath: '/api/payments/$paymentId/receipt',
      filename: 'receipt-${receiptNumber ?? paymentId}.html',
    );
  }

  Future<void> _recordPayment() async {
    final inv = _invoice;
    if (inv == null) return;
    final balance = (inv['remainingBalanceCents'] as num?) ?? (inv['balanceCents'] as num?) ?? 0;
    if (balance <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invoice is fully paid')));
      return;
    }

    final amountCtrl = TextEditingController(text: (balance / 100).toStringAsFixed(2));
    final refCtrl = TextEditingController();
    String method = 'BANK_TRANSFER';
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
                  Text('Record payment', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: ConnectSpacing.sm),
                  TextField(
                    controller: amountCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Amount (LKR)'),
                  ),
                  const SizedBox(height: ConnectSpacing.sm),
                  DropdownButtonFormField<String>(
                    initialValue: method,
                    decoration: const InputDecoration(labelText: 'Method'),
                    items: const [
                      DropdownMenuItem(value: 'BANK_TRANSFER', child: Text('Bank transfer')),
                      DropdownMenuItem(value: 'CASH', child: Text('Cash')),
                      DropdownMenuItem(value: 'CARD', child: Text('Card')),
                      DropdownMenuItem(value: 'CHEQUE', child: Text('Cheque')),
                      DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                    ],
                    onChanged: (v) => setSheetState(() => method = v ?? method),
                  ),
                  const SizedBox(height: ConnectSpacing.sm),
                  TextField(
                    controller: refCtrl,
                    decoration: const InputDecoration(labelText: 'Reference (optional)'),
                  ),
                  const SizedBox(height: ConnectSpacing.md),
                  ConnectPrimaryButton(
                    label: submitting ? 'Saving…' : 'Confirm payment',
                    icon: Icons.payment_rounded,
                    onPressed: submitting
                        ? null
                        : () async {
                            final parsed = double.tryParse(amountCtrl.text.replaceAll(',', ''));
                            if (parsed == null || parsed <= 0) {
                              ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Enter a valid amount')));
                              return;
                            }
                            final cents = (parsed * 100).round();
                            setSheetState(() => submitting = true);
                            try {
                              await context.read<AppState>().auth.api.post(
                                '/api/staff/invoices/$_id/payments',
                                {
                                  'amountCents': cents,
                                  'method': method,
                                  'referenceNumber': refCtrl.text.trim().isEmpty ? null : refCtrl.text.trim(),
                                },
                              );
                              if (Navigator.of(ctx).canPop()) Navigator.of(ctx).pop();
                              await _load();
                              if (mounted) {
                                ScaffoldMessenger.of(this.context).showSnackBar(const SnackBar(content: Text('Payment recorded')));
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
    amountCtrl.dispose();
    refCtrl.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final inv = _invoice;
    final payments = (inv?['payments'] as List<dynamic>?) ?? [];
    final lines = _lineItems();
    final number = inv?['invoiceNumber']?.toString() ?? 'Invoice';

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: Text(number),
        actions: [
          if (inv != null)
            IconButton(onPressed: _openInvoicePdf, icon: const Icon(Icons.picture_as_pdf_outlined, size: 20)),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20)),
        ],
      ),
      floatingActionButton: inv != null && ((inv['remainingBalanceCents'] as num?) ?? 0) > 0
          ? FloatingActionButton.extended(
              onPressed: _recordPayment,
              icon: const Icon(Icons.add_card_rounded),
              label: const Text('Payment'),
              backgroundColor: ConnectColors.primary,
            )
          : null,
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : _error != null && inv == null
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ConnectEmptyState(
                        icon: Icons.receipt_long_outlined,
                        title: 'Invoice unavailable',
                        subtitle: _error!,
                      ),
                      Padding(
                        padding: const EdgeInsets.all(ConnectSpacing.lg),
                        child: ConnectPrimaryButton(label: 'Retry', icon: Icons.refresh_rounded, onPressed: _load),
                      ),
                    ],
                  )
                : ListView(
                    padding: const EdgeInsets.all(ConnectSpacing.lg),
                    children: [
                      if (inv != null)
                        ConnectGlassCard(
                          featured: true,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                inv['user']?['fullName']?.toString() ?? inv['user']?['company']?.toString() ?? 'Customer',
                                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16),
                              ),
                              if (inv['project'] != null)
                                Text(inv['project']['name']?.toString() ?? '', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
                              const SizedBox(height: ConnectSpacing.sm),
                              Wrap(spacing: 6, children: [ConnectChip(label: inv['status']?.toString() ?? '')]),
                              const SizedBox(height: ConnectSpacing.md),
                              _InvoiceRow(label: 'Subtotal', value: formatCurrencyCents(inv['subtotalCents'] ?? 0)),
                              _InvoiceRow(label: 'Tax', value: formatCurrencyCents(inv['taxCents'] ?? 0)),
                              _InvoiceRow(label: 'Total', value: formatCurrencyCents(inv['totalCents'] ?? 0), bold: true),
                              _InvoiceRow(label: 'Paid', value: formatCurrencyCents(inv['paidCents'] ?? 0), color: ConnectColors.success),
                              _InvoiceRow(
                                label: 'Balance',
                                value: formatCurrencyCents(inv['remainingBalanceCents'] ?? inv['balanceCents'] ?? 0),
                                color: ConnectColors.warning,
                              ),
                              if (inv['dueAt'] != null)
                                _InvoiceRow(label: 'Due date', value: inv['dueAt'].toString().split('T').first),
                            ],
                          ),
                        ),
                      const SizedBox(height: ConnectSpacing.sm),
                      ConnectPrimaryButton(
                        label: 'View invoice',
                        icon: Icons.visibility_rounded,
                        onPressed: inv != null ? _openInvoicePdf : null,
                      ),
                      if (lines.isNotEmpty) ...[
                        const ConnectSectionHeader(title: 'Line items'),
                        ...lines.map((line) {
                          final qty = (line['qty'] as num?) ?? 1;
                          final unit = (line['unitCents'] as num?) ?? 0;
                          final discount = (line['discountCents'] as num?) ?? 0;
                          final total = qty * unit - discount;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                            child: ConnectCard(
                              padding: const EdgeInsets.all(ConnectSpacing.sm),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(line['description']?.toString() ?? 'Item', style: const TextStyle(fontSize: 13)),
                                        Text('Qty $qty × ${formatCurrencyCents(unit)}', style: Theme.of(context).textTheme.labelSmall),
                                      ],
                                    ),
                                  ),
                                  Text(formatCurrencyCents(total), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ),
                          );
                        }),
                      ],
                      const ConnectSectionHeader(title: 'Payments'),
                      if (payments.isEmpty)
                        const ConnectEmptyState(
                          icon: Icons.payment_outlined,
                          title: 'No payments',
                          subtitle: 'Record a payment when the client pays.',
                        )
                      else
                        ...payments.map((p) {
                          final pay = p as Map<String, dynamic>;
                          final status = pay['status']?.toString() ?? '';
                          final canReceipt = status == 'SUCCEEDED' && pay['id'] != null;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                            child: ConnectCard(
                              onTap: canReceipt
                                  ? () => _openReceipt(pay['id'].toString(), pay['receiptNumber']?.toString())
                                  : null,
                              padding: const EdgeInsets.all(ConnectSpacing.sm),
                              child: Row(
                                children: [
                                  Icon(
                                    status == 'SUCCEEDED' ? Icons.check_circle_outline : Icons.hourglass_empty_rounded,
                                    color: status == 'SUCCEEDED' ? ConnectColors.success : ConnectColors.warning,
                                    size: 18,
                                  ),
                                  const SizedBox(width: ConnectSpacing.sm),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(pay['method']?.toString() ?? 'Payment', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                        if (pay['referenceNumber'] != null)
                                          Text(pay['referenceNumber'].toString(), style: Theme.of(context).textTheme.labelSmall),
                                        if (pay['receiptNumber'] != null)
                                          Text('Receipt ${pay['receiptNumber']}', style: Theme.of(context).textTheme.labelSmall),
                                      ],
                                    ),
                                  ),
                                  Text(formatCurrencyCents(pay['amountCents'] ?? 0), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
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

class _InvoiceRow extends StatelessWidget {
  const _InvoiceRow({required this.label, required this.value, this.color, this.bold = false});
  final String label;
  final String value;
  final Color? color;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(child: Text(label, style: TextStyle(fontSize: 12, color: ConnectPalette.of(context).textSecondary))),
          Text(value, style: TextStyle(fontSize: bold ? 15 : 13, fontWeight: bold ? FontWeight.w700 : FontWeight.w500, color: color)),
        ],
      ),
    );
  }
}
