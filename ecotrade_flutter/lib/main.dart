import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'services/auth_provider.dart';
import 'services/cart_provider.dart';
import 'utils/app_theme.dart';
import 'screens/splash/splash_screen.dart';
import 'screens/onboarding/onboarding_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/shop/shop_screen.dart';
import 'screens/scrap/submit_scrap_screen.dart';
import 'screens/orders/orders_screen.dart';
import 'screens/orders/payment_result_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/collector/collector_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // ✅ Light theme: status bar icons should be dark (Brightness.dark)
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark, // dark icons on light status bar
    systemNavigationBarColor: AppColors.bgSecondary,
    systemNavigationBarIconBrightness:
        Brightness.dark, // dark icons on light nav bar
  ));

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: const EcoTradeApp(),
    ),
  );
}

class EcoTradeApp extends StatelessWidget {
  const EcoTradeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EcoTrade',
      theme: AppTheme.light, // ✅ use the new light theme
      debugShowCheckedModeBanner: false,
      initialRoute: '/splash',
      routes: {
        '/splash': (_) => const SplashScreen(),
        '/onboarding': (_) => const OnboardingScreen(),
        '/login': (_) => const _AuthFlow(),
        '/main': (_) => const _MainGuard(),
        '/orders/success': (_) => const PaymentResultScreen(success: true),
        '/orders/failed': (_) => const PaymentResultScreen(success: false),
      },
    );
  }
}

// ---------- Authentication flow (toggles login/register) ----------
class _AuthFlow extends StatefulWidget {
  const _AuthFlow();

  @override
  State<_AuthFlow> createState() => _AuthFlowState();
}

class _AuthFlowState extends State<_AuthFlow> {
  bool _login = true;

  @override
  Widget build(BuildContext context) {
    return _login
        ? LoginScreen(onRegister: () => setState(() => _login = false))
        : RegisterScreen(onLogin: () => setState(() => _login = true));
  }
}

// ---------- Guard that checks login status ----------
class _MainGuard extends StatelessWidget {
  const _MainGuard();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.loading) {
      return const Scaffold(
        backgroundColor: AppColors.bg, // white
        body: Center(
          child: CircularProgressIndicator(
            color: AppColors.lightGreen, // use light green for spinner
            strokeWidth: 2,
          ),
        ),
      );
    }

    if (!auth.isLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => Navigator.of(context).pushReplacementNamed('/login'),
      );
      return const SizedBox();
    }

    return const MainNavigation();
  }
}

// ---------- Main navigation with bottom bar ----------
class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _selectedIndex = 0;

  void _onItemTapped(int index) {
    setState(() => _selectedIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cart = context.watch<CartProvider>();
    final isCollector = auth.isCollector;

    if (isCollector) {
      return const CollectorScreen();
    }

    final screens = [
      HomeScreen(onNavigate: _onItemTapped),
      const ShopScreen(),
      const SubmitScrapScreen(),
      const OrdersScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: AppColors.border), // light grey border
          ),
        ),
        child: NavigationBar(
          selectedIndex: _selectedIndex,
          onDestinationSelected: _onItemTapped,
          backgroundColor: AppColors.bgSecondary, // light grey (was dark)
          indicatorColor:
              AppColors.lightGreen.withValues(alpha: 0.15), // subtle light green
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: [
            const NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home),
              label: 'Home',
            ),
            NavigationDestination(
              icon: Badge(
                isLabelVisible: cart.count > 0,
                label: Text('${cart.count}'),
                child: const Icon(Icons.shopping_bag_outlined),
              ),
              selectedIcon: Badge(
                isLabelVisible: cart.count > 0,
                label: Text('${cart.count}'),
                child: const Icon(Icons.shopping_bag),
              ),
              label: 'Shop',
            ),
            const NavigationDestination(
              icon: Icon(Icons.recycling_outlined),
              selectedIcon: Icon(Icons.recycling),
              label: 'Recycle',
            ),
            const NavigationDestination(
              icon: Icon(Icons.receipt_outlined),
              selectedIcon: Icon(Icons.receipt),
              label: 'Orders',
            ),
            const NavigationDestination(
              icon: Icon(Icons.person_outlined),
              selectedIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
