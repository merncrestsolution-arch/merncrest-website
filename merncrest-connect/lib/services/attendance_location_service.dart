import 'dart:math';

import 'package:geolocator/geolocator.dart';

/// Office geo-fence defaults (MernCrest Colombo HQ area).
class AttendanceOfficeConfig {
  AttendanceOfficeConfig._();

  static const double officeLat = 6.927079;
  static const double officeLng = 79.861244;
  static const double fenceRadiusMeters = 350;
}

class AttendanceLocationResult {
  const AttendanceLocationResult({
    required this.position,
    required this.withinFence,
    required this.distanceMeters,
    required this.label,
  });

  final Position position;
  final bool withinFence;
  final double distanceMeters;
  final String label;
}

class AttendanceLocationService {
  Future<bool> ensurePermission() async {
    if (!await Geolocator.isLocationServiceEnabled()) return false;
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission == LocationPermission.always || permission == LocationPermission.whileInUse;
  }

  Future<AttendanceLocationResult> locate() async {
    final ok = await ensurePermission();
    if (!ok) {
      throw Exception('Location permission denied or services disabled');
    }

    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );

    final distance = _distanceMeters(
      position.latitude,
      position.longitude,
      AttendanceOfficeConfig.officeLat,
      AttendanceOfficeConfig.officeLng,
    );
    final within = distance <= AttendanceOfficeConfig.fenceRadiusMeters;
    final label = within
        ? 'Within office geo-fence (${distance.round()}m)'
        : 'Outside geo-fence (${distance.round()}m from HQ)';

    return AttendanceLocationResult(
      position: position,
      withinFence: within,
      distanceMeters: distance,
      label: label,
    );
  }

  double _distanceMeters(double lat1, double lng1, double lat2, double lng2) {
    const earthRadius = 6371000;
    final dLat = _degToRad(lat2 - lat1);
    final dLng = _degToRad(lng2 - lng1);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_degToRad(lat1)) * cos(_degToRad(lat2)) * sin(dLng / 2) * sin(dLng / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return earthRadius * c;
  }

  double _degToRad(double deg) => deg * pi / 180;

  static String punchNotes(AttendanceLocationResult result) {
    return 'GPS · lat:${result.position.latitude.toStringAsFixed(5)},lng:${result.position.longitude.toStringAsFixed(5)} · ${result.label}';
  }
}
