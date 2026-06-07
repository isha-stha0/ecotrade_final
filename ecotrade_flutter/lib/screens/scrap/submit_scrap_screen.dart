import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';

class SubmitScrapScreen extends StatefulWidget {
  const SubmitScrapScreen({super.key});
  @override State<SubmitScrapScreen> createState() => _SubmitScrapScreenState();
}

class _SubmitScrapScreenState extends State<SubmitScrapScreen> {
  final _form = GlobalKey<FormState>();
  final _desc = TextEditingController(), _qty = TextEditingController(), _loc = TextEditingController();
  String _category = '', _unit = 'kg';
  bool _loading = false;

  static const _cats = [
    {'v':'paper','e':'📄','l':'Paper','p':'10'},
    {'v':'plastic','e':'♻️','l':'Plastic','p':'15'},
    {'v':'glass','e':'🍶','l':'Glass','p':'12'},
    {'v':'aluminum','e':'🥫','l':'Aluminum','p':'20'},
    {'v':'electronics','e':'💻','l':'Electronics','p':'25'},
    {'v':'other','e':'🗃️','l':'Other','p':'5'},
  ];

  int get _pts {
    if (_category.isEmpty || _qty.text.isEmpty) return 0;
    final cat = _cats.firstWhere((c) => c['v'] == _category, orElse: () => {'p':'5'});
    return (int.parse(cat['p']!) * (double.tryParse(_qty.text) ?? 0)).floor();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    if (_category.isEmpty) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a category'), backgroundColor: AppColors.red)); return; }
    setState(() => _loading = true);
    try {
      await ApiService().submitScrap({'category': _category, 'description': _desc.text, 'quantity': double.parse(_qty.text), 'unit': _unit, 'location': _loc.text});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Scrap submitted! Awaiting approval 🌱'), backgroundColor: AppColors.green600));
        _desc.clear(); _qty.clear(); _loc.clear();
        setState(() { _category = ''; });
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.red));
    } finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Submit Scrap')),
    body: SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(key: _form, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('What are you recycling?', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
        const SizedBox(height: 4),
        const Text('Select a category and describe your material', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
        const SizedBox(height: 20),
        const Text('Category *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 0.04)),
        const SizedBox(height: 8),
        GridView.count(crossAxisCount: 3, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 0.95,
          children: _cats.map((c) {
            final sel = _category == c['v'];
            return GestureDetector(
              onTap: () => setState(() => _category = c['v']!),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: sel ? AppColors.green500.withOpacity(0.12) : AppColors.bgCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: sel ? AppColors.green500.withOpacity(0.4) : AppColors.border),
                ),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Text(c['e']!, style: const TextStyle(fontSize: 28)),
                  const SizedBox(height: 4),
                  Text(c['l']!, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: sel ? AppColors.green400 : AppColors.textMuted)),
                  Text('${c['p']} pts/kg', style: const TextStyle(fontSize: 9, color: AppColors.textDim)),
                ]),
              ),
            );
          }).toList()),
        const SizedBox(height: 18),
        EcoTextField(label: 'Description *', hint: 'E.g., old newspapers, plastic bottles...', controller: _desc, maxLines: 3, validator: (v) => v!.isEmpty ? 'Required' : null),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: EcoTextField(label: 'Quantity *', hint: '0.0', controller: _qty, keyboardType: const TextInputType.numberWithOptions(decimal: true), validator: (v) => v!.isEmpty ? 'Required' : null, onChanged: (_) => setState(() {}))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Unit', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 0.04)),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              value: _unit, dropdownColor: AppColors.bgCard,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
              decoration: const InputDecoration(),
              items: ['kg','pieces','liters'].map((u) => DropdownMenuItem(value: u, child: Text(u))).toList(),
              onChanged: (v) => setState(() => _unit = v!),
            ),
          ])),
        ]),
        const SizedBox(height: 14),
        EcoTextField(label: 'Pickup Location', hint: 'Your address or area', controller: _loc,
          prefixIcon: const Icon(Icons.location_on_outlined, color: AppColors.textMuted, size: 20)),
        const SizedBox(height: 16),
        if (_pts > 0) Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: AppColors.green500.withOpacity(0.06), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.green500.withOpacity(0.2))),
          child: Row(children: [
            const Text('🏆', style: TextStyle(fontSize: 22)), const SizedBox(width: 10),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Estimated Earnings', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
              Text('$_pts EcoPoints', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.yellow, fontFamily: 'monospace')),
            ]),
          ]),
        ),
        const SizedBox(height: 10),
        Container(padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppColors.blue.withOpacity(0.06), borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.blue.withOpacity(0.15))),
          child: const Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(Icons.info_outline, color: AppColors.blue, size: 15), SizedBox(width: 8),
            Expanded(child: Text('Our team will contact you for collection. EcoPoints are awarded after verification.', style: TextStyle(fontSize: 12, color: AppColors.textMuted, height: 1.5))),
          ])),
        const SizedBox(height: 24),
        EcoButton(text: 'Submit Scrap Request', icon: Icons.recycling, loading: _loading, width: double.infinity, onPressed: _submit),
        const SizedBox(height: 40),
      ])),
    ),
  );
}
