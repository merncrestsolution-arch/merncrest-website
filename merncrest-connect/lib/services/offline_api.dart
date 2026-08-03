import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/services/api_client.dart';
import 'package:merncrest_connect/services/offline_mutation_queue.dart';

/// POST/PATCH with offline queue when the device cannot reach the API.
Future<bool> postWithOfflineQueue(
  AppState state, {
  required String path,
  required Map<String, dynamic> body,
}) async {
  try {
    await state.auth.api.post(path, body);
    return true;
  } on ApiException catch (e) {
    if (e.statusCode == 0) {
      await OfflineMutationQueue.enqueue(path: path, body: body, method: 'POST');
      await state.sync?.refreshPendingMutations();
      return false;
    }
    throw e;
  }
}

Future<bool> patchWithOfflineQueue(
  AppState state, {
  required String path,
  required Map<String, dynamic> body,
}) async {
  try {
    await state.auth.api.patch(path, body);
    return true;
  } on ApiException catch (e) {
    if (e.statusCode == 0) {
      await OfflineMutationQueue.enqueue(path: path, body: body, method: 'PATCH');
      await state.sync?.refreshPendingMutations();
      return false;
    }
    throw e;
  }
}
