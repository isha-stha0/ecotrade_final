import 'package:flutter/material.dart';
import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';
import 'scrap_map_screen.dart';

class SubmitScrapScreen extends StatefulWidget {
  const SubmitScrapScreen({super.key});
  @override State<SubmitScrapScreen> createState() => _SubmitScrapScreenState();
}

class _SubmitScrapScreenState extends State<SubmitScrapScreen> {
  final _form = GlobalKey<FormState>();
  final _desc = TextEditingController(), _qty = TextEditingController();
  String _category = '', _unit = 'kg';
  String? _categoryId;
  List<ScrapCategoryModel> _categories = [];
  ScrapMapSelection? _pickupLocation;
  bool _loading = false, _loadingCategories = true;
  final List<_SelectedScrapImage> _selectedImages = [];
  final _imagePicker = ImagePicker();
  
  static const _maxImageSize = 5 * 1024 * 1024; // 5MB
  static const _allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
  static const _maxImages = 5;

  static const _fallbackCategories = [
    ScrapCategoryModel(id: 'paper', name: 'Paper', icon: 'description', pointsPerKg: 10, description: 'Newspapers, books, and cartons'),
    ScrapCategoryModel(id: 'plastic', name: 'Plastic', icon: 'recycling', pointsPerKg: 15, description: 'Bottles, containers, and wrappers'),
    ScrapCategoryModel(id: 'glass', name: 'Glass', icon: 'wine_bar', pointsPerKg: 12, description: 'Bottles, jars, and glass pieces'),
    ScrapCategoryModel(id: 'aluminum', name: 'Aluminum', icon: 'inventory_2', pointsPerKg: 20, description: 'Cans, foils, and light metals'),
    ScrapCategoryModel(id: 'electronics', name: 'Electronics', icon: 'devices', pointsPerKg: 25, description: 'Small e-waste and cables'),
    ScrapCategoryModel(id: 'other', name: 'Other', icon: 'category', pointsPerKg: 5, description: 'Other recyclable material'),
  ];

  int get _pts {
    if (_category.isEmpty || _qty.text.isEmpty) return 0;
    final cat = _selectedCategory;
    return ((cat?.pointsPerKg ?? 5) * (double.tryParse(_qty.text) ?? 0)).floor();
  }

  ScrapCategoryModel? get _selectedCategory {
    for (final category in _categories) {
      if (category.id == _categoryId) return category;
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await ApiService().getScrapCategories();
      if (mounted) {
        setState(() {
          _categories = categories.isEmpty ? _fallbackCategories : categories;
          _loadingCategories = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _categories = _fallbackCategories;
          _loadingCategories = false;
        });
      }
    }
  }

  IconData _categoryIcon(String value) {
    switch (value) {
      case 'description': return Icons.description_outlined;
      case 'recycling': return Icons.recycling;
      case 'wine_bar': return Icons.wine_bar_outlined;
      case 'inventory_2': return Icons.inventory_2_outlined;
      case 'devices': return Icons.devices_other_outlined;
      default: return Icons.category_outlined;
    }
  }

