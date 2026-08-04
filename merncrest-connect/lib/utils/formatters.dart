import 'package:intl/intl.dart';

/// MernCrest business timezone (Sri Lanka, UTC+5:30).
const Duration kSriLankaOffset = Duration(hours: 5, minutes: 30);

String greetingForHour(int hour) {
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

String formatCurrencyCents(dynamic cents, {String symbol = 'LKR '}) {
  final value = (cents is num ? cents : int.tryParse(cents?.toString() ?? '') ?? 0) / 100;
  if (value >= 1000000) return '$symbol${(value / 1000000).toStringAsFixed(1)}M';
  if (value >= 1000) return '$symbol${(value / 1000).toStringAsFixed(1)}K';
  return '$symbol${NumberFormat('#,##0').format(value)}';
}

String formatCompact(num value) {
  if (value >= 1000000) return '${(value / 1000000).toStringAsFixed(1)}M';
  if (value >= 1000) return '${(value / 1000).toStringAsFixed(1)}K';
  return value.toString();
}

/// Parse API ISO timestamps and display in Sri Lanka wall time.
DateTime? parseApiDateTime(String? raw) {
  if (raw == null || raw.isEmpty) return null;
  final dt = DateTime.tryParse(raw);
  if (dt == null) return null;
  return dt.toUtc().add(kSriLankaOffset);
}

DateTime nowInSriLanka() => DateTime.now().toUtc().add(kSriLankaOffset);

bool isSameCalendarDay(DateTime a, DateTime b) =>
    a.year == b.year && a.month == b.month && a.day == b.day;

String formatTime(DateTime dt) => DateFormat('h:mm a').format(dt);
String formatDate(DateTime dt) => DateFormat('EEE, MMM d').format(dt);
String formatDateTime(DateTime dt) => DateFormat('MMM d, h:mm a').format(dt);

String formatApiTime(String? raw) {
  final dt = parseApiDateTime(raw);
  return dt != null ? formatTime(dt) : raw ?? '';
}

String formatApiDate(String? raw) {
  final dt = parseApiDateTime(raw);
  return dt != null ? formatDate(dt) : raw ?? '';
}

String formatApiDateTime(String? raw) {
  final dt = parseApiDateTime(raw);
  return dt != null ? formatDateTime(dt) : raw ?? '';
}

String initialsFromName(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.isEmpty) return '?';
  if (parts.length == 1) return parts[0][0].toUpperCase();
  return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
}

String clientDisplayName(Map<String, dynamic>? client) {
  if (client == null) return '';
  return client['company']?.toString().trim().isNotEmpty == true
      ? client['company']!.toString()
      : client['fullName']?.toString().trim().isNotEmpty == true
          ? client['fullName']!.toString()
          : client['name']?.toString().trim().isNotEmpty == true
              ? client['name']!.toString()
              : client['email']?.toString() ?? '';
}

String billingCycleLabel(String? cycle) {
  switch (cycle?.toUpperCase()) {
    case 'MONTHLY':
      return 'Monthly';
    case 'QUARTERLY':
      return 'Quarterly';
    case 'ANNUAL':
      return 'Annual';
    case 'ONE_TIME':
      return 'One time';
    default:
      return cycle ?? '—';
  }
}
