import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// Luminous Enterprise — matches system.merncrest.lk (Stitch System surface).
class ConnectColors {
  static const background = Color(0xFF0E0E12);
  static const surface = Color(0xFF131317);
  static const surfaceRaised = Color(0xFF1C1C22);
  static const surfaceOverlay = Color(0xFF25252D);
  static const border = Color(0xFF4A4455);
  static const borderSubtle = Color(0xFF353439);
  static const primary = Color(0xFF7C3AED);
  static const primaryDark = Color(0xFF5B21B6);
  static const primaryGlow = Color(0xFFD2BBFF);
  static const accent = Color(0xFFEC4899);
  static const textPrimary = Color(0xFFF8FAFC);
  static const textSecondary = Color(0xFF94A3B8);
  static const textMuted = Color(0xFF64748B);
  static const success = Color(0xFF22C55E);
  static const warning = Color(0xFFF59E0B);
  static const error = Color(0xFFEF4444);
  static const info = Color(0xFF38BDF8);

  static const heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1E1035), Color(0xFF0E0E12), Color(0xFF1A0F2E)],
  );

  static const cardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2A1F4A), Color(0xFF131317)],
  );

  static const brandGradient = LinearGradient(
    colors: [Color(0xFF7C3AED), Color(0xFFBE185D)],
  );
}

class ConnectTheme {
  static ThemeData dark() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: ConnectColors.background,
      colorScheme: const ColorScheme.dark(
        primary: ConnectColors.primary,
        secondary: ConnectColors.accent,
        surface: ConnectColors.surface,
        error: ConnectColors.error,
        onPrimary: Colors.white,
        onSurface: ConnectColors.textPrimary,
      ),
    );

    final inter = GoogleFonts.interTextTheme(base.textTheme).apply(
      bodyColor: ConnectColors.textPrimary,
      displayColor: ConnectColors.textPrimary,
    );

    return base.copyWith(
      textTheme: inter.copyWith(
        headlineLarge: GoogleFonts.plusJakartaSans(
          fontSize: 28,
          fontWeight: FontWeight.w800,
          color: ConnectColors.textPrimary,
          letterSpacing: -0.5,
        ),
        headlineMedium: GoogleFonts.plusJakartaSans(
          fontSize: 22,
          fontWeight: FontWeight.w700,
          color: ConnectColors.textPrimary,
        ),
        titleLarge: GoogleFonts.plusJakartaSans(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: ConnectColors.textPrimary,
        ),
        titleMedium: GoogleFonts.plusJakartaSans(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: ConnectColors.textPrimary,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          color: ConnectColors.textSecondary,
        ),
        labelSmall: GoogleFonts.jetBrainsMono(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: ConnectColors.textMuted,
          letterSpacing: 0.6,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: ConnectColors.background,
        foregroundColor: ConnectColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        titleTextStyle: GoogleFonts.plusJakartaSans(
          fontSize: 17,
          fontWeight: FontWeight.w700,
          color: ConnectColors.textPrimary,
        ),
      ),
      cardTheme: CardThemeData(
        color: ConnectColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: ConnectColors.borderSubtle),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: ConnectColors.surfaceRaised,
        labelStyle: const TextStyle(color: ConnectColors.textSecondary),
        hintStyle: const TextStyle(color: ConnectColors.textMuted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: ConnectColors.borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: ConnectColors.borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: ConnectColors.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ConnectColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      dividerTheme: const DividerThemeData(color: ConnectColors.borderSubtle, thickness: 1),
      splashColor: ConnectColors.primary.withValues(alpha: 0.12),
      highlightColor: ConnectColors.primary.withValues(alpha: 0.08),
    );
  }
}
