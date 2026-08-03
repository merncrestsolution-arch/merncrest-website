import 'package:flutter/material.dart';
import 'package:merncrest_connect/screens/ai_assistant_screen.dart';
import 'package:merncrest_connect/screens/analytics_screen.dart';
import 'package:merncrest_connect/screens/announcements_screen.dart';
import 'package:merncrest_connect/screens/attendance_screen.dart';
import 'package:merncrest_connect/screens/calendar_screen.dart';
import 'package:merncrest_connect/screens/data_screens.dart';
import 'package:merncrest_connect/screens/documents_screen.dart';
import 'package:merncrest_connect/screens/erp_hub_screen.dart';
import 'package:merncrest_connect/screens/erp_approvals_screen.dart';
import 'package:merncrest_connect/screens/erp_assets_screen.dart';
import 'package:merncrest_connect/screens/erp_fleet_screen.dart';
import 'package:merncrest_connect/screens/erp_inventory_screen.dart';
import 'package:merncrest_connect/screens/erp_manufacturing_screen.dart';
import 'package:merncrest_connect/screens/erp_procurement_screen.dart';
import 'package:merncrest_connect/screens/finance_screen.dart';
import 'package:merncrest_connect/screens/internal_chat_screen.dart';
import 'package:merncrest_connect/screens/module_list_screen.dart';
import 'package:merncrest_connect/screens/performance_screen.dart';
import 'package:merncrest_connect/screens/projects_screen.dart';
import 'package:merncrest_connect/screens/quotations_screen.dart';
import 'package:merncrest_connect/screens/helpdesk_screen.dart';
import 'package:merncrest_connect/screens/notifications_screen.dart';
import 'package:merncrest_connect/screens/payroll_screen.dart';
import 'package:merncrest_connect/screens/profile_screen.dart';
import 'package:merncrest_connect/screens/security_settings_screen.dart';
import 'package:merncrest_connect/screens/about_screen.dart';
import 'package:merncrest_connect/screens/admin_screen.dart';
import 'package:merncrest_connect/screens/help_screen.dart';
import 'package:merncrest_connect/screens/integrations_screen.dart';
import 'package:merncrest_connect/screens/settings_screen.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';

/// Maps server navigation routes and quick actions to in-app screens.
class ModuleRouter {
  ModuleRouter._();

