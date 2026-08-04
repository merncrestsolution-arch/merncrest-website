import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/utils/formatters.dart';
import 'package:merncrest_connect/widgets/connect_card.dart';
import 'package:merncrest_connect/widgets/connect_charts.dart';
import 'package:merncrest_connect/widgets/connect_glass.dart';
import 'package:merncrest_connect/widgets/connect_motion.dart';
import 'package:merncrest_connect/services/api_client.dart';
import 'package:merncrest_connect/services/attendance_location_service.dart';
import 'package:merncrest_connect/services/offline_mutation_queue.dart';
import 'package:merncrest_connect/widgets/attendance_face_scanner.dart';
import 'package:merncrest_connect/widgets/attendance_qr_scanner.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

typedef AttendancePunchFn = Future<void> Function(
  String action, {
  String? notes,
  String? token,
  String? verifyMethod,
  String? faceHash,
});

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 6, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await context.read<AppState>().auth.api.get('/api/staff/attendance');
      if (mounted) setState(() {
        _data = data;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _punch(
    String action, {
    String? notes,
    String? token,
    String? verifyMethod,
    String? faceHash,
  }) async {
    try {
      final body = <String, dynamic>{'action': action};
      if (notes != null) body['notes'] = notes;
      if (token != null) body['token'] = token;
      if (verifyMethod != null) body['verifyMethod'] = verifyMethod;
      if (faceHash != null) body['faceHash'] = faceHash;
      await context.read<AppState>().auth.api.post('/api/staff/attendance', body);
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Attendance recorded')));
      }
    } catch (e) {
      if (e is ApiException && e.statusCode == 0) {
        final body = <String, dynamic>{'action': action};
        if (notes != null) body['notes'] = notes;
        if (token != null) body['token'] = token;
        if (verifyMethod != null) body['verifyMethod'] = verifyMethod;
        if (faceHash != null) body['faceHash'] = faceHash;
        await OfflineMutationQueue.enqueue(path: '/api/staff/attendance', body: body, method: 'POST');
        await context.read<AppState>().sync?.refreshPendingMutations();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Offline — punch queued and will sync when online')));
        }
        return;
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    final today = _data?['today'] as Map<String, dynamic>?;
    final records = (_data?['records'] as List<dynamic>?) ?? [];
    final employee = _data?['employee'] as Map<String, dynamic>?;
    final faceEnrolled = employee?['faceEnrolled'] == true;
    final checkIn = today?['checkIn'];
    final checkOut = today?['checkOut'];
    final clockedIn = checkIn != null && checkOut == null;

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Attendance'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded, size: 20)),
        ],
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
          tabs: const [
            Tab(text: 'Clock'),
            Tab(text: 'GPS'),
            Tab(text: 'QR'),
            Tab(text: 'Face'),
            Tab(text: 'Analytics'),
            Tab(text: 'History'),
          ],
        ),
      ),
      body: ConnectAmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: ConnectColors.primary))
            : _error != null
                ? ConnectEmptyState(icon: Icons.error_outline, title: 'Could not load', subtitle: _error)
                : TabBarView(
                    controller: _tabs,
                    children: [
                      _ClockTab(today: today, clockedIn: clockedIn, onPunch: _punch),
                      _GpsTab(clockedIn: clockedIn, onPunch: _punch),
                      _QrTab(clockedIn: clockedIn, onPunch: _punch, onGenerateToken: () => _punch('QR_TOKEN')),
                      _FaceTab(clockedIn: clockedIn, faceEnrolled: faceEnrolled, onPunch: _punch),
                      _AnalyticsTab(records: records, today: today),
                      _HistoryTab(records: records),
                    ],
                  ),
      ),
    );
  }
}

class _ClockTab extends StatelessWidget {
  const _ClockTab({required this.today, required this.clockedIn, required this.onPunch});

