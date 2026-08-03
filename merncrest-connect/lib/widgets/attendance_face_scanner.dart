import 'dart:io';

import 'package:camera/camera.dart';
import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:permission_handler/permission_handler.dart';

/// Face attendance — captures a still frame and returns SHA-256 hash for server verification.
class AttendanceFaceScannerScreen extends StatefulWidget {
  const AttendanceFaceScannerScreen({
    super.key,
    required this.clockedIn,
    this.enroll = false,
  });

  final bool clockedIn;
  final bool enroll;

  @override
  State<AttendanceFaceScannerScreen> createState() => _AttendanceFaceScannerScreenState();
}

class _AttendanceFaceScannerScreenState extends State<AttendanceFaceScannerScreen> {
  CameraController? _camera;
  bool _loading = true;
  bool _scanning = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    final status = await Permission.camera.request();
    if (!status.isGranted) {
      setState(() {
        _error = 'Camera permission is required for face attendance';
        _loading = false;
      });
      return;
    }

    try {
      final cameras = await availableCameras();
      final front = cameras.where((c) => c.lensDirection == CameraLensDirection.front).firstOrNull ?? cameras.firstOrNull;
      if (front == null) {
        setState(() {
          _error = 'No camera available on this device';
          _loading = false;
        });
        return;
      }
      final controller = CameraController(front, ResolutionPreset.medium, enableAudio: false);
      await controller.initialize();
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() {
        _camera = controller;
        _loading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _camera?.dispose();
    super.dispose();
  }

  Future<void> _captureAndVerify() async {
    if (_scanning || _camera == null || !_camera!.value.isInitialized) return;
    setState(() => _scanning = true);
    try {
      final file = await _camera!.takePicture();
      final bytes = await File(file.path).readAsBytes();
      final hash = sha256.convert(bytes).toString();
      if (!mounted) return;
      Navigator.of(context).pop(hash);
    } catch (e) {
      if (mounted) {
        setState(() {
          _scanning = false;
          _error = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final title = widget.enroll ? 'Enroll Face' : 'Face Attendance';

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(title: Text(title)),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
          : _error != null
              ? ConnectEmptyState(icon: Icons.face_retouching_natural_outlined, title: 'Camera unavailable', subtitle: _error)
              : Column(
                  children: [
                    Expanded(
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          if (_camera != null && _camera!.value.isInitialized)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(ConnectRadius.lg),
                              child: CameraPreview(_camera!),
                            ),
                          if (_scanning)
                            Container(
                              color: ConnectColors.primary.withValues(alpha: 0.25),
                              child: const Center(child: CircularProgressIndicator(color: ConnectColors.primaryGlow)),
                            ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(ConnectSpacing.lg),
                      child: Column(
                        children: [
                          Text(
                            widget.enroll
                                ? 'Capture your face for secure attendance'
                                : widget.clockedIn
                                    ? 'Verify face to clock out'
                                    : 'Align your face in the frame',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: ConnectSpacing.sm),
                          Text(
                            'Server verifies your face hash against your enrolled profile',
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11),
                          ),
                          const SizedBox(height: ConnectSpacing.md),
                          ConnectPrimaryButton(
                            label: _scanning
                                ? 'Capturing…'
                                : widget.enroll
                                    ? 'Enroll face'
                                    : widget.clockedIn
                                        ? 'Face clock out'
                                        : 'Face clock in',
                            icon: Icons.face_retouching_natural_rounded,
                            loading: _scanning,
                            onPressed: _scanning ? null : _captureAndVerify,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }
}