  static void open(BuildContext context, String route, {String? label}) {
    final normalized = route.toLowerCase().replaceAll(RegExp(r'^/staff'), '').replaceAll(RegExp(r'^/'), '');

    Widget? screen;
    switch (normalized) {
      case 'attendance':
      case 'ess/attendance':
        screen = const AttendanceScreen();
      case 'tasks':
      case 'ess/tasks':
        screen = const TasksScreen();
      case 'leave':
      case 'ess/leave':
        screen = const LeaveScreen();
      case 'calendar':
      case 'ess/calendar':
        screen = const CalendarScreen();
      case 'profile':
      case 'ess/profile':
        screen = const ProfileScreen();
      case 'settings':
      case 'ess/settings':
        screen = const SettingsScreen();
      case 'notifications':
        screen = const NotificationsScreen();
      case 'ai':
      case 'ai-assistant':
      case 'aira':
        screen = const AiAssistantScreen();
      case 'live-chat':
      case 'chat':
        // Switch to chat tab handled by shell callback
        break;
      case 'internal-chat':
      case 'team-chat':
      case 'internal-messaging':
        screen = const InternalChatScreen();
      case 'clients':
      case 'crm':
        break;
      case 'command-center':
      case 'dashboard':
      case 'analytics':
      case 'reports':
        screen = const AnalyticsScreen();
      case 'performance':
        screen = const PerformanceScreen();
      case 'approvals':
        screen = const ErpApprovalsScreen();
      case 'billing':
      case 'invoices':
      case 'finance':
        screen = const FinanceScreen();
      case 'receipts':
        screen = const FinanceScreen();
      case 'quotations':
        screen = const QuotationsScreen();
      case 'projects':
        screen = const ProjectsScreen();
      case 'tickets':
      case 'helpdesk':
        screen = const HelpdeskScreen();
      case 'payroll':
      case 'payslips':
      case 'payslip':
        screen = const PayrollScreen();
      case 'documents':
        screen = const DocumentsScreen();
      case 'announcements':
        screen = const AnnouncementsScreen();
      case 'erp':
      case 'admin/erp':
        screen = const ErpHubScreen();
      case 'inventory':
      case 'warehouse':
        screen = const ErpInventoryScreen();
      case 'manufacturing':
        screen = const ErpManufacturingScreen();
      case 'purchasing':
      case 'procurement':
        screen = const ErpProcurementScreen();
      case 'assets':
        screen = const ErpAssetsScreen();
      case 'fleet':
      case 'fsm':
        screen = const ErpFleetScreen();
      case 'sales':
        screen = const QuotationsScreen();
      case 'hr':
        screen = const ModuleListScreen(title: 'HR', endpoint: '/api/erp/hr');
      case 'security':
        screen = const SecuritySettingsScreen();
      case 'help':
        screen = const HelpScreen();
      case 'about':
        screen = const AboutScreen();
      case 'admin':
        screen = const AdminScreen();
      case 'integrations':
        screen = const IntegrationsScreen();
      default:
        if (route.startsWith('/api/')) {
          screen = ModuleListScreen(title: label ?? 'Module', endpoint: route);
        }
    }

    if (screen != null) {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen!));
    }
  }

  static IconData iconForRoute(String route) {
    final r = route.toLowerCase();
    if (r.contains('attendance')) return Icons.schedule_rounded;
    if (r.contains('leave')) return Icons.flight_takeoff_rounded;
    if (r.contains('task')) return Icons.task_alt_rounded;
    if (r.contains('calendar')) return Icons.calendar_month_rounded;
    if (r.contains('chat')) return Icons.forum_rounded;
    if (r.contains('client') || r.contains('crm')) return Icons.groups_rounded;
    if (r.contains('project')) return Icons.folder_special_rounded;
    if (r.contains('ticket') || r.contains('help')) return Icons.headset_mic_rounded;
    if (r.contains('billing') || r.contains('invoice')) return Icons.receipt_long_rounded;
    if (r.contains('payroll') || r.contains('payslip')) return Icons.payments_rounded;
    if (r.contains('finance')) return Icons.account_balance_wallet_rounded;
    if (r.contains('ai')) return Icons.auto_awesome_rounded;
    if (r.contains('document')) return Icons.description_rounded;
    if (r.contains('setting')) return Icons.settings_rounded;
    if (r.contains('profile')) return Icons.person_rounded;
    if (r.contains('announce')) return Icons.campaign_rounded;
    if (r.contains('performance')) return Icons.insights_rounded;
    if (r.contains('analytics') || r.contains('report')) return Icons.analytics_rounded;
    if (r.contains('quotation')) return Icons.request_quote_rounded;
    if (r.contains('inventory')) return Icons.inventory_2_rounded;
    if (r.contains('erp')) return Icons.hub_rounded;
    return Icons.widgets_outlined;
  }

  static Color colorForRoute(String route) {
    final r = route.toLowerCase();
    if (r.contains('attendance')) return ConnectModuleColors.attendance;
    if (r.contains('leave') || r.contains('hr')) return ConnectModuleColors.hr;
    if (r.contains('client') || r.contains('crm') || r.contains('sales')) return ConnectModuleColors.crm;
    if (r.contains('erp') || r.contains('inventory')) return ConnectModuleColors.erp;
    if (r.contains('finance') || r.contains('billing') || r.contains('invoice')) return ConnectModuleColors.finance;
    if (r.contains('chat')) return ConnectModuleColors.chat;
    if (r.contains('project')) return ConnectModuleColors.projects;
    if (r.contains('ticket') || r.contains('help')) return ConnectModuleColors.helpdesk;
    if (r.contains('ai')) return ConnectModuleColors.ai;
    if (r.contains('document')) return ConnectModuleColors.docs;
    if (r.contains('calendar')) return ConnectModuleColors.calendar;
    if (r.contains('payroll')) return ConnectModuleColors.payroll;
    if (r.contains('security')) return ConnectModuleColors.security;
    if (r.contains('setting')) return ConnectModuleColors.settings;
    return ConnectModuleColors.hr;
  }
}
