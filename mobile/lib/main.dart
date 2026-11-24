import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:google_fonts/google_fonts.dart';
import 'api.dart';
import 'parent/children_screen.dart';
import 'parent/login_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final loggedIn = await Api.instance.loadToken();
  runApp(YallaApp(loggedIn: loggedIn));
}

class YallaApp extends StatelessWidget {
  final bool loggedIn;
  const YallaApp({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'يلا نحل الواجب',
        debugShowCheckedModeBanner: false,
        locale: const Locale('ar', 'EG'), // forces RTL
        supportedLocales: const [Locale('ar', 'EG')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF7C4DFF), secondary: const Color(0xFFFF9800)),
          scaffoldBackgroundColor: const Color(0xFFFFF8E1),
          textTheme: GoogleFonts.cairoTextTheme(),
        ),
        home: loggedIn ? const ChildrenScreen() : const LoginScreen(),
      );
}
