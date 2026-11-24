import 'package:flutter/material.dart';

class ResultScreen extends StatelessWidget {
  final String title;
  final int score, correct, wrong;
  const ResultScreen({super.key, required this.title, required this.score, required this.correct, required this.wrong});
  @override
  Widget build(BuildContext context) {
    final total = correct + wrong;
    final emoji = wrong == 0 ? '🏆' : (correct * 2 >= total ? '🎉' : '💪');
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(emoji, style: const TextStyle(fontSize: 96)),
            const SizedBox(height: 12),
            Text('النقاط: $score', style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Text('✅ إجابات صحيحة: $correct', style: const TextStyle(fontSize: 24)),
            Text('❌ إجابات خاطئة: $wrong', style: const TextStyle(fontSize: 24)),
            const SizedBox(height: 32),
            SizedBox(width: double.infinity, height: 60,
                child: FilledButton(onPressed: () => Navigator.pop(context), child: const Text('رجوع للواجبات', style: TextStyle(fontSize: 22)))),
          ]),
        ),
      ),
    );
  }
}
