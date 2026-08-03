import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class ProjectDetailScreen extends StatefulWidget {
  const ProjectDetailScreen({super.key, required this.projectId, this.preview});
  final String projectId;
  final Map<String, dynamic>? preview;

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  Map<String, dynamic>? _project;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<AppState>().auth.api.get('/api/staff/service-projects/${widget.projectId}');
      if (mounted) {
        final obj = data['data'] as Map<String, dynamic>? ?? data;
        setState(() {
          _project = obj;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _project = widget.preview;
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final p = _project ?? widget.preview ?? {};

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(title: Text(p['name']?.toString() ?? 'Project')),
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
                        Text(p['name']?.toString() ?? '', style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          children: [
                            ConnectChip(label: p['status']?.toString() ?? 'ACTIVE'),
                            if (p['erpProject'] != null) ConnectChip(label: p['erpProject']['projectCode']?.toString() ?? 'ERP', color: ConnectModuleColors.erp),
                          ],
                        ),
                        if (p['client'] != null) ...[
                          const SizedBox(height: 8),
                          Text('Client: ${p['client']['company'] ?? p['client']['fullName'] ?? ''}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
                        ],
                      ],
                    ),
                  ),
                  const ConnectSectionHeader(title: 'Services'),
                  ..._serviceTiles(p),
                  const ConnectSectionHeader(title: 'Timeline'),
                  ConnectCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Created: ${p['createdAt']?.toString().split('T').first ?? '—'}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
                        Text('Updated: ${p['updatedAt']?.toString().split('T').first ?? '—'}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  List<Widget> _serviceTiles(Map<String, dynamic> p) {
    final services = (p['services'] as List<dynamic>?) ?? [];
    if (services.isEmpty) {
      return [
        const ConnectEmptyState(icon: Icons.layers_outlined, title: 'No services', subtitle: 'Linked domains and hosting appear here.'),
      ];
    }
    return services.map((s) {
      final svc = s as Map<String, dynamic>;
      return Padding(
        padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
        child: ConnectCard(
          padding: const EdgeInsets.all(ConnectSpacing.sm),
          child: Row(
            children: [
              const Icon(Icons.cloud_outlined, color: ConnectModuleColors.crm, size: 20),
              const SizedBox(width: ConnectSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(svc['label']?.toString() ?? svc['serviceType']?.toString() ?? 'Service', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                    Text(svc['status']?.toString() ?? '', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }).toList();
  }
}
