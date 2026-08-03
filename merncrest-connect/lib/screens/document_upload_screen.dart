import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:merncrest_connect/config/api_config.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/services/api_upload.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

class DocumentUploadScreen extends StatefulWidget {
  const DocumentUploadScreen({super.key});

  @override
  State<DocumentUploadScreen> createState() => _DocumentUploadScreenState();
}

class _DocumentUploadScreenState extends State<DocumentUploadScreen> {
  final _picker = ImagePicker();
  bool _uploading = false;
  bool _loading = true;
  String? _lastUrl;
  String? _lastName;
  List<dynamic> _documents = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await context.read<AppState>().auth.api.get('/api/staff/documents');
      if (mounted) {
        setState(() {
          _documents = (data['documents'] as List<dynamic>?) ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pick(ImageSource source) async {
    final file = await _picker.pickImage(source: source, imageQuality: 85);
    if (file == null) return;
    setState(() => _uploading = true);
    try {
      final api = context.read<AppState>().auth.api;
      final res = await api.uploadFile(path: '/api/chat/upload', file: File(file.path));
      final url = res['url']?.toString();
      final name = res['name']?.toString() ?? file.name;
      if (url == null) throw Exception('Upload failed');
      await api.post('/api/staff/documents', {
        'title': name,
        'fileUrl': url,
        'docType': 'OTHER',
        'notes': 'Uploaded via MernCrest Connect',
      });
      if (mounted) {
        setState(() {
          _lastUrl = url;
          _lastName = name;
          _uploading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload registered')));
        await _load();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _uploading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
      }
    }
  }

  Future<void> _openUrl(String? path) async {
    if (path == null || path.isEmpty) return;
    final uri = path.startsWith('http') ? Uri.parse(path) : Uri.parse('${ApiConfig.baseUrl}$path');
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('Upload Document'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20))],
      ),
      body: ConnectAmbientBackground(
        child: ListView(
          padding: const EdgeInsets.all(ConnectSpacing.lg),
          children: [
            ConnectCard(
              padding: const EdgeInsets.all(ConnectSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('HR & compliance files', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text('Upload certificates, IDs, or signed forms. Files are stored in your employee document registry.', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                ],
              ),
            ),
            const SizedBox(height: ConnectSpacing.sm),
            ConnectPrimaryButton(label: 'Take photo', icon: Icons.camera_alt_outlined, loading: _uploading, onPressed: () => _pick(ImageSource.camera)),
            const SizedBox(height: ConnectSpacing.xs),
            ConnectPrimaryButton(label: 'Choose from gallery', icon: Icons.photo_library_outlined, loading: _uploading, onPressed: () => _pick(ImageSource.gallery)),
            if (_lastUrl != null) ...[
              const SizedBox(height: ConnectSpacing.md),
              ConnectCard(
                padding: const EdgeInsets.all(ConnectSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_lastName ?? 'Uploaded file', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                    const SizedBox(height: ConnectSpacing.sm),
                    ConnectPrimaryButton(label: 'Open file', icon: Icons.open_in_new_rounded, onPressed: () => _openUrl(_lastUrl)),
                  ],
                ),
              ),
            ],
            const SizedBox(height: ConnectSpacing.md),
            const ConnectSectionHeader(title: 'Your uploads'),
            if (_loading)
              const Padding(padding: EdgeInsets.all(ConnectSpacing.lg), child: Center(child: CircularProgressIndicator(color: ConnectColors.primary)))
            else if (_documents.isEmpty)
              const ConnectEmptyState(icon: Icons.folder_open_outlined, title: 'No uploads yet', subtitle: 'Your HR documents will appear here.')
            else
              ..._documents.map((raw) {
                final d = raw as Map<String, dynamic>;
                final created = DateTime.tryParse(d['createdAt']?.toString() ?? '');
                return Padding(
                  padding: const EdgeInsets.only(bottom: ConnectSpacing.xs),
                  child: ConnectCard(
                    onTap: () => _openUrl(d['fileUrl']?.toString()),
                    padding: const EdgeInsets.all(ConnectSpacing.sm),
                    child: Row(
                      children: [
                        const Icon(Icons.description_outlined, color: ConnectModuleColors.docs, size: 20),
                        const SizedBox(width: ConnectSpacing.sm),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(d['title']?.toString() ?? 'Document', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                              Text(
                                created != null ? formatDateTime(created) : d['docType']?.toString() ?? '',
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 10),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.open_in_new_rounded, size: 16, color: ConnectColors.textMuted),
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
