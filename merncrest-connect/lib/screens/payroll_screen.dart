import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/document_viewer.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class PayrollScreen extends StatefulWidget {
  const PayrollScreen({super.key});

  @override
  State<PayrollScreen> createState() => _PayrollScreenState();
}

class _PayrollScreenState extends State<PayrollScreen> {
  List<dynamic> _slips = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await context.read<AppState>().auth.api.get('/api/staff');
      if (mounted) {
        setState(() {
          _slips = (data['salarySlips'] as List<dynamic>?) ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final latest = _slips.isNotEmpty ? _slips.first as Map<String, dynamic> : null;
    final ytdNet = _slips.fold<num>(0, (sum, s) => sum + ((s as Map)['netCents'] as num? ?? 0));

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Payroll & Payslips'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20))],
      ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : RefreshIndicator(
                color: ConnectColors.primary,
                onRefresh: _load,
                child: ListView(
                  padding: const EdgeInsets.all(ConnectSpacing.lg),
                  children: [
                    if (latest != null)
                      ConnectGlassCard(
                        featured: true,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Latest Payslip', style: Theme.of(context).textTheme.labelSmall),
                            const SizedBox(height: 4),
                            Text(latest['periodLabel']?.toString() ?? '', style: Theme.of(context).textTheme.titleLarge),
                            const SizedBox(height: ConnectSpacing.sm),
                            Text(formatCurrencyCents(latest['netCents'] ?? 0), style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: ConnectColors.success)),
                            const SizedBox(height: 4),
                            Text('Gross ${formatCurrencyCents(latest['grossCents'] ?? 0)} · Deductions ${formatCurrencyCents(latest['deductionsCents'] ?? 0)}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                            const SizedBox(height: ConnectSpacing.sm),
                            ConnectChip(label: latest['status']?.toString() ?? 'ISSUED', color: ConnectModuleColors.payroll),
                          ],
                        ),
                      ).stitchEntrance(),
                    const SizedBox(height: ConnectSpacing.sm),
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: ConnectSpacing.xs,
                      crossAxisSpacing: ConnectSpacing.xs,
                      childAspectRatio: 1.7,
                      children: [
                        ConnectStatTile(label: 'Payslips', value: '${_slips.length}', icon: Icons.receipt_long_rounded, color: ConnectModuleColors.payroll, compact: true),
                        ConnectStatTile(label: 'YTD Net', value: formatCurrencyCents(ytdNet), icon: Icons.account_balance_wallet_rounded, color: ConnectModuleColors.finance, compact: true),
                      ],
                    ),
                    const ConnectSectionHeader(title: 'Payslip History', padding: EdgeInsets.fromLTRB(0, ConnectSpacing.md, 0, ConnectSpacing.xs)),
                    if (_slips.isEmpty)
                      const ConnectEmptyState(icon: Icons.payments_outlined, title: 'No payslips yet', subtitle: 'Salary slips will appear after payroll is processed.')
                    else
                      ..._slips.map((s) {
                        final slip = s as Map<String, dynamic>;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                          child: ConnectCard(
                            onTap: () => _openSlipDetail(context, slip),
                            padding: const EdgeInsets.all(ConnectSpacing.sm),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: ConnectModuleColors.payroll.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(ConnectRadius.sm),
                                  ),
                                  child: const Icon(Icons.description_rounded, color: ConnectModuleColors.payroll, size: 20),
                                ),
                                const SizedBox(width: ConnectSpacing.sm),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(slip['periodLabel']?.toString() ?? slip['slipNumber']?.toString() ?? 'Payslip', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                      Text(slip['slipNumber']?.toString() ?? '', style: Theme.of(context).textTheme.labelSmall),
                                    ],
                                  ),
                                ),
                                Text(formatCurrencyCents(slip['netCents'] ?? 0), style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13, color: ConnectColors.success)),
                                const SizedBox(width: 4),
                                const Icon(Icons.chevron_right_rounded, size: 18, color: ConnectColors.textMuted),
                              ],
                            ),
                          ),
                        );
                      }),
                  ],
                ),
              ),
      ),
    );
  }

  void _openSlipDetail(BuildContext context, Map<String, dynamic> slip) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => PayslipDetailScreen(slip: slip)));
  }
}

class PayslipDetailScreen extends StatelessWidget {
  const PayslipDetailScreen({super.key, required this.slip});
  final Map<String, dynamic> slip;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(title: Text(slip['slipNumber']?.toString() ?? 'Payslip')),
      body: ConnectAmbientBackground(
        child: ListView(
          padding: const EdgeInsets.all(ConnectSpacing.lg),
          children: [
            ConnectGlassCard(
              featured: true,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(slip['periodLabel']?.toString() ?? '', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: ConnectSpacing.md),
                  _PayRow(label: 'Gross salary', value: formatCurrencyCents(slip['grossCents'] ?? 0)),
                  _PayRow(label: 'Deductions', value: formatCurrencyCents(slip['deductionsCents'] ?? 0), color: ConnectColors.warning),
                  const Divider(height: 16),
                  _PayRow(label: 'Net pay', value: formatCurrencyCents(slip['netCents'] ?? 0), bold: true, color: ConnectColors.success),
                  const SizedBox(height: ConnectSpacing.sm),
                  ConnectChip(label: slip['status']?.toString() ?? 'ISSUED'),
                ],
              ),
            ),
            const ConnectSectionHeader(title: 'Breakdown'),
            ConnectCard(
              child: Column(
                children: [
                  _PayRow(label: 'EPF (employee)', value: _metaField(slip, 'epfCents')),
                  _PayRow(label: 'ETF', value: _metaField(slip, 'etfCents')),
                  _PayRow(label: 'Tax', value: _metaField(slip, 'taxCents')),
                  _PayRow(label: 'Loan', value: _metaField(slip, 'loanCents')),
                  _PayRow(label: 'Allowances', value: _metaField(slip, 'allowanceCents')),
                ],
              ),
            ),
            const SizedBox(height: ConnectSpacing.md),
            ConnectPrimaryButton(
              label: 'View payslip',
              icon: Icons.visibility_rounded,
              onPressed: () {
                final id = slip['id']?.toString();
                if (id == null) return;
                openInAppDocument(
                  context,
                  title: slip['slipNumber']?.toString() ?? 'Payslip',
                  apiPath: '/api/staff/payslips/$id/html',
                  filename: 'payslip-${slip['slipNumber'] ?? id}.pdf',
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  String _metaField(Map<String, dynamic> slip, String key) {
    try {
      final meta = slip['metaJson'];
      if (meta is Map) {
        final v = meta[key];
        if (v is num) return formatCurrencyCents(v);
      } else if (meta is String && meta.isNotEmpty) {
        // basic parse not implemented — show dash
      }
    } catch (_) {}
    return '—';
  }
}

class _PayRow extends StatelessWidget {
  const _PayRow({required this.label, required this.value, this.color, this.bold = false});
  final String label;
  final String value;
  final Color? color;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(child: Text(label, style: TextStyle(fontSize: 13, color: ConnectPalette.of(context).textSecondary))),
          Text(value, style: TextStyle(fontSize: bold ? 16 : 13, fontWeight: bold ? FontWeight.w700 : FontWeight.w500, color: color)),
        ],
      ),
    );
  }
}
