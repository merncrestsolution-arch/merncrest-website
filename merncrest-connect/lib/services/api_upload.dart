import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:merncrest_connect/config/api_config.dart';
import 'package:merncrest_connect/services/api_client.dart';

extension ApiClientUpload on ApiClient {
  Future<Map<String, dynamic>> uploadFile({
    required String path,
    required File file,
    String fieldName = 'file',
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    final request = http.MultipartRequest('POST', uri);
    request.headers['Accept'] = 'application/json';
    request.headers['X-MernCrest-Client'] = 'connect-mobile';
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    request.files.add(await http.MultipartFile.fromPath(fieldName, file.path));

    final streamed = await request.send();
    final body = await streamed.stream.bytesToString();
    Map<String, dynamic> data;
    try {
      data = body.isEmpty ? <String, dynamic>{} : jsonDecode(body) as Map<String, dynamic>;
    } catch (_) {
      throw ApiException(statusCode: streamed.statusCode, message: 'Invalid upload response');
    }
    if (streamed.statusCode >= 400) {
      throw ApiException(
        statusCode: streamed.statusCode,
        message: data['error']?.toString() ?? 'Upload failed',
      );
    }
    return data;
  }
}
