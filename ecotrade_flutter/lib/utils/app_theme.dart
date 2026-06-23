import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'api_config.dart';

class AppColors {
  // ✅ New brand colors (your requested palette)
  static const Color darkGreen = Color(0xFF05401C); // #05401c
  static const Color lightGreen = Color(0xFF44A81D); // #44a81d

  // Background & surfaces (light)
  static const Color bg = Colors.white;
  static const Color bgCard = Color(0xFFFAFAFA); // subtle grey for cards
  static const Color bgSecondary = Color(0xFFF5F5F5); // secondary background

  // Text colors (dark on light)
  static const Color textPrimary = darkGreen; // dark green for headings
  static const Color textMuted = Color(0xFF6B7280); // grey for secondary text
  static const Color textDim = Color(0xFF9CA3AF); // lighter grey

  // Accent & status colors (keep existing)
  static const Color green400 = lightGreen;
  static const Color green500 = lightGreen;
  static const Color green600 = Color(0xFF3B8C1E);
  static const Color green700 = darkGreen;
  static const Color yellow = Color(0xFFFBBF24);
  static const Color blue = Color(0xFF60A5FA);
  static const Color red = Color(0xFFF87171);
  static const Color purple = Color(0xFFC084FC);

  // Border & dividers
  static const Color border = Color(0xFFE5E7EB); // light grey
}

class AppTheme {
  static ThemeData get light => ThemeData(
        useMaterial3: true,
        brightness: Brightness.light, // ✅ light theme
        scaffoldBackgroundColor: AppColors.bg, // white background

        colorScheme: const ColorScheme.light(
          primary: AppColors.darkGreen,
          secondary: AppColors.lightGreen,
          surface: AppColors.bg,
          onSurface: AppColors.textPrimary,
          error: Colors.red,
        ),

        // Typography
        textTheme: GoogleFonts.plusJakartaSansTextTheme(
          const TextTheme(
            headlineMedium: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppColors.darkGreen,
              letterSpacing: -0.5,
            ),
            bodyLarge: TextStyle(
              fontSize: 16,
              color: AppColors.textPrimary,
            ),
            bodyMedium: TextStyle(
              fontSize: 14,
              color: AppColors.textMuted,
            ),
            labelSmall: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textMuted,
              letterSpacing: 0.4,
            ),
          ),
        ),

        // AppBar (light background)
        appBarTheme: AppBarTheme(
          backgroundColor: AppColors.bg,
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: false,
          titleTextStyle: GoogleFonts.plusJakartaSans(
            color: AppColors.darkGreen,
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
          iconTheme: const IconThemeData(color: AppColors.darkGreen),
        ),

        // Input fields – light background, dark green borders, black text
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.grey.shade50, // very light grey fill
          hintStyle: const TextStyle(
            color: AppColors.textDim,
            fontSize: 14,
          ),
          labelStyle: const TextStyle(
            color: AppColors.darkGreen,
            fontWeight: FontWeight.w500,
          ),
          // Black text for input (enforced by default)
          prefixIconColor: AppColors.darkGreen.withOpacity(0.6),
          suffixIconColor: AppColors.darkGreen.withOpacity(0.6),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide:
                BorderSide(color: AppColors.darkGreen.withOpacity(0.15)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppColors.lightGreen, width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: Colors.red),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: Colors.red, width: 2),
          ),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),

        // Buttons – dark green background, white text
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.darkGreen,
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            textStyle: GoogleFonts.plusJakartaSans(
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
            disabledBackgroundColor: AppColors.darkGreen.withOpacity(0.6),
          ),
        ),

        // Cards – light grey background, subtle border
        cardTheme: CardThemeData(
          color: AppColors.bgCard,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: AppColors.darkGreen.withOpacity(0.15)),
          ),
        ),

        // SnackBar – light background, dark text
        snackBarTheme: SnackBarThemeData(
          backgroundColor: AppColors.bgCard,
          contentTextStyle: GoogleFonts.plusJakartaSans(
            color: AppColors.textPrimary,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          behavior: SnackBarBehavior.floating,
          actionTextColor: AppColors.lightGreen,
        ),

        // Optional: set text selection color
        textSelectionTheme: const TextSelectionThemeData(
          cursorColor: AppColors.darkGreen,
          selectionColor: AppColors.lightGreen,
          selectionHandleColor: AppColors.lightGreen,
        ),
      );

  // If you still need a dark theme variant, you can add it later.
}

class AppConstants {
  static String get baseUrl => ApiConfig.baseUrl;
}
