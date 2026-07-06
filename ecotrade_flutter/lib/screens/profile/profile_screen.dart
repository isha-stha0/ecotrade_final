import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_provider.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    if (user == null) return const SizedBox();

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        // Avatar
        EcoCard(child: Column(children: [
          Container(width: 80, height: 80,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [AppColors.green500, AppColors.green700]),
              borderRadius: BorderRadius.circular(22),
              boxShadow: [BoxShadow(color: AppColors.green500.withOpacity(0.35), blurRadius: 20, offset: const Offset(0,6))],
            ),
            child: Center(child: Text(user.name[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w800)))),
          const SizedBox(height: 12),
          Text(user.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
          const SizedBox(height: 4),
          Text(user.email, style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
          const SizedBox(height: 10),
          StatusBadge(user.role),
        ])),
        const SizedBox(height: 14),

        // EcoPoints banner
        Container(padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [AppColors.yellow.withOpacity(0.1), AppColors.green500.withOpacity(0.06)]),
            borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.yellow.withOpacity(0.2)),
          ),
          child: Row(children: [
            const Text('🏆', style: TextStyle(fontSize: 34)), const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('EcoPoints', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.yellow)),
              Text('${user.ecoPoints} pts', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.yellow, fontFamily: 'monospace')),
              const Text('Keep recycling!', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
            ])),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              const Text('Recycled', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
              Text('${user.totalScraps.toStringAsFixed(0)} kg', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.green400)),
            ]),
          ])),
        const SizedBox(height: 14),

        // Account section
        _Section('Account', [
          _Item(Icons.person_outline, 'Edit Profile', AppColors.green400, () => _editDialog(context, user.name, user.phone ?? '')),
          _Item(Icons.lock_outline, 'Change Password', AppColors.blue, () => _changePassDialog(context)),
        ]),
        const SizedBox(height: 12),

        // More section
        _Section('More', [
          _Item(Icons.info_outline, 'About EcoTrade', AppColors.textMuted, () => _showAbout(context)),
          _Item(Icons.share_outlined, 'Share App', AppColors.blue, () {}),
        ]),
        const SizedBox(height: 12),

        // Logout
        GestureDetector(
          onTap: () => _logoutDialog(context),
          child: Container(padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.red.withOpacity(0.06), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.red.withOpacity(0.2))),
            child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.logout_rounded, color: AppColors.red, size: 18), SizedBox(width: 10),
              Text('Logout', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.red)),
            ])),
        ),
        const SizedBox(height: 40),
      ]),
    );
  }

  void _logoutDialog(BuildContext context) {
    showDialog(context: context, builder: (ctx) => AlertDialog(
      backgroundColor: AppColors.bgCard,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Text('Logout', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
      content: const Text('Are you sure you want to logout?', style: TextStyle(color: AppColors.textMuted)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.red, foregroundColor: Colors.white, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
          onPressed: () async { Navigator.pop(ctx); await context.read<AuthProvider>().logout(); Navigator.of(context).pushReplacementNamed('/login'); },
          child: const Text('Logout')),
      ],
    ));
  }

  void _editDialog(BuildContext context, String name, String phone) {
    final nc = TextEditingController(text: name), pc = TextEditingController(text: phone);
    showDialog(context: context, builder: (_) => AlertDialog(
      backgroundColor: AppColors.bgCard, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Text('Edit Profile', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        EcoTextField(label: 'Name', controller: nc), const SizedBox(height: 12),
        EcoTextField(label: 'Phone', controller: pc, keyboardType: TextInputType.phone),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
        ElevatedButton(onPressed: () async {
          await context.read<AuthProvider>().updateProfile({'name': nc.text, 'phone': pc.text});
          if (context.mounted) { Navigator.pop(context); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated!'), backgroundColor: AppColors.green600)); }
        }, child: const Text('Save')),
      ],
    ));
  }

  void _changePassDialog(BuildContext context) {
    final cur = TextEditingController(), nw = TextEditingController();
    bool loading = false;
    showDialog(context: context, builder: (ctx) => StatefulBuilder(
      builder: (ctx, set) => AlertDialog(
        backgroundColor: AppColors.bgCard, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Change Password', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          EcoTextField(label: 'Current Password', controller: cur, obscureText: true),
          const SizedBox(height: 12),
          EcoTextField(label: 'New Password', controller: nw, obscureText: true),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
          ElevatedButton(onPressed: loading ? null : () async {
            set(() => loading = true);
            try {
              await ApiService().changePassword(cur.text, nw.text);
              if (ctx.mounted) { Navigator.pop(ctx); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password changed!'), backgroundColor: AppColors.green600)); }
            } catch (e) {
              if (ctx.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.red));
            } finally { if (ctx.mounted) set(() => loading = false); }
          }, child: loading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Change')),
        ],
      ),
    ));
  }

  void _showAbout(BuildContext context) {
    showDialog(context: context, builder: (_) => AlertDialog(
      backgroundColor: AppColors.bgCard, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(children: [
        Image.asset('assets/images/ecotrade_logo.jpg', width: 48, height: 42, fit: BoxFit.contain),
        const SizedBox(width: 8),
        const Text('EcoTrade', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
      ]),
      content: const Text('Smart Scrap-to-Product Platform\n\nDeveloper: Isha Shrestha\nID: NP069784\n\nBuilt with Flutter + Node.js + MongoDB\n\nVersion 1.0.0', style: TextStyle(color: AppColors.textMuted, fontSize: 13, height: 1.6)),
      actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close', style: TextStyle(color: AppColors.green400)))],
    ));
  }
}

class _Section extends StatelessWidget {
  final String t; final List<Widget> items;
  const _Section(this.t, this.items);
  @override Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Padding(padding: const EdgeInsets.only(left: 4, bottom: 8), child: Text(t.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 0.08))),
    Container(decoration: BoxDecoration(color: AppColors.bgCard, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
      child: Column(children: items.asMap().entries.map((e) => Column(children: [e.value, if (e.key < items.length-1) const Divider(height:1,indent:52)])).toList())),
  ]);
}

class _Item extends StatelessWidget {
  final IconData i; final String l; final Color c; final VoidCallback t;
  const _Item(this.i, this.l, this.c, this.t);
  @override Widget build(BuildContext context) => ListTile(
    onTap: t, contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
    leading: Container(width: 34, height: 34, decoration: BoxDecoration(color: c.withOpacity(0.1), borderRadius: BorderRadius.circular(9)), child: Icon(i, color: c, size: 17)),
    title: Text(l, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
    trailing: const Icon(Icons.chevron_right, color: AppColors.textDim, size: 18),
  );
}
