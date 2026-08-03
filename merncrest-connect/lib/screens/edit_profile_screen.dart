import 'package:flutter/material.dart';
import 'package:merncrest_connect/providers/app_state.dart';
import 'package:merncrest_connect/theme/connect_theme.dart';
import 'package:merncrest_connect/theme/connect_tokens.dart';
import 'package:merncrest_connect/widgets/connect_ui.dart';
import 'package:provider/provider.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  String _language = 'en';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AppState>().user?['user'] as Map<String, dynamic>?;
    _nameController.text = user?['fullName']?.toString() ?? '';
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final data = await context.read<AppState>().auth.api.get('/api/portal/profile');
      final profile = data['profile'] as Map<String, dynamic>?;
      if (mounted) {
        _phoneController.text = profile?['phone']?.toString() ?? '';
        _language = profile?['preferredLanguage']?.toString() ?? 'en';
        setState(() {});
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await context.read<AppState>().auth.api.patch('/api/portal/profile', {
        'fullName': _nameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'preferredLanguage': _language,
      });
      await context.read<AppState>().refresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ConnectPalette.of(context).background,
      appBar: AppBar(title: const Text('Edit Profile')),
      body: ConnectAmbientBackground(
        child: ListView(
          padding: const EdgeInsets.all(ConnectSpacing.lg),
          children: [
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Full name'),
            ),
            const SizedBox(height: ConnectSpacing.sm),
            TextField(
              controller: _phoneController,
              decoration: const InputDecoration(labelText: 'Phone'),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: ConnectSpacing.sm),
            DropdownButtonFormField<String>(
              initialValue: _language,
              decoration: const InputDecoration(labelText: 'Language'),
              items: const [
                DropdownMenuItem(value: 'en', child: Text('English')),
                DropdownMenuItem(value: 'si', child: Text('Sinhala')),
                DropdownMenuItem(value: 'ta', child: Text('Tamil')),
              ],
              onChanged: (v) => setState(() => _language = v ?? 'en'),
            ),
            const SizedBox(height: ConnectSpacing.lg),
            ConnectPrimaryButton(label: 'Save changes', icon: Icons.save_outlined, loading: _saving, onPressed: _save),
          ],
        ),
      ),
    );
  }
}
