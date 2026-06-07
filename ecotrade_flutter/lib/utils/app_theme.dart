import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const bg          = Color(0xFF060D0A);
  static const bgSecondary = Color(0xFF0D1A12);
  static const bgCard      = Color(0xFF111F16);
  static const green400    = Color(0xFF4ADE80);
  static const green500    = Color(0xFF22C55E);
  static const green600    = Color(0xFF16A34A);
  static const green700    = Color(0xFF15803D);
  static const textPrimary = Color(0xFFF0FDF4);
  static const textMuted   = Color(0xFF4B7A5A);
  static const textDim     = Color(0xFF2D5040);
  static const border      = Color(0x1A86EFAC);
  static const yellow      = Color(0xFFFBBF24);
  static const blue        = Color(0xFF60A5FA);
  static const red         = Color(0xFFF87171);
  static const purple      = Color(0xFFC084FC);
}

class AppTheme {
  static ThemeData get dark => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.bg,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.green500,
      surface: AppColors.bgCard,
      onSurface: AppColors.textPrimary,
    ),
    textTheme: GoogleFonts.plusJakartaSansTextTheme(
      const TextTheme(
        bodyLarge:  TextStyle(color: AppColors.textPrimary),
        bodyMedium: TextStyle(color: AppColors.textMuted),
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.bg,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.plusJakartaSans(
        color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.w800,
      ),
      iconTheme: const IconThemeData(color: AppColors.textPrimary),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.bgCard,
      hintStyle: const TextStyle(color: AppColors.textDim, fontSize: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.green500, width: 2)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.green500, foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: GoogleFonts.plusJakartaSans(fontSize: 15, fontWeight: FontWeight.w700),
        elevation: 0,
      ),
    ),
    cardTheme: CardThemeData(
      color: AppColors.bgCard, elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.border),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: AppColors.bgCard,
      contentTextStyle: GoogleFonts.plusJakartaSans(color: AppColors.textPrimary),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      behavior: SnackBarBehavior.floating,
    ),
  );
}

class AppConstants {
  // Android emulator uses 10.0.2.2 to reach PC localhost
  // Physical device: change to your PC's WiFi IP e.g. http://192.168.1.121:5000/api
  static const String baseUrl = 'http://10.0.2.2:5000/api';
}
