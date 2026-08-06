import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/cart_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/widgets.dart';
import '../shop/product_detail_screen.dart';

class ProjectAboutScreen extends StatefulWidget {
  const ProjectAboutScreen({super.key});

  @override
  State<ProjectAboutScreen> createState() => _ProjectAboutScreenState();
}

class _ProjectAboutScreenState extends State<ProjectAboutScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _entrance;

  @override
  void initState() {
    super.initState();
    _entrance = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 850),
    )..forward();
  }

  @override
  void dispose() {
    _entrance.dispose();
    super.dispose();
  }

  void _openProducts() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const DemoProductScreen()),
    );
  }

  Widget _reveal({required Widget child, required double start}) {
    final animation = CurvedAnimation(
      parent: _entrance,
      curve: Interval(start, (start + 0.28).clamp(0, 1),
          curve: Curves.easeOutCubic),
    );
    return AnimatedBuilder(
      animation: animation,
      child: child,
      builder: (_, content) => Opacity(
        opacity: animation.value,
        child: Transform.translate(
          offset: Offset(0, 18 * (1 - animation.value)),
          child: content,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F8F4),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(22, 18, 22, 28),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _reveal(
                    start: 0.0,
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(11),
                          child: Image.asset(
                            'assets/images/ecotrade_logo.jpg',
                            width: 42,
                            height: 42,
                            fit: BoxFit.contain,
                          ),
                        ),
                        const SizedBox(width: 10),
                        const Text(
                          'EcoTrade',
                          style: TextStyle(
                            fontSize: 21,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: _openProducts,
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.darkGreen,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                              side: const BorderSide(color: AppColors.border),
                            ),
                          ),
                          child: const Text(
                            'Skip',
                            style: TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 36),
                  _reveal(
                    start: 0.12,
                    child: RichText(
                      text: const TextSpan(
                        style: TextStyle(
                          fontSize: 39,
                          height: 1.05,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                        children: [
                          TextSpan(text: 'Waste is not the '),
                          TextSpan(
                            text: 'end\nof the story.',
                            style: TextStyle(color: AppColors.green600),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 15),
                  _reveal(
                    start: 0.20,
                    child: const Text(
                      'EcoTrade gives useful materials a second life — and makes responsible choices easier for everyday households.',
                      style: TextStyle(
                        fontSize: 16,
                        height: 1.5,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  _reveal(
                    start: 0.30,
                    child: Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: AppColors.darkGreen,
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(13),
                            ),
                            child: const Icon(Icons.loop_rounded,
                                color: Colors.white, size: 23),
                          ),
                          const SizedBox(width: 13),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('A circular marketplace',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.w800)),
                                SizedBox(height: 5),
                                Text(
                                    'Connect. Recover. Reuse. Every small action helps keep value in circulation.',
                                    style: TextStyle(
                                        color: Color(0xFFD7E8DE),
                                        fontSize: 13,
                                        height: 1.4)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  _reveal(
                    start: 0.40,
                    child: const Row(
                      children: [
                        Expanded(
                            child: _AboutMetric(
                                value: '01', label: 'Request pickup')),
                        SizedBox(width: 10),
                        Expanded(
                            child: _AboutMetric(
                                value: '02', label: 'Earn rewards')),
                        SizedBox(width: 10),
                        Expanded(
                            child: _AboutMetric(
                                value: '03', label: 'Shop better')),
                      ],
                    ),
                  ),
                  const SizedBox(height: 26),
                  _reveal(
                    start: 0.52,
                    child: const Text(
                      'How it works',
                      style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _reveal(
                      start: 0.58,
                      child: const _AboutStep(
                          number: '01',
                          title: 'Send your scrap',
                          detail: 'Schedule a pickup from your home.')),
                  const SizedBox(height: 9),
                  _reveal(
                      start: 0.65,
                      child: const _AboutStep(
                          number: '02',
                          title: 'See the impact',
                          detail:
                              'Track collections and EcoPoints in one place.')),
                  const SizedBox(height: 9),
                  _reveal(
                      start: 0.72,
                      child: const _AboutStep(
                          number: '03',
                          title: 'Choose circular products',
                          detail:
                              'Browse practical products made from recovered materials.')),
                  const SizedBox(height: 28),
                  _reveal(
                    start: 0.82,
                    child: EcoButton(
                      text: 'Explore the marketplace',
                      icon: Icons.arrow_forward_rounded,
                      width: double.infinity,
                      onPressed: _openProducts,
                    ),
                  ),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AboutMetric extends StatelessWidget {
  final String value;
  final String label;
  const _AboutMetric({required this.value, required this.label});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.fromLTRB(11, 13, 11, 13),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value,
                style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: AppColors.green600)),
            const SizedBox(height: 5),
            Text(label,
                style: const TextStyle(
                    fontSize: 11,
                    height: 1.2,
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      );
}

class _AboutStep extends StatelessWidget {
  final String number;
  final String title;
  final String detail;
  const _AboutStep(
      {required this.number, required this.title, required this.detail});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(13),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Text(number,
                style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    color: AppColors.green600)),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary)),
                  const SizedBox(height: 3),
                  Text(detail,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textMuted)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded,
                size: 13, color: AppColors.textDim),
          ],
        ),
      );
}

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  static const _pages = [
    _OnboardingPageData(
      icon: Icons.eco_rounded,
      title: 'About EcoTrade',
      subtitle:
          'EcoTrade connects households, collectors, and eco-friendly businesses in one practical recycling marketplace.',
      points: [
        'Request scrap pickup from your phone.',
        'Earn EcoPoints after verified collection.',
        'Shop products made from recycled materials.',
      ],
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _goToProducts() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const DemoProductScreen()),
    );
  }

  void _next() {
    if (_page == _pages.length - 1) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const DemoProductScreen()),
      );
      return;
    }

    _controller.nextPage(
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            children: [
              Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.asset(
                      'assets/images/ecotrade_logo.jpg',
                      width: 40,
                      height: 40,
                      fit: BoxFit.contain,
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'EcoTrade',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: _goToProducts,
                    child: const Text('Skip'),
                  ),
                ],
              ),
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: _pages.length,
                  onPageChanged: (value) => setState(() => _page = value),
                  itemBuilder: (_, index) =>
                      _OnboardingPage(data: _pages[index]),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  _pages.length,
                  (index) => AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: _page == index ? 26 : 8,
                    height: 8,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: _page == index
                          ? AppColors.green500
                          : AppColors.border,
                      borderRadius: BorderRadius.circular(99),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              EcoButton(
                text: _page == _pages.length - 1 ? 'Explore EcoTrade' : 'Next',
                icon: _page == _pages.length - 1
                    ? Icons.explore_rounded
                    : Icons.arrow_forward_rounded,
                width: double.infinity,
                onPressed: _next,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class DemoProductScreen extends StatefulWidget {
  const DemoProductScreen({super.key});

  @override
  State<DemoProductScreen> createState() => _DemoProductScreenState();
}

class _DemoProductScreenState extends State<DemoProductScreen> {
  List<ProductModel> _products = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProduct();
  }

  Future<void> _loadProduct() async {
    try {
      final products = await ApiService().getProducts();
      if (!mounted) return;
      setState(() {
        final available = products
            .where((product) => product.isActive && product.stock > 0)
            .toList();
        _products = available;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  void _addToCart(ProductModel product) {
    context.read<CartProvider>().addItem(product);
    if (!context.read<AuthProvider>().isLoggedIn) {
      Navigator.of(context).pushNamed('/login');
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${product.name} added to cart'),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Eco Products')),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.green500))
          : _error != null
              ? Center(child: EcoButton(text: 'Retry', onPressed: _loadProduct))
              : _products.isEmpty
                  ? const Center(
                      child: Text('No products listed by the admin yet.'))
                  : GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 0.74,
                      ),
                      itemCount: _products.length,
                      itemBuilder: (_, index) {
                        final product = _products[index];
                        return ProductCard(
                          product: product,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ProductDetailScreen(
                                product: product,
                                requireSignIn: true,
                              ),
                            ),
                          ),
                          onAddToCart: () => _addToCart(product),
                        );
                      },
                    ),
    );
  }
}

class _OnboardingPage extends StatelessWidget {
  final _OnboardingPageData data;

  const _OnboardingPage({required this.data});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxHeight < 560;

        return SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: compact ? 104 : 132,
                  height: compact ? 104 : 132,
                  decoration: BoxDecoration(
                    color: AppColors.green500.withValues(alpha: 0.10),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.green500.withValues(alpha: 0.24),
                    ),
                  ),
                  child: Icon(
                    data.icon,
                    color: AppColors.green600,
                    size: compact ? 52 : 66,
                  ),
                ),
                SizedBox(height: compact ? 24 : 36),
                Text(
                  data.title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  data.subtitle,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 15,
                    color: AppColors.textMuted,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 26),
                ...data.points.map(
                  (point) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          decoration: const BoxDecoration(
                            color: AppColors.green500,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check_rounded,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            point,
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppColors.textPrimary,
                              height: 1.45,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _OnboardingPageData {
  final IconData icon;
  final String title;
  final String subtitle;
  final List<String> points;

  const _OnboardingPageData({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.points,
  });
}
