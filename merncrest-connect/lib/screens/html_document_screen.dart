import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/services/billing_document_service.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// In-app document viewer — invoices, receipts, payslips, reports (no download required).
class HtmlDocumentScreen extends StatefulWidget {
  const HtmlDocumentScreen({
    super.key,
    required this.title,
    required this.apiPath,
    this.filename,
    this.allowShare = true,
  });

  final String title;
  final String apiPath;
  final String? filename;
  final bool allowShare;

  @override
  State<HtmlDocumentScreen> createState() => _HtmlDocumentScreenState();
}

class _HtmlDocumentScreenState extends State<HtmlDocumentScreen> {
  final _docs = BillingDocumentService();
  String? _html;
  String? _error;
  bool _loading = true;
  bool _sharing = false;
  late final WebViewController _web;

  @override
  void initState() {
    super.initState();
    _web = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white);
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final token = context.read<AppState>().auth.api.token;
      final html = await _docs.fetchHtml(widget.apiPath, token);
      if (!mounted) return;
      setState(() {
        _html = html;
        _loading = false;
      });
      await _web.loadHtmlString(html);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _share() async {
    final html = _html;
    if (html == null) return;
    setState(() => _sharing = true);
    try {
      final name = widget.filename ?? '${widget.title.replaceAll(' ', '_')}.pdf';
      await _docs.shareAsPdf(html: html, filename: name, shareText: widget.title);
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: Text(widget.title, style: const TextStyle(fontSize: 14)),
        actions: [
          if (widget.allowShare && _html != null)
            IconButton(
              onPressed: _sharing ? null : _share,
              tooltip: 'Share',
              icon: _sharing
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.share_rounded, size: 20),
            ),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
          : _error != null
              ? Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ConnectEmptyState(
                      icon: Icons.error_outline_rounded,
                      title: 'Could not load document',
                      subtitle: _error!,
                    ),
                    Padding(
                      padding: const EdgeInsets.all(ConnectSpacing.lg),
                      child: ConnectPrimaryButton(label: 'Retry', icon: Icons.refresh_rounded, onPressed: _load),
                    ),
                  ],
                )
              : ColoredBox(
                  color: Colors.white,
                  child: WebViewWidget(controller: _web),
                ),
    );
  }
}
