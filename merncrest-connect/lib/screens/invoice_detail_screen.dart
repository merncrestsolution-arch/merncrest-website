import 'package:flutter/material.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';

class InvoiceDetailScreen extends StatelessWidget {
  const InvoiceDetailScreen({super.key, required this.invoice});
  final Map<String, dynamic> invoice;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final payments = (invoice['payments'] as List<dynamic>?) ?? [];

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(title: Text(invoice['invoiceNumber']?.toString() ?? 'Invoice')),
      body: ConnectAmbientBackground(
        child: ListView(
          padding: const EdgeInsets.all(ConnectSpacing.lg),
          children: [
            ConnectGlassCard(
              featured: true,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(invoice['user']?['fullName']?.toString() ?? invoice['user']?['company']?.toString() ?? 'Customer', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16)),
                  if (invoice['project'] != null) Text(invoice['project']['name']?.toString() ?? '', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
                  const SizedBox(height: ConnectSpacing.sm),
                  Wrap(spacing: 6, children: [ConnectChip(label: invoice['status']?.toString() ?? '')]),
                  const SizedBox(height: ConnectSpacing.md),
                  _Row(label: 'Subtotal', value: formatCurrencyCents(invoice['subtotalCents'] ?? 0)),
                  _Row(label: 'Tax', value: formatCurrencyCents(invoice['taxCents'] ?? 0)),
                  _Row(label: 'Total', value: formatCurrencyCents(invoice['totalCents'] ?? 0), bold: true),
                  _Row(label: 'Paid', value: formatCurrencyCents(invoice['paidCents'] ?? 0), color: ConnectColors.success),
                  _Row(label: 'Balance', value: formatCurrencyCents(invoice['remainingBalanceCents'] ?? invoice['balanceCents'] ?? 0), color: ConnectColors.warning),
                  if (invoice['dueAt'] != null) _Row(label: 'Due date', value: invoice['dueAt'].toString().split('T').first),
                ],
              ),
            ),
            const ConnectSectionHeader(title: 'Payments'),
            if (payments.isEmpty)
              const ConnectEmptyState(icon: Icons.payment_outlined, title: 'No payments', subtitle: 'Payment records appear when customers pay.')
            else
              ...payments.map((p) {
                final pay = p as Map<String, dynamic>;
                return Padding(
                  padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                  child: ConnectCard(
                    padding: const EdgeInsets.all(ConnectSpacing.sm),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle_outline, color: ConnectColors.success, size: 18),
                        const SizedBox(width: ConnectSpacing.sm),
                        Expanded(child: Text(pay['method']?.toString() ?? 'Payment', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13))),
                        Text(formatCurrencyCents(pay['amountCents'] ?? 0), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
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

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value, this.color, this.bold = false});
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
