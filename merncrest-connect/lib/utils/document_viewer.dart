import 'package:flutter/material.dart';
import 'package:merncrest_connect/screens/html_document_screen.dart';

/// Opens a billing/HR document inside the app (WebView) — no external download.
void openInAppDocument(
  BuildContext context, {
  required String title,
  required String apiPath,
  String? filename,
  bool allowShare = true,
}) {
  Navigator.of(context).push(
    MaterialPageRoute(
      builder: (_) => HtmlDocumentScreen(
        title: title,
        apiPath: apiPath,
        filename: filename,
        allowShare: allowShare,
      ),
    ),
  );
}