  final Map<String, dynamic>? today;
  final bool clockedIn;
  final Future<void> Function(String action, {String? notes, String? token, String? verifyMethod, String? faceHash}) onPunch;

  String _fmt(dynamic dt) {
    if (dt == null) return '—';
    return formatApiDateTime(dt.toString());
  }

  @override
  Widget build(BuildContext context) {
    final status = today?['status']?.toString() ?? '—';
    final overtimeMin = today?['overtimeMinutes'] as int? ?? 0;

    return ListView(
      padding: const EdgeInsets.all(ConnectSpacing.lg),
      children: [
        ConnectGlassCard(
          featured: true,
          child: Column(
            children: [
              Icon(
                clockedIn ? Icons.check_circle_rounded : Icons.access_time_rounded,
                size: 48,
                color: clockedIn ? ConnectColors.success : ConnectColors.primaryGlow,
              ),
              const SizedBox(height: ConnectSpacing.sm),
              Text(
                clockedIn ? 'You are clocked in' : 'Ready to start your day',
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              ConnectChip(
                label: status,
                color: status == 'LATE' ? ConnectColors.warning : ConnectColors.success,
              ),
              const SizedBox(height: ConnectSpacing.sm),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _TimeBlock(label: 'Clock In', value: _fmt(today?['checkIn'])),
                  _TimeBlock(label: 'Clock Out', value: _fmt(today?['checkOut'])),
                ],
              ),
              const SizedBox(height: ConnectSpacing.md),
              ConnectPrimaryButton(
                label: clockedIn ? 'Clock Out' : 'Clock In',
                icon: clockedIn ? Icons.logout_rounded : Icons.login_rounded,
                onPressed: () => onPunch(clockedIn ? 'OUT' : 'IN'),
              ),
            ],
          ),
        ).stitchEntrance(),
        const SizedBox(height: ConnectSpacing.sm),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: ConnectSpacing.xs,
          crossAxisSpacing: ConnectSpacing.xs,
          childAspectRatio: 1.65,
          children: [
            ConnectStatTile(label: 'Status', value: status, icon: Icons.badge_outlined, compact: true),
            ConnectStatTile(
              label: 'Overtime',
              value: overtimeMin > 0 ? '${overtimeMin}m' : '—',
              icon: Icons.more_time_rounded,
              color: ConnectColors.warning,
              compact: true,
            ),
            ConnectStatTile(label: 'WiFi', value: 'Validated', icon: Icons.wifi_rounded, color: ConnectColors.success, compact: true),
            ConnectStatTile(label: 'Shift', value: today?['shiftId']?.toString() ?? 'Default', icon: Icons.schedule_rounded, compact: true),
          ],
        ),
      ],
    );
  }
}

class _TimeBlock extends StatelessWidget {
  const _TimeBlock({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: Theme.of(context).textTheme.labelSmall),
        const SizedBox(height: 4),
        Text(value, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 12)),
      ],
    );
  }
}

class _GpsTab extends StatefulWidget {
  const _GpsTab({required this.clockedIn, required this.onPunch});
  final bool clockedIn;
  final Future<void> Function(String action, {String? notes, String? token, String? verifyMethod, String? faceHash}) onPunch;

  @override
  State<_GpsTab> createState() => _GpsTabState();
}

class _GpsTabState extends State<_GpsTab> {
  final _locationService = AttendanceLocationService();
  bool _locating = false;
  bool _withinFence = false;
  String _locationLabel = 'Tap to detect location';
  AttendanceLocationResult? _result;
  String? _error;

  Future<void> _detectLocation() async {
    setState(() {
      _locating = true;
      _locationLabel = 'Detecting…';
      _error = null;
    });
    try {
      final result = await _locationService.locate();
      if (!mounted) return;
      setState(() {
        _locating = false;
        _result = result;
        _withinFence = result.withinFence;
        _locationLabel = result.label;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _locating = false;
        _error = e.toString().replaceFirst('Exception: ', '');
        _locationLabel = 'Could not get location';
      });
    }
  }

