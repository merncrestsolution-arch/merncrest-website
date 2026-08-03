import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/screens/invoice_detail_screen.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/api_envelope.dart';
import 'package:merncrest_connect/utils/document_viewer.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_charts.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> with SingleTickerProviderStateMixin {
  List<dynamic> _invoices = [];
  List<dynamic> _payments = [];
  bool _loading = true;
  String _statusFilter = 'all';
  String _query = '';
  String _paymentQuery = '';
  late TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
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
      final api = context.read<AppState>().auth.api;
      final results = await Future.wait([
        api.get('/api/staff/invoices'),
        api.get('/api/staff/payments'),
      ]);
      if (mounted) {
        setState(() {
          _invoices = envelopeList(results[0]);
          _payments = envelopeList(results[1]);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  void _viewReceipt(Map<String, dynamic> pay) {
    final id = pay['id']?.toString();
    if (id == null) return;
    openInAppDocument(
      context,
      title: pay['receiptNumber']?.toString() ?? 'Receipt',
      apiPath: pay['receiptPath']?.toString() ?? '/api/payments/$id/receipt',
      filename: 'receipt-${pay['receiptNumber'] ?? id}.html',
    );
  }

  void _viewInvoicePdf(Map<String, dynamic> inv) {
    final id = inv['id']?.toString();
    if (id == null) return;
    openInAppDocument(
      context,
      title: inv['invoiceNumber']?.toString() ?? 'Invoice',
      apiPath: '/api/invoices/$id/pdf',
      filename: 'invoice-${inv['invoiceNumber'] ?? id}.html',
    );
  }

  List<dynamic> _filteredPayments() {
    final q = _paymentQuery.toLowerCase();
    return _payments.where((p) {
      final m = p as Map<String, dynamic>;
      if (q.isEmpty) return true;
      final text = '${m['receiptNumber']} ${m['invoiceNumber']} ${m['customer']?['fullName']} ${m['method']}'.toLowerCase();
      return text.contains(q);
    }).toList();
  }

  num _sumPaid() => _invoices.fold<num>(0, (s, i) => s + ((i as Map)['paidCents'] as num? ?? 0));
  num _sumOutstanding() => _invoices.fold<num>(0, (s, i) => s + ((i as Map)['remainingBalanceCents'] as num? ?? (i as Map)['balanceCents'] as num? ?? 0));
  num _sumTotal() => _invoices.fold<num>(0, (s, i) => s + ((i as Map)['totalCents'] as num? ?? 0));

  List<double> _cashFlowSeries() {
    final now = DateTime.now();
    final buckets = List<double>.filled(6, 0);
    for (final inv in _invoices) {
      final m = inv as Map<String, dynamic>;
      final created = DateTime.tryParse(m['createdAt']?.toString() ?? '');
      if (created == null) continue;
      final monthsAgo = (now.year - created.year) * 12 + now.month - created.month;
      if (monthsAgo >= 0 && monthsAgo < 6) {
        buckets[5 - monthsAgo] += ((m['paidCents'] as num?) ?? 0) / 100;
      }
    }
    return buckets;
  }

  List<dynamic> _filteredInvoices() {
    return _invoices.where((inv) {
      final m = inv as Map<String, dynamic>;
      final status = m['status']?.toString().toUpperCase() ?? '';
      if (_statusFilter == 'outstanding' && (m['remainingBalanceCents'] as num? ?? 0) <= 0) return false;
      if (_statusFilter == 'paid' && status != 'PAID') return false;
      if (_statusFilter == 'pending' && status != 'PENDING' && status != 'SENT') return false;
      final q = _query.toLowerCase();
      if (q.isNotEmpty) {
        final text = '${m['invoiceNumber']} ${m['user']?['fullName']} ${m['user']?['company']}'.toLowerCase();
        if (!text.contains(q)) return false;
      }
      return true;
    }).toList();
  }

  Color _invoiceStatusColor(String? status) {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return ConnectColors.success;
      case 'OVERDUE':
        return ConnectColors.error;
      case 'PENDING':
      case 'SENT':
        return ConnectColors.warning;
      default:
        return ConnectModuleColors.finance;
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final filtered = _filteredInvoices();
    final cashFlow = _cashFlowSeries();

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Finance'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20))],
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Invoices'),
            Tab(text: 'Payments'),
            Tab(text: 'Reports'),
          ],
        ),
      ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : TabBarView(
                controller: _tabs,
                children: [
                  RefreshIndicator(
                    color: ConnectColors.primary,
                    onRefresh: _load,
                    child: ListView(
                      padding: const EdgeInsets.all(ConnectSpacing.lg),
                      children: [
                        ConnectGlassCard(
                          featured: true,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Financial Summary', style: Theme.of(context).textTheme.titleMedium),
                              const SizedBox(height: ConnectSpacing.sm),
                              Text(formatCurrencyCents(_sumTotal()), style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: ConnectColors.success)),
                              Text('Total invoiced · ${_invoices.length} invoices', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
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
                          childAspectRatio: 1.65,
                          children: [
                            ConnectStatTile(label: 'Collected', value: formatCurrencyCents(_sumPaid()), icon: Icons.payments_rounded, color: ConnectColors.success, compact: true),
                            ConnectStatTile(label: 'Outstanding', value: formatCurrencyCents(_sumOutstanding()), icon: Icons.receipt_long_rounded, color: ConnectColors.warning, compact: true),
                          ],
                        ),
                        const ConnectSectionHeader(title: 'Cash Flow', padding: EdgeInsets.fromLTRB(0, ConnectSpacing.sm, 0, ConnectSpacing.xs)),
                        ConnectChartCard(
                          title: 'Collections (6 months)',
                          child: ConnectMiniBarChart(
                            values: cashFlow,
                            labels: const ['-5', '-4', '-3', '-2', '-1', 'Now'],
                            color: ConnectModuleColors.finance,
                            height: 80,
                          ),
                        ),
                        const SizedBox(height: ConnectSpacing.sm),
                        ConnectChartCard(
                          title: 'Revenue vs Outstanding',
                          child: ConnectSparkline(
                            values: [(_sumPaid() / 100).toDouble(), (_sumOutstanding() / 100).toDouble(), (_sumTotal() / 100).toDouble()],
                            color: ConnectColors.primary,
                          ),
                        ),
                        const ConnectSectionHeader(title: 'Quick view', padding: EdgeInsets.fromLTRB(0, ConnectSpacing.sm, 0, ConnectSpacing.xs)),
                        ConnectCard(
                          onTap: () => openInAppDocument(context, title: 'Finance summary report', apiPath: '/api/staff/reports/finance', filename: 'finance-report.html'),
                          padding: const EdgeInsets.all(ConnectSpacing.sm),
                          child: const Row(
                            children: [
                              Icon(Icons.analytics_outlined, color: ConnectModuleColors.finance),
                              SizedBox(width: 8),
                              Expanded(child: Text('Finance summary report', style: TextStyle(fontSize: 13))),
                              Icon(Icons.visibility_rounded, size: 18, color: ConnectColors.textMuted),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(ConnectSpacing.lg),
                        child: ConnectSearchBar(hint: 'Search invoices…', onChanged: (v) => setState(() => _query = v)),
                      ),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: ConnectSpacing.lg),
                        child: Row(
                          children: [
                            _FilterChip(label: 'All', selected: _statusFilter == 'all', onTap: () => setState(() => _statusFilter = 'all')),
                            _FilterChip(label: 'Outstanding', selected: _statusFilter == 'outstanding', onTap: () => setState(() => _statusFilter = 'outstanding')),
                            _FilterChip(label: 'Paid', selected: _statusFilter == 'paid', onTap: () => setState(() => _statusFilter = 'paid')),
                            _FilterChip(label: 'Pending', selected: _statusFilter == 'pending', onTap: () => setState(() => _statusFilter = 'pending')),
                          ],
                        ),
                      ),
                      Expanded(
                        child: filtered.isEmpty
                            ? const ConnectEmptyState(icon: Icons.receipt_long_outlined, title: 'No invoices', subtitle: 'Billing records will sync here.')
                            : RefreshIndicator(
                                color: ConnectColors.primary,
                                onRefresh: _load,
                                child: ListView.builder(
                                  padding: const EdgeInsets.all(ConnectSpacing.lg),
                                  itemCount: filtered.length,
                                  itemBuilder: (context, i) {
                                    final inv = filtered[i] as Map<String, dynamic>;
                                    return Padding(
                                      padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                                      child: ConnectCard(
                                        onTap: () => Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (_) => InvoiceDetailScreen(invoiceId: inv['id']?.toString(), invoice: inv),
                                          ),
                                        ),
                                        padding: const EdgeInsets.all(ConnectSpacing.sm),
                                        child: Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(8),
                                              decoration: BoxDecoration(
                                                color: _invoiceStatusColor(inv['status']?.toString()).withValues(alpha: 0.15),
                                                borderRadius: BorderRadius.circular(ConnectRadius.sm),
                                              ),
                                              child: Icon(Icons.receipt_long_rounded, color: _invoiceStatusColor(inv['status']?.toString()), size: 18),
                                            ),
                                            const SizedBox(width: ConnectSpacing.sm),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(inv['invoiceNumber']?.toString() ?? 'Invoice', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                                  Text(inv['user']?['fullName']?.toString() ?? inv['user']?['company']?.toString() ?? '', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                                                ],
                                              ),
                                            ),
                                            Column(
                                              crossAxisAlignment: CrossAxisAlignment.end,
                                              children: [
                                                Text(formatCurrencyCents(inv['totalCents'] ?? 0), style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 12)),
                                                ConnectChip(label: inv['status']?.toString() ?? '', color: _invoiceStatusColor(inv['status']?.toString())),
                                              ],
                                            ),
                                            IconButton(
                                              onPressed: () => _viewInvoicePdf(inv),
                                              icon: const Icon(Icons.visibility_rounded, size: 18),
                                              tooltip: 'View invoice',
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                      ),
                    ],
                  ),
                  Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(ConnectSpacing.lg),
                        child: ConnectSearchBar(hint: 'Search payments…', onChanged: (v) => setState(() => _paymentQuery = v)),
                      ),
                      Expanded(
                        child: _filteredPayments().isEmpty
                            ? const ConnectEmptyState(icon: Icons.receipt_rounded, title: 'No payments', subtitle: 'Receipts appear when payments are recorded.')
                            : RefreshIndicator(
                                color: ConnectColors.primary,
                                onRefresh: _load,
                                child: ListView.builder(
                                  padding: const EdgeInsets.all(ConnectSpacing.lg),
                                  itemCount: _filteredPayments().length,
                                  itemBuilder: (context, i) {
                                    final pay = _filteredPayments()[i] as Map<String, dynamic>;
                                    return Padding(
                                      padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                                      child: ConnectCard(
                                        onTap: () => _viewReceipt(pay),
                                        padding: const EdgeInsets.all(ConnectSpacing.sm),
                                        child: Row(
                                          children: [
                                            const Icon(Icons.receipt_rounded, color: ConnectColors.success, size: 18),
                                            const SizedBox(width: ConnectSpacing.sm),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(pay['receiptNumber']?.toString() ?? pay['invoiceNumber']?.toString() ?? 'Payment', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                                  Text(
                                                    '${pay['customer']?['fullName'] ?? ''} · ${pay['method']?.toString() ?? ''}',
                                                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            Text(formatCurrencyCents(pay['amountCents'] ?? 0), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                            const Icon(Icons.visibility_rounded, size: 18, color: ConnectColors.textMuted),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                      ),
                    ],
                  ),
                  ListView(
                    padding: const EdgeInsets.all(ConnectSpacing.lg),
                    children: [
                      ConnectCard(
                        onTap: () => openInAppDocument(context, title: 'Finance summary', apiPath: '/api/staff/reports/finance', filename: 'finance-report.html'),
                        padding: const EdgeInsets.all(ConnectSpacing.md),
                        child: Row(
                          children: [
                            const Icon(Icons.assessment_rounded, color: ConnectModuleColors.finance, size: 22),
                            const SizedBox(width: ConnectSpacing.sm),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Finance summary report', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                  Text('Invoices, collections & outstanding balances', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                                ],
                              ),
                            ),
                            const Icon(Icons.visibility_rounded, color: ConnectColors.textMuted),
                          ],
                        ),
                      ),
                      const SizedBox(height: ConnectSpacing.sm),
                      Text('Tap any report to view inside the app. Sharing is optional from the viewer toolbar.', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                    ],
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
        label: Text(label, style: const TextStyle(fontSize: 10)),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: ConnectColors.primary.withValues(alpha: 0.25),
      ),
    );
  }
}
