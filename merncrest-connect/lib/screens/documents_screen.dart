import 'package:flutter/material.dart';
import 'package:merncrest_connect/config/api_config.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/screens/document_upload_screen.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  List<dynamic> _announcements = [];
  List<dynamic> _documents = [];
  List<dynamic> _myDocuments = [];
  String _folder = 'all';
  String _query = '';
  bool _loading = true;

  static const _folders = [
    ('my', 'My uploads', Icons.upload_file_outlined),
    ('all', 'All', Icons.folder_open_rounded),
    ('policies', 'Policies', Icons.policy_outlined),
    ('hr', 'HR Files', Icons.people_outline_rounded),
    ('projects', 'Projects', Icons.folder_special_rounded),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final api = context.read<AppState>().auth.api;
    try {
      final ann = await api.get('/api/staff/announcements');
      List<dynamic> docs = [];
      try {
        final dms = await api.get('/api/erp/documents');
        docs = (dms['documents'] as List<dynamic>?) ?? [];
      } catch (_) {}
      List<dynamic> mine = [];
      try {
        final staff = await api.get('/api/staff/documents');
        mine = (staff['documents'] as List<dynamic>?) ?? [];
      } catch (_) {}
      if (mounted) {
        setState(() {
          _announcements = (ann['data'] as List<dynamic>?) ?? (ann['announcements'] as List<dynamic>?) ?? [];
          _documents = docs;
          _myDocuments = mine;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<_DocItem> _allItems() {
    final items = <_DocItem>[];
    for (final a in _announcements) {
      final m = a as Map<String, dynamic>;
      items.add(_DocItem(
        title: m['title']?.toString() ?? 'Announcement',
        subtitle: m['body']?.toString() ?? '',
        folder: 'policies',
        icon: Icons.campaign_outlined,
        href: m['href']?.toString(),
      ));
    }
    for (final d in _myDocuments) {
      final m = d as Map<String, dynamic>;
      items.add(_DocItem(
        title: m['title']?.toString() ?? 'My upload',
        subtitle: m['docType']?.toString() ?? 'ESS',
        folder: 'my',
        icon: Icons.upload_file_outlined,
        href: m['fileUrl']?.toString(),
      ));
    }
    for (final d in _documents) {
      final m = d as Map<String, dynamic>;
      items.add(_DocItem(
        title: m['title']?.toString() ?? m['name']?.toString() ?? 'Document',
        subtitle: m['folder']?.toString() ?? m['docType']?.toString() ?? '',
        folder: _mapFolder(m['folder']?.toString()),
        icon: Icons.description_rounded,
        href: m['fileUrl']?.toString() ?? m['url']?.toString(),
      ));
    }
    return items;
  }

  String _mapFolder(String? f) {
    final lower = f?.toLowerCase() ?? '';
    if (lower.contains('hr')) return 'hr';
    if (lower.contains('project')) return 'projects';
    if (lower.contains('policy')) return 'policies';
    return 'policies';
  }

  @override
  Widget build(BuildContext context) {
    final items = _allItems().where((i) {
      if (_folder != 'all' && i.folder != _folder) return false;
      if (_query.isNotEmpty && !i.title.toLowerCase().contains(_query.toLowerCase())) return false;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('Documents'),
        actions: [
          IconButton(
            onPressed: () async {
              await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DocumentUploadScreen()));
              _load();
            },
            icon: const Icon(Icons.upload_file_rounded, size: 20),
            tooltip: 'Upload',
          ),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20)),
        ],
      ),
      body: ConnectAmbientBackground(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(ConnectSpacing.lg, ConnectSpacing.sm, ConnectSpacing.lg, 0),
              child: ConnectGlassCard(
                child: Row(
                  children: [
                    const Icon(Icons.cloud_download_outlined, color: ConnectModuleColors.docs, size: 24),
                    const SizedBox(width: ConnectSpacing.sm),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Company Documents', style: Theme.of(context).textTheme.titleMedium),
                          Text('${items.length} files · policies · HR · projects', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                        ],
                      ),
                    ),
                  ],
                ),
              ).stitchEntrance(),
            ),
            Padding(
              padding: const EdgeInsets.all(ConnectSpacing.lg),
              child: ConnectSearchBar(hint: 'Search documents…', onChanged: (v) => setState(() => _query = v)),
            ),
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: ConnectSpacing.lg),
                children: _folders.map((f) {
                  final selected = _folder == f.$1;
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: FilterChip(
                      avatar: Icon(f.$3, size: 16, color: selected ? ConnectColors.primaryGlow : ConnectColors.textMuted),
                      label: Text(f.$2, style: const TextStyle(fontSize: 11)),
                      selected: selected,
                      onSelected: (_) => setState(() => _folder = f.$1),
                      selectedColor: ConnectColors.primary.withValues(alpha: 0.2),
                    ),
                  );
                }).toList(),
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
                  : items.isEmpty
                      ? const ConnectEmptyState(icon: Icons.folder_off_outlined, title: 'No documents', subtitle: 'Company files and policies will sync here.')
                      : RefreshIndicator(
                          color: ConnectColors.primary,
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(ConnectSpacing.lg),
                            itemCount: items.length,
                            itemBuilder: (context, i) {
                              final item = items[i];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
                                child: ConnectCard(
                                  onTap: () {
                                    if (item.href == null || item.href!.isEmpty) return;
                                    final href = item.href!;
                                    final uri = href.startsWith('http') ? Uri.parse(href) : Uri.parse('${ApiConfig.baseUrl}$href');
                                    launchUrl(uri, mode: LaunchMode.externalApplication);
                                  },
                                  padding: const EdgeInsets.all(ConnectSpacing.sm),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: ConnectModuleColors.docs.withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(ConnectRadius.sm),
                                        ),
                                        child: Icon(item.icon, color: ConnectModuleColors.docs, size: 18),
                                      ),
                                      const SizedBox(width: ConnectSpacing.sm),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(item.title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                                            if (item.subtitle.isNotEmpty)
                                              Text(item.subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                                          ],
                                        ),
                                      ),
                                      const Icon(Icons.download_rounded, size: 18, color: ConnectColors.textMuted),
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
      ),
    );
  }
}

class _DocItem {
  _DocItem({required this.title, required this.subtitle, required this.folder, required this.icon, this.href});
  final String title;
  final String subtitle;
  final String folder;
  final IconData icon;
  final String? href;
}