  Future<void> _pickImage() async {
    try {
      final pickedFile = await _imagePicker.pickImage(source: ImageSource.gallery);
      
      if (pickedFile == null) return;
      
      final bytes = await pickedFile.readAsBytes();
      
      // Validate file size
      if (bytes.length > _maxImageSize) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Image size must be less than 5MB'), backgroundColor: AppColors.red)
          );
        }
        return;
      }
      
      // Validate file type
      final mimeType = pickedFile.mimeType ?? _getMimeType(pickedFile.name.isNotEmpty ? pickedFile.name : pickedFile.path);
      if (!_allowedMimes.contains(mimeType)) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Only PNG and JPG files are allowed'), backgroundColor: AppColors.red)
          );
        }
        return;
      }
      
      // Check image limit
      if (_selectedImages.length >= _maxImages) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Maximum 5 images allowed'), backgroundColor: AppColors.red)
          );
        }
        return;
      }
      
      setState(() => _selectedImages.add(_SelectedScrapImage(file: pickedFile, bytes: bytes)));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking image: $e'), backgroundColor: AppColors.red)
        );
      }
    }
  }
  
  String _getMimeType(String filepath) {
    final ext = filepath.split('.').last.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream';
    }
  }
  
  void _removeImage(int index) {
    setState(() => _selectedImages.removeAt(index));
  }

  Future<void> _pickPickupLocation() async {
    final selection = await Navigator.of(context).push<ScrapMapSelection>(
      MaterialPageRoute(
        builder: (_) => ScrapMapScreen(
          pickerMode: true,
          initialLat: _pickupLocation?.lat,
          initialLng: _pickupLocation?.lng,
        ),
      ),
    );

    if (selection != null && mounted) {
      setState(() => _pickupLocation = selection);
    }
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    if (_category.isEmpty) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a category'), backgroundColor: AppColors.red)); return; }
    if (_pickupLocation == null) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please pin your pickup location on the map'), backgroundColor: AppColors.red)); return; }
    setState(() => _loading = true);
    try {
      await ApiService().submitScrap(
        {
          'category': _category, 
          if (_categoryId != null) 'scrap_category_id': _categoryId,
          'description': _desc.text, 
          'quantity': double.parse(_qty.text), 
          'unit': _unit, 
          'location': _pickupLocation!.label,
          'lat': _pickupLocation!.lat,
          'lng': _pickupLocation!.lng,
        },
        photos: _selectedImages.isNotEmpty ? _selectedImages.map((image) => image.file).toList() : null,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Scrap submitted! Awaiting approval 🌱'), backgroundColor: AppColors.green600));
        _desc.clear(); _qty.clear();
        setState(() { _category = ''; _categoryId = null; _pickupLocation = null; _selectedImages.clear(); });
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
        const Text('Choose the material type. Estimated points use the current EcoPoint rate.', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
        const SizedBox(height: 20),
        const Text('Category *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 0.04)),
        const SizedBox(height: 8),
        if (_loadingCategories)
          const EcoLoading()
        else
          LayoutBuilder(builder: (context, constraints) {
            final columns = constraints.maxWidth > 560 ? 3 : 2;
            return GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _categories.length,
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: columns,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: columns == 3 ? 1.35 : 1.18,
              ),
              itemBuilder: (_, index) {
                final c = _categories[index];
                final sel = _categoryId == c.id;
                return InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => setState(() {
                    _categoryId = c.id;
                    _category = c.name.toLowerCase().replaceAll(RegExp(r'\s+'), '_');
                  }),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: sel ? AppColors.green500.withValues(alpha: 0.12) : AppColors.bgCard,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: sel ? AppColors.green500 : AppColors.border, width: sel ? 1.4 : 1),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            color: sel ? AppColors.green500.withValues(alpha: 0.18) : AppColors.bgCard,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(_categoryIcon(c.icon), color: sel ? AppColors.green400 : AppColors.textMuted, size: 19),
                        ),
                        const Spacer(),
                        if (sel) const Icon(Icons.check_circle, color: AppColors.green400, size: 18),
                      ]),
                      const Spacer(),
                      Text(c.name, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: sel ? AppColors.green400 : AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 3),
                      Text('${c.pointsPerKg} pts/kg', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.yellow)),
                      if (c.description.isNotEmpty) ...[
                        const SizedBox(height: 3),
                        Text(c.description, style: const TextStyle(fontSize: 10.5, color: AppColors.textDim), maxLines: 1, overflow: TextOverflow.ellipsis),
                      ],
                    ]),
                  ),
                );
              },
            );
          }),
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
        const Text('Pickup Location *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 0.04)),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _pickPickupLocation,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.bgCard,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: _pickupLocation == null ? AppColors.border : AppColors.green500.withValues(alpha: 0.45)),
            ),
            child: Row(children: [
              Icon(Icons.map_outlined, color: _pickupLocation == null ? AppColors.textMuted : AppColors.green400, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(
                    _pickupLocation == null ? 'Tap to pin pickup address on map' : 'Pickup address pinned',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    _pickupLocation?.label ?? 'Collector will use this pin for pickup',
                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                ]),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.textDim),
            ]),
          ),
        ),
        const SizedBox(height: 16),
        if (_pts > 0) Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: AppColors.green500.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.green500.withValues(alpha: 0.2))),
          child: Row(children: [
            const Icon(Icons.emoji_events_outlined, color: AppColors.yellow, size: 24), const SizedBox(width: 10),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${_selectedCategory?.pointsPerKg ?? 0} pts/kg estimated', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
              Text('$_pts EcoPoints', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.yellow, fontFamily: 'monospace')),
            ]),
          ]),
        ),
        const SizedBox(height: 10),
        Container(padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppColors.blue.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.blue.withValues(alpha: 0.15))),
          child: const Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(Icons.info_outline, color: AppColors.blue, size: 15), SizedBox(width: 8),
            Expanded(child: Text('Our team will contact you for collection. EcoPoints are awarded after verification.', style: TextStyle(fontSize: 12, color: AppColors.textMuted, height: 1.5))),
          ])),
        const SizedBox(height: 20),
        const Text('Photos (PNG, JPG • Max 5MB each • Up to 5 images)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 0.04)),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _pickImage,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.green500.withValues(alpha: 0.3), width: 2),
              borderRadius: BorderRadius.circular(12),
              color: AppColors.green500.withValues(alpha: 0.04),
            ),
            child: Center(
              child: Column(
                children: [
                  const Icon(Icons.image_outlined, size: 32, color: AppColors.green500),
                  const SizedBox(height: 8),
                  Text('Tap to add photos (${_selectedImages.length}/$_maxImages)', style: const TextStyle(fontSize: 13, color: AppColors.green500, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
          ),
        ),
        if (_selectedImages.isNotEmpty) ...[
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 8, mainAxisSpacing: 8),
            itemCount: _selectedImages.length,
            itemBuilder: (ctx, idx) => Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.memory(
                    _selectedImages[idx].bytes,
                    fit: BoxFit.cover,
                    width: double.infinity,
                    height: double.infinity,
                  ),
                ),
                Positioned(
                  top: 4, right: 4,
                  child: GestureDetector(
                    onTap: () => _removeImage(idx),
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(color: AppColors.red.withValues(alpha: 0.8), shape: BoxShape.circle),
                      child: const Icon(Icons.close, size: 16, color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 24),
        EcoButton(text: 'Submit Scrap Request', icon: Icons.recycling, loading: _loading, width: double.infinity, onPressed: _submit),
        const SizedBox(height: 40),
      ])),
    ),
  );
}

class _SelectedScrapImage {
  final XFile file;
  final Uint8List bytes;

  const _SelectedScrapImage({
    required this.file,
    required this.bytes,
  });
}
