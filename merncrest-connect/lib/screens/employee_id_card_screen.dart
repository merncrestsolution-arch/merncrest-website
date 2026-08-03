import 'dart:io';

import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:screenshot/screenshot.dart';
import 'package:share_plus/share_plus.dart';

class EmployeeIdCardScreen extends StatefulWidget {
  const EmployeeIdCardScreen({super.key});

  @override
  State<EmployeeIdCardScreen> createState() => _EmployeeIdCardScreenState();
}

class _EmployeeIdCardScreenState extends State<EmployeeIdCardScreen> {
  final _screenshot = ScreenshotController();
  bool _sharing = false;
  bool _exportingPdf = false;

  Future<void> _shareCard({
    required String name,
    required String jobTitle,
    required String department,
    required String employeeCode,
    required String email,
    required String branch,
    required String payload,
  }) async {
    setState(() => _sharing = true);
    try {
      final bytes = await _screenshot.capture(pixelRatio: 2);
      if (bytes != null) {
        final dir = await getTemporaryDirectory();
        final file = File('${dir.path}/merncrest-id-card.png');
        await file.writeAsBytes(bytes);
        await Share.shareXFiles(
          [XFile(file.path, name: 'merncrest-id-card.png')],
          text: 'MernCrest ID · $name · $employeeCode',
        );
        return;
      }
      await Share.share(
        'MernCrest Connect ID\n$name\n$jobTitle · $department\n$email\n$branch\nID: $employeeCode\n$payload',
      );
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  Future<void> _exportPdf({
    required String name,
    required String jobTitle,
    required String department,
    required String employeeCode,
    required String email,
    required String branch,
    required String payload,
  }) async {
    setState(() => _exportingPdf = true);
    try {
      final doc = pw.Document();
      doc.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a6,
          margin: const pw.EdgeInsets.all(20),
          build: (context) => pw.Container(
            decoration: const pw.BoxDecoration(
              gradient: pw.LinearGradient(
                begin: pw.Alignment.topLeft,
                end: pw.Alignment.bottomRight,
                colors: [PdfColor.fromInt(0xFF4C1D95), PdfColor.fromInt(0xFF7C3AED)],
              ),
            ),
            padding: const pw.EdgeInsets.all(20),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Row(
                  children: [
                    pw.Text('MernCrest', style: pw.TextStyle(color: PdfColors.white, fontSize: 16, fontWeight: pw.FontWeight.bold)),
                    pw.Spacer(),
                    pw.Text(employeeCode.isNotEmpty ? employeeCode : 'STAFF', style: const pw.TextStyle(color: PdfColors.grey400, fontSize: 10)),
                  ],
                ),
                pw.SizedBox(height: 18),
                pw.Text(name, style: pw.TextStyle(color: PdfColors.white, fontSize: 20, fontWeight: pw.FontWeight.bold)),
                pw.Text(jobTitle, style: const pw.TextStyle(color: PdfColors.grey300, fontSize: 12)),
                if (department.isNotEmpty) pw.Text(department, style: const pw.TextStyle(color: PdfColors.grey400, fontSize: 11)),
                pw.SizedBox(height: 10),
                pw.Text(email, style: const pw.TextStyle(color: PdfColors.grey300, fontSize: 10)),
                pw.Text(branch, style: const pw.TextStyle(color: PdfColors.grey400, fontSize: 9)),
                pw.SizedBox(height: 16),
                pw.Center(
                  child: pw.BarcodeWidget(
                    barcode: pw.Barcode.qrCode(),
                    data: payload,
                    width: 88,
                    height: 88,
                    color: PdfColors.white,
                    backgroundColor: PdfColors.white,
                  ),
                ),
                pw.SizedBox(height: 8),
                pw.Center(child: pw.Text('Digital staff ID', style: pw.TextStyle(color: PdfColors.grey400, fontSize: 8))),
              ],
            ),
          ),
        ),
      );
      await Printing.sharePdf(
        bytes: await doc.save(),
        filename: 'merncrest-id-${employeeCode.isNotEmpty ? employeeCode : 'staff'}.pdf',
      );
    } finally {
      if (mounted) setState(() => _exportingPdf = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final user = state.user?['user'] as Map<String, dynamic>?;
    final employee = state.user?['employee'] as Map<String, dynamic>?;
    final name = user?['fullName']?.toString() ?? state.displayName;
    final email = user?['email']?.toString() ?? '';
    final jobTitle = employee?['jobTitle']?.toString() ?? 'Staff';
    final department = employee?['department']?.toString() ?? '';
    final employeeCode = employee?['employeeNumber']?.toString() ?? employee?['employeeCode']?.toString() ?? '';
    final branch = employee?['branch']?['name']?.toString() ?? 'MernCrest';
    final payload = 'MERNCREST:EMP:${employee?['id'] ?? user?['id']}:$employeeCode';

    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(
        title: const Text('Digital ID Card'),
        actions: [
          IconButton(
            onPressed: _sharing
                ? null
                : () => _shareCard(
                      name: name,
                      jobTitle: jobTitle,
                      department: department,
                      employeeCode: employeeCode,
                      email: email,
                      branch: branch,
                      payload: payload,
                    ),
            icon: _sharing
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.share_rounded, size: 20),
          ),
        ],
      ),
      body: ConnectAmbientBackground(
        child: ListView(
          padding: const EdgeInsets.all(ConnectSpacing.lg),
          children: [
            RepaintBoundary(
              child: Screenshot(
                controller: _screenshot,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: ConnectColors.brandGradient,
                    borderRadius: BorderRadius.circular(ConnectRadius.lg),
                    boxShadow: [
                      BoxShadow(
                        color: ConnectColors.primary.withValues(alpha: 0.35),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(ConnectSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text('MernCrest', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                            const Spacer(),
                            Text(employeeCode.isNotEmpty ? employeeCode : 'STAFF', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                          ],
                        ),
                        const SizedBox(height: ConnectSpacing.lg),
                        Row(
                          children: [
                            ConnectAvatar(label: name, size: 64),
                            const SizedBox(width: ConnectSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(name, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                                  Text(jobTitle, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                                  Text(department, style: const TextStyle(color: Colors.white60, fontSize: 11)),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: ConnectSpacing.md),
                        Text(email, style: const TextStyle(color: Colors.white70, fontSize: 11)),
                        Text(branch, style: const TextStyle(color: Colors.white60, fontSize: 10)),
                        const SizedBox(height: ConnectSpacing.md),
                        Center(
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(ConnectRadius.sm)),
                            child: QrImageView(data: payload, size: 96, backgroundColor: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: ConnectSpacing.sm),
            ConnectPrimaryButton(
              label: 'Export PDF',
              icon: Icons.picture_as_pdf_outlined,
              loading: _exportingPdf,
              onPressed: () => _exportPdf(
                name: name,
                jobTitle: jobTitle,
                department: department,
                employeeCode: employeeCode,
                email: email,
                branch: branch,
                payload: payload,
              ),
            ),
            const SizedBox(height: ConnectSpacing.xs),
            ConnectPrimaryButton(
              label: 'Share ID card',
              icon: Icons.ios_share_rounded,
              loading: _sharing,
              onPressed: () => _shareCard(
                name: name,
                jobTitle: jobTitle,
                department: department,
                employeeCode: employeeCode,
                email: email,
                branch: branch,
                payload: payload,
              ),
            ),
            const SizedBox(height: ConnectSpacing.sm),
            ConnectCard(
              padding: const EdgeInsets.all(ConnectSpacing.md),
              child: Text(
                'Present this card at security checkpoints or office kiosks. For attendance QR tokens, use Attendance → QR.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