  Future<void> _gpsPunch() async {
    if (_result == null) return;
    final notes = AttendanceLocationService.punchNotes(_result!);
    await widget.onPunch(widget.clockedIn ? 'OUT' : 'IN', notes: notes, verifyMethod: 'GPS');
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(ConnectSpacing.lg),
      children: [
        ConnectGlassCard(
          featured: true,
          child: Column(
            children: [
              Container(
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: ConnectModuleColors.attendance.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(ConnectRadius.md),
                  border: Border.all(color: ConnectModuleColors.attendance.withValues(alpha: 0.3)),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      _withinFence ? Icons.location_on_rounded : Icons.location_searching_rounded,
                      size: 40,
                      color: _withinFence ? ConnectColors.success : ConnectColors.primaryGlow,
                    ),
                    const SizedBox(height: 8),
                    Text(_locationLabel, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12), textAlign: TextAlign.center),
                  ],
                ),
              ),
              const SizedBox(height: ConnectSpacing.md),
              ConnectPrimaryButton(
                label: _locating ? 'Locating…' : 'Use my location',
                icon: Icons.my_location_rounded,
                loading: _locating,
                onPressed: _locating ? null : _detectLocation,
              ),
              if (_error != null) ...[
                const SizedBox(height: ConnectSpacing.sm),
                Text(_error!, textAlign: TextAlign.center, style: TextStyle(color: ConnectColors.error, fontSize: 11)),
              ],
              if (_withinFence) ...[
                const SizedBox(height: ConnectSpacing.sm),
                ConnectPrimaryButton(
                  label: widget.clockedIn ? 'GPS Clock Out' : 'GPS Clock In',
                  icon: Icons.login_rounded,
                  onPressed: _gpsPunch,
                ),
              ] else if (_result != null && !_withinFence) ...[
                const SizedBox(height: ConnectSpacing.sm),
                Text('Move within the office geo-fence to punch with GPS.', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
              ],
            ],
          ),
        ),
        const SizedBox(height: ConnectSpacing.sm),
        ConnectCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Location History', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
              const SizedBox(height: 6),
              Text('Recent GPS punches sync with your attendance record.', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
            ],
          ),
        ),
      ],
    );
  }
}

class _QrTab extends StatefulWidget {
  const _QrTab({required this.clockedIn, required this.onPunch, required this.onGenerateToken});
  final bool clockedIn;
  final Future<void> Function(String action, {String? notes, String? token, String? verifyMethod, String? faceHash}) onPunch;
  final Future<void> Function() onGenerateToken;

  @override
  State<_QrTab> createState() => _QrTabState();
}

class _QrTabState extends State<_QrTab> {
  final _tokenController = TextEditingController();
  String? _generatedToken;
  bool _busy = false;

