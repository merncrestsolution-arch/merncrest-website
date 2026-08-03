import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:merncrest_connect/config/api_config.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

/// Fetches invoice/receipt HTML from billing APIs using Bearer auth (mobile).
class BillingDocumentService {
  BillingDocumentService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<String> fetchHtml(String path, String? token) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    final headers = <String, String>{
      'Accept': 'text/html,application/xhtml+xml',
      'X-MernCrest-Client': 'connect-mobile',
      if (token != null) 'Authorization': 'Bearer $token',
    };
    final res = await _client.get(uri, headers: headers);
    if (res.statusCode >= 400) {
      throw Exception('Document request failed (${res.statusCode})');
    }
    return res.body;
  }

  Future<File> saveHtmlFile(String html, String filename) async {
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$filename');
    await file.writeAsString(html, flush: true);
    return file;
  }

  Future<void> shareHtmlFile({
    required String html,
    required String filename,
    String? shareText,
  }) async {
    final file = await saveHtmlFile(html, filename);
    await Share.shareXFiles(
      [XFile(file.path, mimeType: 'text/html', name: filename)],
      text: shareText,
    );
  }
}
