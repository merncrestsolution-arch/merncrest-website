/// Helpers for MernCrest API envelope responses `{ success, data, meta }`.
List<dynamic> envelopeList(Map<String, dynamic> res, {String? listKey}) {
  if (listKey != null && res[listKey] is List) return res[listKey] as List;
  final data = res['data'];
  if (data is List) return data;
  if (data is Map) {
    for (final key in ['items', 'records', 'projects', 'invoices', 'tickets', 'clients', 'customers', 'domains', 'payments']) {
      if (data[key] is List) return data[key] as List;
    }
  }
  for (final key in ['projects', 'invoices', 'items', 'records', 'tickets', 'slips', 'clients', 'customers', 'domains', 'payments']) {
    if (res[key] is List) return res[key] as List;
  }
  return [];
}

Map<String, dynamic>? envelopeMeta(Map<String, dynamic> res) {
  final meta = res['meta'];
  if (meta is Map<String, dynamic>) return meta;
  return null;
}

/// Single-object payload from `{ success, data }` envelopes.
Map<String, dynamic>? envelopeData(Map<String, dynamic> res) {
  final data = res['data'];
  if (data is Map<String, dynamic>) return data;
  if (data is Map) return Map<String, dynamic>.from(data);
  return null;
}
