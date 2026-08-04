/// Flatten staff navigation API `groups` into module rows for integrations / menus.
List<Map<String, dynamic>> flattenNavigationGroups(Map<String, dynamic>? navigation) {
  if (navigation == null) return [];
  final tabs = (navigation['tabs'] as List<dynamic>?) ?? [];
  final groups = (navigation['groups'] as List<dynamic>?) ?? [];
  final items = <Map<String, dynamic>>[];

  for (final tab in tabs) {
    if (tab is Map) {
      items.add(Map<String, dynamic>.from(tab));
    }
  }
  for (final group in groups) {
    if (group is! Map) continue;
    final groupItems = (group['items'] as List<dynamic>?) ?? [];
    for (final item in groupItems) {
      if (item is Map) items.add(Map<String, dynamic>.from(item));
    }
  }
  return items;
}