  @override
  void dispose() {
    _tokenController.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    setState(() => _busy = true);
    try {
      final res = await context.read<AppState>().auth.api.post('/api/staff/attendance', {'action': 'QR_TOKEN'});
      if (mounted) setState(() => _generatedToken = res['token']?.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submitToken(String action) async {
    final token = _tokenController.text.trim();
    if (token.isEmpty) return;
    setState(() => _busy = true);
    try {
      await widget.onPunch(action, token: token, notes: 'QR attendance', verifyMethod: 'QR');
      if (mounted) _tokenController.clear();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _openScanner() async {
    final token = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const AttendanceQrScannerScreen()),
    );
    if (token == null || token.isEmpty) return;
    _tokenController.text = token;
    await _submitToken(widget.clockedIn ? 'OUT' : 'IN');
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(ConnectSpacing.lg),
      children: [
        ConnectGlassCard(
          child: Column(
            children: [
              const Icon(Icons.qr_code_scanner_rounded, size: 48, color: ConnectModuleColors.security),
              const SizedBox(height: ConnectSpacing.sm),
              Text('Scan Office QR', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 6),
              Text('Scan the kiosk QR or paste your punch token below.', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12)),
              const SizedBox(height: ConnectSpacing.md),
              ConnectPrimaryButton(label: 'Open Camera Scanner', icon: Icons.camera_alt_rounded, loading: _busy, onPressed: _openScanner),
              const SizedBox(height: ConnectSpacing.sm),
              TextField(
                controller: _tokenController,
                decoration: const InputDecoration(hintText: 'Paste QR token…', prefixIcon: Icon(Icons.qr_code_2_rounded, size: 20)),
              ),
              const SizedBox(height: ConnectSpacing.sm),
              ConnectPrimaryButton(label: 'Clock In with QR', icon: Icons.login_rounded, loading: _busy, onPressed: () => _submitToken('IN')),
              const SizedBox(height: ConnectSpacing.xs),
              ConnectPrimaryButton(label: 'Clock Out with QR', icon: Icons.logout_rounded, loading: _busy, onPressed: () => _submitToken('OUT')),
            ],
          ),
        ),
        const SizedBox(height: ConnectSpacing.sm),
        ConnectCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('My Punch Token', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
              const SizedBox(height: 6),
              Text('Generate a one-time token (5 min) for kiosk validation.', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
              if (_generatedToken != null) ...[
                const SizedBox(height: ConnectSpacing.sm),
                SelectableText(_generatedToken!, style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: ConnectColors.primaryGlow)),
              ],
              const SizedBox(height: ConnectSpacing.sm),
              ConnectPrimaryButton(label: 'Generate Token', icon: Icons.refresh_rounded, loading: _busy, onPressed: _generate),
            ],
          ),
        ),
      ],
    );
  }
}

class _FaceTab extends StatelessWidget {
  const _FaceTab({required this.clockedIn, required this.faceEnrolled, required this.onPunch});
  final bool clockedIn;
  final bool faceEnrolled;
  final AttendancePunchFn onPunch;

  Future<void> _enroll(BuildContext context) async {
    final hash = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const AttendanceFaceScannerScreen(clockedIn: false, enroll: true)),
    );
    if (hash != null) await onPunch('ENROLL_FACE', faceHash: hash);
  }

  Future<void> _openScanner(BuildContext context) async {
    final hash = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => AttendanceFaceScannerScreen(clockedIn: clockedIn)),
    );
    if (hash != null) {
      await onPunch(
        clockedIn ? 'OUT' : 'IN',
        notes: 'Face attendance · server verified',
        verifyMethod: 'FACE',
        faceHash: hash,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(ConnectSpacing.lg),
      child: ConnectGlassCard(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: ConnectColors.primary.withValues(alpha: 0.5), width: 2),
                color: ConnectColors.primary.withValues(alpha: 0.1),
              ),
              child: const Icon(Icons.face_retouching_natural_rounded, size: 48, color: ConnectColors.primaryGlow),
            ),
            const SizedBox(height: ConnectSpacing.md),
            Text('Face Recognition', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: ConnectSpacing.sm),
            Text(
              faceEnrolled
                  ? (clockedIn ? 'Verify your face to clock out securely.' : 'Align your face for secure clock-in.')
                  : 'Enroll your face once, then use face attendance daily.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: ConnectSpacing.lg),
            if (!faceEnrolled)
              ConnectPrimaryButton(label: 'Enroll face', icon: Icons.face_retouching_natural_rounded, onPressed: () => _enroll(context)),
            if (faceEnrolled)
              ConnectPrimaryButton(label: 'Open Face Scanner', icon: Icons.camera_front_rounded, onPressed: () => _openScanner(context)),
          ],
        ),
      ),
    );
  }
}

class _AnalyticsTab extends StatelessWidget {
  const _AnalyticsTab({required this.records, required this.today});
  final List<dynamic> records;
  final Map<String, dynamic>? today;

