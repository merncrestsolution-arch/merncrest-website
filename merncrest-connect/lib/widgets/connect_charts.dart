import 'package:flutter/material.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';

/// Simple bar chart for dashboard performance widgets.
class ConnectMiniBarChart extends StatelessWidget {
  const ConnectMiniBarChart({
    super.key,
    required this.values,
    this.labels,
    this.color = ConnectColors.primary,
    this.height = 80,
  });

  final List<double> values;
  final List<String>? labels;
  final Color color;
  final double height;

  @override
  Widget build(BuildContext context) {
    if (values.isEmpty) return SizedBox(height: height);
    final max = values.reduce((a, b) => a > b ? a : b);
    final palette = ConnectPalette.of(context);

    return SizedBox(
      height: height,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(values.length, (i) {
          final v = values[i];
          final ratio = max > 0 ? v / max : 0.0;
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Expanded(
                    child: Align(
                      alignment: Alignment.bottomCenter,
                      child: AnimatedContainer(
                        duration: ConnectDurations.slow,
                        curve: Curves.easeOutCubic,
                        width: double.infinity,
                        height: (height - 20) * ratio.clamp(0.08, 1.0),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(6),
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [color, color.withValues(alpha: 0.5)],
                          ),
                        ),
                      ),
                    ),
                  ),
                  if (labels != null && i < labels!.length) ...[
                    const SizedBox(height: 4),
                    Text(
                      labels![i],
                      style: TextStyle(fontSize: 9, color: palette.textMuted),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

/// Sparkline-style line chart.
class ConnectSparkline extends StatelessWidget {
  const ConnectSparkline({
    super.key,
    required this.values,
    this.color = ConnectColors.primaryGlow,
    this.height = 48,
  });

  final List<double> values;
  final Color color;
  final double height;

  @override
  Widget build(BuildContext context) {
    if (values.length < 2) return SizedBox(height: height);
    return CustomPaint(
      size: Size(double.infinity, height),
      painter: _SparklinePainter(values: values, color: color),
    );
  }
}

class _SparklinePainter extends CustomPainter {
  _SparklinePainter({required this.values, required this.color});

  final List<double> values;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final max = values.reduce((a, b) => a > b ? a : b);
    final min = values.reduce((a, b) => a < b ? a : b);
    final range = (max - min).clamp(0.001, double.infinity);

    final path = Path();
    for (var i = 0; i < values.length; i++) {
      final x = i / (values.length - 1) * size.width;
      final y = size.height - ((values[i] - min) / range) * size.height;
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    final fill = Path.from(path)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    canvas.drawPath(fill, Paint()..color = color.withValues(alpha: 0.12));
    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _SparklinePainter old) => old.values != values;
}

class ConnectChartCard extends StatelessWidget {
  const ConnectChartCard({
    super.key,
    required this.title,
    required this.child,
    this.subtitle,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final palette = ConnectPalette.of(context);
    return Container(
      padding: const EdgeInsets.all(ConnectSpacing.md),
      decoration: BoxDecoration(
        color: palette.surfaceRaised,
        borderRadius: BorderRadius.circular(ConnectRadius.lg),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleMedium),
                    if (subtitle != null)
                      Text(subtitle!, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11)),
                  ],
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: ConnectSpacing.sm),
          child,
        ],
      ),
    );
  }
}
