import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:merncrest_connect/providers/theme_provider.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';

/// Brand accents — shared across light and dark modes.
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

  static const lightCardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFEDE9FE), Color(0xFFFFFFFF)],
  );

  static const brandGradient = LinearGradient(
    colors: [Color(0xFF7C3AED), Color(0xFFBE185D)],
  );

  static const glassGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0x33FFFFFF), Color(0x0DFFFFFF)],
  );
}

/// Dynamic palette via ThemeExtension — use [ConnectPalette.of] in widgets.
class ConnectPalette extends ThemeExtension<ConnectPalette> {
  const ConnectPalette({
    required this.background,
    required this.surface,
    required this.surfaceRaised,
    required this.surfaceOverlay,
    required this.border,
    required this.borderSubtle,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.glassFill,
    required this.glassBorder,
    required this.accentHighlight,
    required this.disabledFill,
    required this.isLight,
    required this.isAmoled,
  });

  final Color background;
  final Color surface;
  final Color surfaceRaised;
  final Color surfaceOverlay;
  final Color border;
  final Color borderSubtle;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color glassFill;
  final Color glassBorder;
  /// Selected nav icons, module accents — readable on current surface.
  final Color accentHighlight;
  final Color disabledFill;
  final bool isLight;
  final bool isAmoled;

  Gradient get featuredCardGradient => isLight ? ConnectColors.lightCardGradient : ConnectColors.cardGradient;

  double get ambientOrbAlpha => isLight ? 0.07 : 0.18;

  static ConnectPalette of(BuildContext context) {
    final ext = Theme.of(context).extension<ConnectPalette>();
    return ext ?? ConnectPalette.dark();
  }

  factory ConnectPalette.dark() => const ConnectPalette(
        background: ConnectColors.background,
        surface: ConnectColors.surface,
        surfaceRaised: ConnectColors.surfaceRaised,
        surfaceOverlay: ConnectColors.surfaceOverlay,
        border: ConnectColors.border,
        borderSubtle: ConnectColors.borderSubtle,
        textPrimary: ConnectColors.textPrimary,
        textSecondary: ConnectColors.textSecondary,
        textMuted: ConnectColors.textMuted,
        glassFill: Color(0x1AFFFFFF),
        glassBorder: Color(0x33FFFFFF),
        accentHighlight: ConnectColors.primaryGlow,
        disabledFill: ConnectColors.borderSubtle,
        isLight: false,
        isAmoled: false,
      );

  factory ConnectPalette.light() => const ConnectPalette(
        background: Color(0xFFF1F5F9),
        surface: Color(0xFFFFFFFF),
        surfaceRaised: Color(0xFFFFFFFF),
        surfaceOverlay: Color(0xFFE2E8F0),
        border: Color(0xFFCBD5E1),
        borderSubtle: Color(0xFFE2E8F0),
        textPrimary: Color(0xFF0F172A),
        textSecondary: Color(0xFF475569),
        textMuted: Color(0xFF64748B),
        glassFill: Color(0xF2FFFFFF),
        glassBorder: Color(0xFFD8DEE9),
        accentHighlight: ConnectColors.primary,
        disabledFill: Color(0xFFE2E8F0),
        isLight: true,
        isAmoled: false,
      );

  factory ConnectPalette.amoled() => const ConnectPalette(
        background: Color(0xFF000000),
        surface: Color(0xFF0A0A0A),
        surfaceRaised: Color(0xFF111111),
        surfaceOverlay: Color(0xFF1A1A1A),
        border: Color(0xFF2A2A2A),
        borderSubtle: Color(0xFF1F1F1F),
        textPrimary: Color(0xFFF8FAFC),
        textSecondary: Color(0xFF94A3B8),
        textMuted: Color(0xFF64748B),
        glassFill: Color(0x14FFFFFF),
        glassBorder: Color(0x28FFFFFF),
        accentHighlight: ConnectColors.primaryGlow,
        disabledFill: Color(0xFF1F1F1F),
        isLight: false,
        isAmoled: true,
      );

  @override
  ConnectPalette copyWith({
    Color? background,
    Color? surface,
    Color? surfaceRaised,
    Color? surfaceOverlay,
    Color? border,
    Color? borderSubtle,
    Color? textPrimary,
    Color? textSecondary,
    Color? textMuted,
    Color? glassFill,
    Color? glassBorder,
    Color? accentHighlight,
    Color? disabledFill,
    bool? isLight,
    bool? isAmoled,
  }) {
    return ConnectPalette(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceRaised: surfaceRaised ?? this.surfaceRaised,
      surfaceOverlay: surfaceOverlay ?? this.surfaceOverlay,
      border: border ?? this.border,
      borderSubtle: borderSubtle ?? this.borderSubtle,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textMuted: textMuted ?? this.textMuted,
      glassFill: glassFill ?? this.glassFill,
      glassBorder: glassBorder ?? this.glassBorder,
      accentHighlight: accentHighlight ?? this.accentHighlight,
      disabledFill: disabledFill ?? this.disabledFill,
      isLight: isLight ?? this.isLight,
      isAmoled: isAmoled ?? this.isAmoled,
    );
  }