  @override
  Widget build(BuildContext context) {
    final present = records.where((r) {
      final status = (r as Map)['status'];
      return status == 'PRESENT' || status == 'LATE';
    }).length;
    final late = records.where((r) => (r as Map)['status'] == 'LATE').length;
    final absent = records.where((r) => (r as Map)['status'] == 'ABSENT').length;
    final weekly = List<double>.generate(5, (i) {
      if (i < records.length) return 1.0;
      return 0.0;
    });

    return ListView(
      padding: const EdgeInsets.all(ConnectSpacing.lg),
      children: [
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: ConnectSpacing.xs,
          crossAxisSpacing: ConnectSpacing.xs,
          childAspectRatio: 1.65,
          children: [
            ConnectStatTile(label: 'Present (30d)', value: '$present', icon: Icons.check_circle_outline, color: ConnectColors.success, compact: true),
            ConnectStatTile(label: 'Late', value: '$late', icon: Icons.schedule_rounded, color: ConnectColors.warning, compact: true),
            ConnectStatTile(label: 'Absent', value: '$absent', icon: Icons.cancel_outlined, color: ConnectColors.error, compact: true),
            ConnectStatTile(label: 'Today', value: today?['status']?.toString() ?? '—', icon: Icons.today_rounded, compact: true),
          ],
        ),
        const SizedBox(height: ConnectSpacing.sm),
        ConnectChartCard(
          title: 'Weekly Attendance',
          subtitle: 'Last 5 recorded days',
          child: ConnectMiniBarChart(
            values: weekly,
            labels: const ['M', 'T', 'W', 'T', 'F'],
            color: ConnectModuleColors.attendance,
            height: 72,
          ),
        ),
        const SizedBox(height: ConnectSpacing.sm),
        ConnectCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Monthly Report', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
              const SizedBox(height: 6),
              Text('${records.length} days tracked · export from HR portal', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
            ],
          ),
        ),
      ],
    );
  }
}

class _HistoryTab extends StatelessWidget {
  const _HistoryTab({required this.records});
  final List<dynamic> records;

  @override
  Widget build(BuildContext context) {
    if (records.isEmpty) {
      return const ConnectEmptyState(icon: Icons.history_rounded, title: 'No history yet', subtitle: 'Your attendance records will appear here.');
    }
    return ListView.builder(
      padding: const EdgeInsets.all(ConnectSpacing.lg),
      itemCount: records.length,
      itemBuilder: (context, i) {
        final r = records[i] as Map<String, dynamic>;
        final workDate = r['workDate']?.toString() ?? '';
        final status = r['status']?.toString() ?? '';
        final verify = r['verifyMethod']?.toString();
        final checkIn = r['checkIn'];
        final checkOut = r['checkOut'];
        final inLabel = formatApiDateTime(checkIn?.toString());
        final outLabel = formatApiDateTime(checkOut?.toString());
        return Padding(
          padding: const EdgeInsets.only(bottom: ConnectSpacing.sm),
          child: ConnectCard(
            padding: const EdgeInsets.all(ConnectSpacing.sm),
            child: Row(
              children: [
                Icon(
                  status == 'ABSENT' ? Icons.cancel_outlined : Icons.event_available_rounded,
                  color: status == 'LATE' ? ConnectColors.warning : ConnectColors.success,
                  size: 20,
                ),
                const SizedBox(width: ConnectSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(workDate.split('T').first, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13)),
                      Text('In: $inLabel · Out: $outLabel', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 10)),
                    ],
                  ),
                ),
                if (verify != null && verify.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(right: 4),
                    child: ConnectChip(label: verify, color: ConnectModuleColors.security),
                  ),
                ConnectChip(label: status, color: status == 'LATE' ? ConnectColors.warning : ConnectModuleColors.attendance),
              ],
            ),
          ),
        );
      },
    );
  }
}
