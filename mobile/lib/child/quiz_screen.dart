import 'package:flutter/material.dart';
import '../api.dart';
import '../widgets.dart';
import 'result_screen.dart';

const _palette = [Color(0xFFFF7043), Color(0xFF29B6F6), Color(0xFF66BB6A), Color(0xFFAB47BC)];

class QuizScreen extends StatefulWidget {
  final String childId, assignmentId, title;
  const QuizScreen({super.key, required this.childId, required this.assignmentId, required this.title});
  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  List<Map<String, dynamic>> _questions = [];
  int _index = 0, _total = 0, _offset = 0;
  bool _loading = true, _busy = false;
  String? _error, _pickedId;
  bool? _lastCorrect;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final d = await Api.instance.start(widget.childId, widget.assignmentId);
      final answered = (d['answeredQuestionIds'] as List).cast<String>().toSet();
      final all = (d['questions'] as List).cast<Map<String, dynamic>>();
      final remaining = all.where((q) => !answered.contains(q['questionId'])).toList();
      setState(() { _total = all.length; _offset = all.length - remaining.length; _questions = remaining; _index = 0; _loading = false; });
      if (remaining.isEmpty) await _finish();
    } on ApiException catch (e) {
      if (mounted) setState(() { _error = e.message; _loading = false; });
    }
  }

  Future<void> _pick(String optionId) async {
    if (_busy) return;
    setState(() { _busy = true; _pickedId = optionId; });
    try {
      final r = await Api.instance.answer(widget.childId, widget.assignmentId, _questions[_index]['questionId'], optionId);
      if (mounted) setState(() => _lastCorrect = r['isCorrect'] as bool);
    } on ApiException catch (e) {
      if (e.status != 409) { // 409 = already recorded, just move on
        if (mounted) {
          setState(() { _busy = false; _pickedId = null; });
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
        }
        return;
      }
    }
    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    if (_index + 1 >= _questions.length) {
      await _finish();
    } else {
      setState(() { _index++; _pickedId = null; _lastCorrect = null; _busy = false; });
    }
  }

  Future<void> _finish() async {
    try {
      final r = await Api.instance.finish(widget.childId, widget.assignmentId);
      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => ResultScreen(
          title: widget.title, score: r['score'], correct: r['correctCount'], wrong: r['wrongCount'])));
    } on ApiException catch (e) {
      if (mounted) setState(() { _error = e.message; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return Scaffold(appBar: AppBar(title: Text(widget.title)), body: const Center(child: CircularProgressIndicator()));
    if (_error != null) return Scaffold(appBar: AppBar(title: Text(widget.title)), body: ErrorView(message: _error!, onRetry: _load));
    final q = _questions[_index];
    final options = (q['options'] as List).cast<Map<String, dynamic>>();
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.all(16), children: [
          LinearProgressIndicator(value: (_offset + _index) / _total, minHeight: 12, borderRadius: BorderRadius.circular(8)),
          const SizedBox(height: 8),
          Text('السؤال ${_offset + _index + 1} من $_total', textAlign: TextAlign.center, style: const TextStyle(fontSize: 18)),
          const SizedBox(height: 16),
          Card(child: Padding(padding: const EdgeInsets.all(24),
              child: Text(q['text'], textAlign: TextAlign.center, style: const TextStyle(fontSize: 30, fontWeight: FontWeight.bold)))),
          const SizedBox(height: 16),
          for (var i = 0; i < options.length; i++) Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: SizedBox(
              height: 76,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: _pickedId == options[i]['id'] && _lastCorrect != null
                      ? (_lastCorrect! ? Colors.green : Colors.red)
                      : _palette[i % _palette.length],
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                onPressed: _busy ? null : () => _pick(options[i]['id']),
                child: Text(options[i]['text'], style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}
