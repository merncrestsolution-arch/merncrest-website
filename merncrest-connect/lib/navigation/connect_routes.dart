import 'package:flutter/material.dart';
import 'package:merncrest_connect/navigation/module_router.dart';

/// Thin wrapper around [ModuleRouter] for quick navigation from shell widgets.
class ConnectRoutes {
  static void open(BuildContext context, String route, {String? label}) {
    ModuleRouter.open(context, route, label: label);
  }
}
