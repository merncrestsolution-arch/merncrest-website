import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/api_payload.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

/// Loads a staff API endpoint and renders human-readable rows (never raw JSON).
class ModuleListScreen extends StatefulWidget {
  const ModuleListScreen({super.key, required this.title, required this.endpoint});

  final String title;
  final String endpoint;

  @override
  State<ModuleListScreen> createState() => _ModuleListScreenState();
}

class _ModuleListScreenState extends State<ModuleListScreen> {
  List<_RowData> _rows = [];
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
      final data = await context.read<AppState>().auth.api.get(widget.endpoint);
      if (!mounted) return;
      setState(() {
        _rows = _parse(widget.endpoint, data);
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _loading = false;
        });
      }
    }
  }

  List<_RowData> _parse(String endpoint, Map<String, dynamic> data) {
    if (endpoint.contains('/calendar')) {
      return _calendarRows(data);
    }
    if (endpoint.contains('/announcements')) {
      return ApiPayload.list(data, keys: const ['data', 'announcements'])
          .map((e) => _fromMap(e as Map<String, dynamic>, chip: e['tone']?.toString()))
          .toList();
    }
    if (endpoint.contains('/invoices')) {
      return ApiPayload.list(data, keys: const ['data', 'invoices'])
          .map((e) {
            final m = e as Map<String, dynamic>;
            final cents = m['totalCents'] as num? ?? m['balanceCents'] as num?;
            return _RowData(
              title: m['invoiceNumber']?.toString() ?? 'Invoice',
              subtitle: [
                m['status']?.toString(),
                if (m['user'] is Map) (m['user'] as Map)['fullName']?.toString(),
                if (cents != null) formatCurrencyCents(cents),
              ].whereType<String>().where((s) => s.isNotEmpty).join(' · '),
              chip: m['status']?.toString(),
            );
          })
          .toList();
    }
    if (endpoint.contains('/service-projects') || endpoint.contains('/projects')) {
      return ApiPayload.list(data, keys: const ['data', 'projects'])
          .map((e) {
            final m = e as Map<String, dynamic>;
            return _RowData(
              title: m['name']?.toString() ?? 'Project',
              subtitle: [
                m['status']?.toString(),
                if (m['client'] is Map) (m['client'] as Map)['fullName']?.toString(),
                if (m['serviceCount'] != null) '${m['serviceCount']} services',
              ].whereType<String>().where((s) => s.isNotEmpty).join(' · '),
              chip: m['status']?.toString(),
            );
          })
          .toList();
    }
    if (endpoint.contains('/quotations')) {
      return ApiPayload.list(data, keys: const ['quotations', 'data'])
          .map((e) {
            final m = e as Map<String, dynamic>;
            return _RowData(
              title: m['customerName']?.toString() ?? m['quoteNumber']?.toString() ?? 'Quotation',
              subtitle: [
                m['status']?.toString(),
                if (m['totalCents'] != null) formatCurrencyCents(m['totalCents'] as num),
                if (m['lead'] is Map) (m['lead'] as Map)['fullName']?.toString(),
              ].whereType<String>().where((s) => s.isNotEmpty).join(' · '),
              chip: m['status']?.toString(),
            );
          })
          .toList();
    }

    return ApiPayload.list(data).map((e) => _fromMap(e as Map<String, dynamic>)).toList();
  }

  List<_RowData> _calendarRows(Map<String, dynamic> data) {
    final rows = <_RowData>[];
    for (final e in (data['events'] as List<dynamic>? ?? [])) {
      final m = e as Map<String, dynamic>;
      rows.add(_RowData(
        title: m['title']?.toString() ?? 'Event',
        subtitle: '${m['kind'] ?? 'EVENT'} · ${m['startsAt'] ?? ''}',
        chip: 'Event',
      ));
    }
    for (final h in (data['holidays'] as List<dynamic>? ?? [])) {
      final m = h as Map<String, dynamic>;
      rows.add(_RowData(
        title: m['name']?.toString() ?? 'Holiday',
        subtitle: m['date']?.toString() ?? '',
        chip: 'Holiday',
      ));
    }
    for (final l in (data['leaves'] as List<dynamic>? ?? [])) {
      final m = l as Map<String, dynamic>;
      rows.add(_RowData(
        title: '${m['leaveType'] ?? 'Leave'} · ${m['user']?['fullName'] ?? 'Staff'}',
        subtitle: '${m['startDate'] ?? ''} → ${m['endDate'] ?? ''}',
        chip: m['status']?.toString(),
      ));
    }
    rows.sort((a, b) => a.subtitle.compareTo(b.subtitle));
    return rows;
  }

  _RowData _fromMap(Map<String, dynamic> m, {String? chip}) => _RowData(
        title: ApiPayload.title(m),
        subtitle: ApiPayload.subtitle(m),
        chip: chip ?? m['status']?.toString(),
      );

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: Text(widget.title),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20))],
      ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : _error != null
                ? ConnectEmptyState(icon: Icons.error_outline, title: 'Could not load', subtitle: _error)
                : _rows.isEmpty
                    ? ConnectEmptyState(
                        icon: Icons.inbox_outlined,
                        title: 'No records',
                        subtitle: 'Nothing to show from ${widget.title.toLowerCase()} yet.',
                      )
                    : RefreshIndicator(
                        color: ConnectColors.primary,
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(ConnectSpacing.lg),
                          itemCount: _rows.length,
                          itemBuilder: (context, i) {
                            final row = _rows[i];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                              child: ConnectCard(
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(row.title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                          if (row.subtitle.isNotEmpty)
                                            Text(row.subtitle, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                                        ],
                                      ),
                                    ),
                                    if (row.chip != null) ConnectChip(label: row.chip!),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
      ),
    );
  }
}

class _RowData {
  const _RowData({required this.title, required this.subtitle, this.chip});
  final String title;
  final String subtitle;
  final String? chip;
}