  @override
  ConnectPalette lerp(ThemeExtension<ConnectPalette>? other, double t) {
    if (other is! ConnectPalette) return this;
    return ConnectPalette(
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceRaised: Color.lerp(surfaceRaised, other.surfaceRaised, t)!,
      surfaceOverlay: Color.lerp(surfaceOverlay, other.surfaceOverlay, t)!,
      border: Color.lerp(border, other.border, t)!,
      borderSubtle: Color.lerp(borderSubtle, other.borderSubtle, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      glassFill: Color.lerp(glassFill, other.glassFill, t)!,
      glassBorder: Color.lerp(glassBorder, other.glassBorder, t)!,
      accentHighlight: Color.lerp(accentHighlight, other.accentHighlight, t)!,
      disabledFill: Color.lerp(disabledFill, other.disabledFill, t)!,
      isLight: t < 0.5 ? isLight : other.isLight,
      isAmoled: t < 0.5 ? isAmoled : other.isAmoled,
    );
  }
}

class ConnectTheme {
  static ThemeData forMode(ConnectThemeMode mode) {
    switch (mode) {
      case ConnectThemeMode.light:
        return light();
      case ConnectThemeMode.amoled:
        return amoled();
      case ConnectThemeMode.dark:
        return dark();
    }
  }

  static ThemeData dark() => _build(
        brightness: Brightness.dark,
        palette: ConnectPalette.dark(),
        overlayStyle: SystemUiOverlayStyle.light,
      );

  static ThemeData light() => _build(
        brightness: Brightness.light,
        palette: ConnectPalette.light(),
        overlayStyle: SystemUiOverlayStyle.dark,
      );

  static ThemeData amoled() => _build(
        brightness: Brightness.dark,
        palette: ConnectPalette.amoled(),
        overlayStyle: SystemUiOverlayStyle.light,
      );

  static ThemeData _build({
    required Brightness brightness,
    required ConnectPalette palette,
    required SystemUiOverlayStyle overlayStyle,
  }) {
    final isDark = brightness == Brightness.dark;
    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: palette.background,
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: ConnectColors.primary,
        onPrimary: Colors.white,
        secondary: ConnectColors.accent,
        onSecondary: Colors.white,
        surface: palette.surface,
        onSurface: palette.textPrimary,
        error: ConnectColors.error,
        onError: Colors.white,
      ),
      extensions: [palette],
    );

    final inter = GoogleFonts.interTextTheme(base.textTheme).apply(
      bodyColor: palette.textPrimary,
      displayColor: palette.textPrimary,
    );

    return base.copyWith(
      textTheme: inter.copyWith(
        headlineLarge: GoogleFonts.plusJakartaSans(
          fontSize: 26,
          fontWeight: FontWeight.w800,
          color: palette.textPrimary,
          letterSpacing: -0.5,
        ),
        headlineMedium: GoogleFonts.plusJakartaSans(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: palette.textPrimary,
        ),
        titleLarge: GoogleFonts.plusJakartaSans(
          fontSize: 17,
          fontWeight: FontWeight.w700,
          color: palette.textPrimary,
        ),
        titleMedium: GoogleFonts.plusJakartaSans(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: palette.textPrimary,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 13,
          color: palette.textSecondary,
        ),
        labelSmall: GoogleFonts.jetBrainsMono(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: palette.textMuted,
          letterSpacing: 0.6,
        ),
      ),
      iconTheme: IconThemeData(color: palette.textSecondary),
      appBarTheme: AppBarTheme(
        backgroundColor: palette.background,
        foregroundColor: palette.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        systemOverlayStyle: overlayStyle,
        iconTheme: IconThemeData(color: palette.textSecondary),
        titleTextStyle: GoogleFonts.plusJakartaSans(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: palette.textPrimary,
        ),
      ),
      cardTheme: CardThemeData(
        color: palette.surfaceRaised,
        elevation: palette.isLight ? 1 : 0,
        shadowColor: palette.isLight ? Colors.black.withValues(alpha: 0.06) : Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(ConnectRadius.lg),
          side: BorderSide(color: palette.borderSubtle),
        ),
      ),
      tabBarTheme: TabBarThemeData(
        labelColor: palette.accentHighlight,
        unselectedLabelColor: palette.textMuted,
        indicatorColor: ConnectColors.primary,
        dividerColor: palette.borderSubtle,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: palette.surface,
        selectedItemColor: ConnectColors.primary,
        unselectedItemColor: palette.textMuted,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: palette.surfaceRaised,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: GoogleFonts.plusJakartaSans(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: palette.textPrimary,
        ),
        contentTextStyle: GoogleFonts.inter(fontSize: 13, color: palette.textSecondary),
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: palette.surfaceRaised,
        textStyle: TextStyle(color: palette.textPrimary, fontSize: 13),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: palette.surfaceOverlay,
        labelStyle: TextStyle(color: palette.textSecondary, fontSize: 11),
        side: BorderSide(color: palette.borderSubtle),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ConnectRadius.pill)),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: ConnectColors.primary),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: palette.isLight ? palette.surfaceOverlay.withValues(alpha: 0.35) : palette.surfaceRaised,
        labelStyle: TextStyle(color: palette.textSecondary),
        hintStyle: TextStyle(color: palette.textMuted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(ConnectRadius.md),
          borderSide: BorderSide(color: palette.borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(ConnectRadius.md),
          borderSide: BorderSide(color: palette.borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(ConnectRadius.md),
          borderSide: const BorderSide(color: ConnectColors.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ConnectColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ConnectRadius.md)),
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 14),
        ),
      ),
      dividerTheme: DividerThemeData(color: palette.borderSubtle, thickness: 1),
      splashColor: ConnectColors.primary.withValues(alpha: 0.12),
      highlightColor: ConnectColors.primary.withValues(alpha: 0.08),
    );
  }
}
