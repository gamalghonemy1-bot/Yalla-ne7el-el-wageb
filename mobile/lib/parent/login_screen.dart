import 'package:flutter/material.dart';
import '../api.dart';
import 'children_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _pass = TextEditingController();
  bool _busy = false;
  String? _error;

  Future<void> _submit() async {
    if (_email.text.trim().isEmpty || _pass.text.isEmpty) {
      setState(() => _error = 'اكتب البريد الإلكتروني وكلمة المرور');
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      await Api.instance.login(_email.text, _pass.text);
      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const ChildrenScreen()));
    } on ApiException catch (e) {
      setState(() { _error = e.message; _busy = false; });
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(children: [
                const Text('🦁', style: TextStyle(fontSize: 80)),
                const Text('يلا نحل الواجب', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                TextField(controller: _email, keyboardType: TextInputType.emailAddress, textDirection: TextDirection.ltr,
                    decoration: const InputDecoration(labelText: 'البريد الإلكتروني', border: OutlineInputBorder())),
                const SizedBox(height: 12),
                TextField(controller: _pass, obscureText: true, textDirection: TextDirection.ltr,
                    onSubmitted: (_) => _submit(),
                    decoration: const InputDecoration(labelText: 'كلمة المرور', border: OutlineInputBorder())),
                if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 16))),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity, height: 56,
                  child: FilledButton(onPressed: _busy ? null : _submit,
                      child: _busy ? const CircularProgressIndicator() : const Text('دخول', style: TextStyle(fontSize: 22))),
                ),
              ]),
            ),
          ),
        ),
      );
}
