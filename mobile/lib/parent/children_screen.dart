import 'package:flutter/material.dart';
import '../api.dart';
import '../widgets.dart';
import 'login_screen.dart';
import 'homework_list_screen.dart';

class ChildrenScreen extends StatefulWidget {
  const ChildrenScreen({super.key});
  @override
  State<ChildrenScreen> createState() => _ChildrenScreenState();
}

class _ChildrenScreenState extends State<ChildrenScreen> {
  List<Map<String, dynamic>>? _children;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _error = null; _children = null; });
    try {
      final c = await Api.instance.myChildren();
      if (mounted) setState(() => _children = c);
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.status == 401) { _toLogin(); return; }
      setState(() => _error = e.message);
    }
  }

  void _toLogin() => Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false);

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: const Text('اختر الطفل'),
          actions: [IconButton(icon: const Icon(Icons.logout), tooltip: 'خروج', onPressed: () async { await Api.instance.logout(); if (mounted) _toLogin(); })],
        ),
        body: _error != null
            ? ErrorView(message: _error!, onRetry: _load)
            : _children == null
                ? const Center(child: CircularProgressIndicator())
                : _children!.isEmpty
                    ? const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('لا يوجد أطفال مرتبطون بحسابك. تواصل مع الحضانة.', textAlign: TextAlign.center, style: TextStyle(fontSize: 18))))
                    : ListView(
                        padding: const EdgeInsets.all(16),
                        children: _children!.map((c) => Card(
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                leading: const Text('🧒', style: TextStyle(fontSize: 40)),
                                title: Text(c['name'], style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                                subtitle: Text('فصل ${c['classroom']}', style: const TextStyle(fontSize: 16)),
                                trailing: const Icon(Icons.chevron_left),
                                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => HomeworkListScreen(childId: c['id'], childName: c['name']))),
                              ),
                            )).toList(),
                      ),
      );
}
