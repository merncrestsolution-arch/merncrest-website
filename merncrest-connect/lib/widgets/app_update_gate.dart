import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/services/app_update_service.dart';
import 'package:merncrest_connect/widgets/app_update_overlay.dart';
import 'package:provider/provider.dart';

/// Checks for APK updates on launch and when the app resumes.
class AppUpdateGate extends StatefulWidget {
  const AppUpdateGate({super.key, required this.child});

  final Widget child;

  @override
  State<AppUpdateGate> createState() => _AppUpdateGateState();
}

class _AppUpdateGateState extends State<AppUpdateGate> with WidgetsBindingObserver {
  final _service = AppUpdateService();
  AppUpdateInfo? _update;
  bool _checking = false;
  int? _dismissedBuild;
  bool _checkedAfterBootstrap = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _check();
    }
  }

  Future<void> _check() async {
    if (_checking) return;
    _checking = true;
    try {
      final info = await _service.checkForUpdate();
      if (!mounted) return;
      if (info == null) {
        setState(() => _update = null);
        return;
      }
      if (!info.forceUpdate && _dismissedBuild == info.build) return;
      setState(() => _update = info);
      // Brief snackbar so users see an update message even before reading the overlay.
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Update available — v${info.version} (build ${info.build})'),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (_) {
      /* offline — keep using installed build */
    } finally {
      _checking = false;
    }
  }

  void _dismiss() {
    final build = _update?.build;
    setState(() {
      _dismissedBuild = build;
      _update = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final loading = context.watch<AppState>().loading;
    if (!loading && !_checkedAfterBootstrap) {
      _checkedAfterBootstrap = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => _check());
    }

    final update = _update;
    return Stack(
      fit: StackFit.expand,
      children: [
        widget.child,
        if (update != null)
          AppUpdateOverlay(
            info: update,
            onDismiss: update.forceUpdate ? null : _dismiss,
          ),
      ],
    );
  }
}
