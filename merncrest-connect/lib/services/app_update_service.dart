import 'package:merncrest_connect/services/api_client.dart';
import 'package:package_info_plus/package_info_plus.dart';

class AppUpdateInfo {
  const AppUpdateInfo({
    required this.version,
    required this.build,
    required this.downloadUrl,
    required this.downloadFileName,
    required this.releaseNotes,
    required this.forceUpdate,
    required this.localVersion,
    required this.localBuild,
  });

  final String version;
  final int build;
  final String downloadUrl;
  final String downloadFileName;
  final List<String> releaseNotes;
  final bool forceUpdate;
  final String localVersion;
  final int localBuild;
}

class AppUpdateService {
  AppUpdateService({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  Future<AppUpdateInfo?> checkForUpdate() async {
    final package = await PackageInfo.fromPlatform();
    final localBuild = int.tryParse(package.buildNumber) ?? 0;

    final data = await _api.get('/api/auth/mobile/update');
    final latestBuild = (data['build'] as num?)?.toInt() ?? 0;
    if (latestBuild <= localBuild) return null;

    final notes = (data['releaseNotes'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .where((e) => e.isNotEmpty)
            .toList() ??
        const <String>[];

    return AppUpdateInfo(
      version: data['version']?.toString() ?? '0.0.0',
      build: latestBuild,
      downloadUrl: data['downloadUrl']?.toString() ?? '',
      downloadFileName: data['downloadFileName']?.toString() ?? 'merncrest-connect.apk',
      releaseNotes: notes,
      forceUpdate: data['forceUpdate'] == true,
      localVersion: package.version,
      localBuild: localBuild,
    );
  }
}
