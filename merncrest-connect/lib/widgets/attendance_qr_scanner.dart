import 'package:flutter/material.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

/// Full-screen QR scanner for attendance kiosk tokens.
class AttendanceQrScannerScreen extends StatefulWidget {
  const AttendanceQrScannerScreen({super.key});

  @override
  State<AttendanceQrScannerScreen> createState() => _AttendanceQrScannerScreenState();
}

class _AttendanceQrScannerScreenState extends State<AttendanceQrScannerScreen> {
  final _controller = MobileScannerController(detectionSpeed: DetectionSpeed.noDuplicates);
  bool _handled = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_handled) return;
    final raw = capture.barcodes.firstOrNull?.rawValue?.trim();
    if (raw == null || raw.isEmpty) return;
    _handled = true;
    Navigator.of(context).pop(raw);
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Scan QR'),
        backgroundColor: Colors.black,
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(controller: _controller, onDetect: _onDetect),
          Positioned(
            left: ConnectSpacing.lg,
            right: ConnectSpacing.lg,
            bottom: ConnectSpacing.lg + MediaQuery.of(context).padding.bottom,
            child: Container(
              padding: const EdgeInsets.all(ConnectSpacing.md),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.65),
                borderRadius: BorderRadius.circular(ConnectRadius.md),
              ),
              child: const Text(
                'Align the office QR code within the frame. The token will be used automatically.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
