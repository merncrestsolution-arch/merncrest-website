import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:merncrest_connect/config/api_config.dart';

class ApiClient {
  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;
  String? _token;

  void setToken(String? token) => _token = token;
  String? get token => _token;

  Map<String, String> _headers({bool json = true}) {
    final h = <String, String>{
      if (json) 'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-MernCrest-Client': 'connect-mobile',
    };
    if (_token != null) h['Authorization'] = 'Bearer $_token';
    return h;
  }

  Uri _uri(String path, [Map<String, String>? query]) {
    return Uri.parse('${ApiConfig.baseUrl}$path').replace(queryParameters: query);
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? query}) async {
    try {
      final res = await _client.get(_uri(path, query), headers: _headers());
      return _decode(res);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException(
        statusCode: 0,
        message: 'Cannot reach server at ${ApiConfig.baseUrl}. Check your connection.',
      );
    }
  }

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    try {
      final res = await _client.post(
        _uri(path),
        headers: _headers(),
        body: jsonEncode(body),
      );
      return _decode(res);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        statusCode: 0,
        message: 'Cannot reach server at ${ApiConfig.baseUrl}. Is the API running?',
      );
    }
  }

  Future<Map<String, dynamic>> patch(String path, Map<String, dynamic> body) async {
    final res = await _client.patch(
      _uri(path),
      headers: _headers(),
      body: jsonEncode(body),
    );
    return _decode(res);
  }

  Map<String, dynamic> _decode(http.Response res) {
    Map<String, dynamic> data;
    try {
      data = res.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      throw ApiException(
        statusCode: res.statusCode,
        message: 'Server returned an invalid response (${res.statusCode})',
      );
    }
    if (res.statusCode >= 400) {
      throw ApiException(
        statusCode: res.statusCode,
        message: data['error']?.toString() ?? 'Request failed (${res.statusCode})',
      );
    }
    return data;
  }
}

class ApiException implements Exception {
  ApiException({required this.statusCode, required this.message});
  final int statusCode;
  final String message;

  @override
  String toString() => message;
}
