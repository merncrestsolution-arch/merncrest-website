import 'package:intl/intl.dart';

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

String formatTime(DateTime dt) => DateFormat('h:mm a').format(dt);
String formatDate(DateTime dt) => DateFormat('EEE, MMM d').format(dt);
String formatDateTime(DateTime dt) => DateFormat('MMM d, h:mm a').format(dt);

String initialsFromName(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.isEmpty) return '?';
  if (parts.length == 1) return parts[0][0].toUpperCase();
  return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
}
