import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final String message;
  final int? status;
  ApiException(this.message, [this.status]);
  @override
  String toString() => message;
}

/// Talks to the NestJS backend. No secrets live in the app; only the user's JWT (secure storage).
class Api {
  Api._();
  static final instance = Api._();
  // Override per build: flutter run --dart-define=API_URL=https://your-server
  static const baseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:3000');
  static const _timeout = Duration(seconds: 15);
  final _storage = const FlutterSecureStorage();
  String? _token;

  Future<bool> loadToken() async {
    _token = await _storage.read(key: 'token');
    return _token != null;
  }

  Future<void> logout() async {
    _token = null;
    await _storage.delete(key: 'token');
  }

  String _msg(int code) {
    switch (code) {
      case 400: return 'بيانات غير صحيحة';
      case 401: return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      case 403: return 'غير مسموح لك بهذا الإجراء';
      case 404: return 'غير موجود';
      case 409: return 'تم تنفيذ هذه العملية من قبل';
      default: return 'حدث خطأ، حاول مرة أخرى';
    }
  }

  Future<dynamic> _send(String method, String path, {Map<String, dynamic>? body}) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = {'Content-Type': 'application/json', if (_token != null) 'Authorization': 'Bearer $_token'};
    try {
      final res = method == 'GET'
          ? await http.get(uri, headers: headers).timeout(_timeout)
          : await http.post(uri, headers: headers, body: jsonEncode(body ?? {})).timeout(_timeout);
      if (res.statusCode == 401 && _token != null) {
        await logout();
        throw ApiException('انتهت الجلسة، سجّل الدخول من جديد', 401);
      }
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return res.body.isEmpty ? null : jsonDecode(utf8.decode(res.bodyBytes));
      }
      throw ApiException(_msg(res.statusCode), res.statusCode);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException('تعذّر الاتصال بالخادم، تأكد من الإنترنت');
    }
  }

  Future<void> login(String email, String password) async {
    final d = await _send('POST', '/auth/login', body: {'email': email.trim(), 'password': password});
    if (d['user']['role'] != 'PARENT') {
      throw ApiException('هذا التطبيق لأولياء الأمور فقط. استخدم لوحة الإدارة للمعلمات.');
    }
    _token = d['accessToken'] as String;
    await _storage.write(key: 'token', value: _token);
  }

  List<Map<String, dynamic>> _list(dynamic d) => (d as List).cast<Map<String, dynamic>>();
  Future<List<Map<String, dynamic>>> myChildren() async => _list(await _send('GET', '/me/children'));
  Future<List<Map<String, dynamic>>> assignments(String childId) async => _list(await _send('GET', '/children/$childId/assignments'));
  Future<Map<String, dynamic>> start(String childId, String aid) async =>
      (await _send('POST', '/children/$childId/assignments/$aid/start')) as Map<String, dynamic>;
  Future<Map<String, dynamic>> answer(String childId, String aid, String qid, String oid) async =>
      (await _send('POST', '/children/$childId/assignments/$aid/answers', body: {'questionId': qid, 'optionId': oid})) as Map<String, dynamic>;
  Future<Map<String, dynamic>> finish(String childId, String aid) async =>
      (await _send('POST', '/children/$childId/assignments/$aid/finish')) as Map<String, dynamic>;
}
