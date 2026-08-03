import 'package:flutter/material.dart';

/// Spacing, radii, shadows, and animation constants for MernCrest Connect.
abstract final class ConnectSpacing {
  static const xxs = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 20.0;
  static const xl = 24.0;
  static const xxl = 32.0;
}

abstract final class ConnectRadius {
  static const sm = 10.0;
  static const md = 14.0;
  static const lg = 18.0;
  static const xl = 22.0;
  static const pill = 999.0;
}

abstract final class ConnectDurations {
  static const fast = Duration(milliseconds: 150);
  static const normal = Duration(milliseconds: 250);
  static const slow = Duration(milliseconds: 400);
}

/// Module icon colors for colorful enterprise navigation.
abstract final class ConnectModuleColors {
  static const hr = Color(0xFF8B5CF6);
  static const crm = Color(0xFF3B82F6);
  static const erp = Color(0xFF10B981);
  static const finance = Color(0xFFF59E0B);
  static const chat = Color(0xFFEC4899);
  static const projects = Color(0xFF06B6D4);
  static const helpdesk = Color(0xFFEF4444);
  static const attendance = Color(0xFF22C55E);
  static const ai = Color(0xFFA855F7);
  static const docs = Color(0xFF64748B);
  static const calendar = Color(0xFFF97316);
  static const payroll = Color(0xFF14B8A6);
  static const inventory = Color(0xFF84CC16);
  static const security = Color(0xFF6366F1);
  static const settings = Color(0xFF94A3B8);
  static const sales = Color(0xFF0EA5E9);
  static const manufacturing = Color(0xFF78716C);
  static const fleet = Color(0xFFEA580C);
}

List<BoxShadow> connectSoftShadow(Color glow, {double blur = 20, double y = 6}) => [
      BoxShadow(color: glow.withValues(alpha: 0.14), blurRadius: blur, offset: Offset(0, y)),
    ];

List<BoxShadow> connectGlassShadow(Color base) => [
      BoxShadow(color: base.withValues(alpha: 0.25), blurRadius: 16, offset: const Offset(0, 4)),
    ];
