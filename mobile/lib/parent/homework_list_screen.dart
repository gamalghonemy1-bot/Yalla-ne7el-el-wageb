import 'package:flutter/material.dart';
import '../api.dart';
import '../widgets.dart';
import '../child/quiz_screen.dart';
import '../child/result_screen.dart';

class HomeworkListScreen extends StatefulWidget {
  final String childId, childName;
  const HomeworkListScreen({super.key, required this.childId, required this.childName});
  @override
  State<HomeworkListScreen> createState() => _HomeworkListScreenState();
}

class _HomeworkListScreenState extends State<HomeworkListScreen> {
  List<Map<String, dynamic>>? _items;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _error = null; });
    try {
      final l = await Api.instance.assignments(widget.childId);
      if (mounted) setState(() => _items = l);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  Future<void> _open(Map<String, dynamic> a) async {
    final done = a['status'] == 'COMPLETED';
    await Navigator.push(context, MaterialPageRoute(builder: (_) => done
        ? ResultScreen(title: a['title'], score: a['score'], correct: a['correctCount'], wrong: a['wrongCount'])
        : QuizScreen(childId: widget.childId, assignmentId: a['id'], title: a['title'])));
    _load();
  }

  Widget _tile(Map<String, dynamic> a) {
    final done = a['status'] == 'COMPLETED';
    final due = a['dueDate'] != null ? 'التسليم: ${(a['dueDate'] as String).substring(0, 10)}' : null;
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Text(done ? '⭐' : '📚', style: const TextStyle(fontSize: 36)),
        title: Text(a['title'], style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
        subtitle: Text(done ? 'النقاط: ${a['score']}  |  صحيحة ${a['correctCount']}  |  خاطئة ${a['wrongCount']}'
            : '${a['questionCount']} أسئلة${due != null ? '  |  $due' : ''}', style: const TextStyle(fontSize: 15)),
        trailing: done ? null : const Icon(Icons.play_circle_fill, size: 40, color: Colors.deepPurple),
        onTap: () => _open(a),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pending = (_items ?? []).where((a) => a['status'] != 'COMPLETED').toList();
    final done = (_items ?? []).where((a) => a['status'] == 'COMPLETED').toList();
    return Scaffold(
      appBar: AppBar(title: Text('واجبات ${widget.childName}')),
      body: _error != null
          ? ErrorView(message: _error!, onRetry: _load)
          : _items == null
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(padding: const EdgeInsets.all(16), children: [
                    const Text('الواجبات المطلوبة', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    if (pending.isEmpty) const Padding(padding: EdgeInsets.all(12), child: Text('لا توجد واجبات مطلوبة 🎉', style: TextStyle(fontSize: 16))),
                    ...pending.map(_tile),
                    const SizedBox(height: 16),
                    const Text('الواجبات السابقة', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    if (done.isEmpty) const Padding(padding: EdgeInsets.all(12), child: Text('لا توجد واجبات سابقة', style: TextStyle(fontSize: 16))),
                    ...done.map(_tile),
                  ]),
                ),
    );
  }
}
