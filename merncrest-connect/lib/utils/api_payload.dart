/// Helpers for parsing MernCrest API JSON (envelope + legacy shapes).
class ApiPayload {
  static List<dynamic> list(
    Map<String, dynamic> data, {
    List<String> keys = const [
      'data',
      'items',
      'records',
      'results',
      'invoices',
      'projects',
      'quotations',
      'tickets',
      'leads',
      'clients',
      'customers',
      'domains',
      'hostingAccounts',
      'payments',
      'events',
      'announcements',
      'notifications',
    ],
  }) {
    for (final key in keys) {
      final value = data[key];
      if (value is List) return value;
    }
    return [];
  }

  static String? string(Map<String, dynamic> item, List<String> keys) {
    for (final key in keys) {
      final value = item[key];
      if (value != null && value.toString().isNotEmpty) return value.toString();
    }
    return null;
  }

  static String title(Map<String, dynamic> item) =>
      string(item, ['title', 'subject', 'name', 'fullName', 'customerName', 'invoiceNumber', 'ticketNumber', 'leadNumber', 'projectCode']) ??
      'Record';

  static String subtitle(Map<String, dynamic> item) {
    final parts = <String>[
      if (string(item, ['status']) != null) string(item, ['status'])!,
      if (string(item, ['email']) != null) string(item, ['email'])!,
      if (string(item, ['company']) != null) string(item, ['company'])!,
      if (string(item, ['customerCode']) != null) string(item, ['customerCode'])!,
      if (item['user'] is Map) string(item['user'] as Map<String, dynamic>, ['fullName', 'email']) ?? '',
      if (item['client'] is Map) string(item['client'] as Map<String, dynamic>, ['fullName', 'company', 'email']) ?? '',
      if (item['project'] is Map) string(item['project'] as Map<String, dynamic>, ['name', 'projectCode']) ?? '',
      if (string(item, ['startsAt', 'workDate', 'createdAt', 'dueAt']) != null)
        string(item, ['startsAt', 'workDate', 'createdAt', 'dueAt'])!,
    ].where((s) => s.isNotEmpty);
    return parts.take(3).join(' · ');
  }
}
