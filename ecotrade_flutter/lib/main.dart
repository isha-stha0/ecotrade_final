import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'services/auth_provider.dart';
import 'services/cart_provider.dart';
import 'utils/app_theme.dart';
import 'screens/splash/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/shop/shop_screen.dart';
import 'screens/shop/cart_screen.dart';
import 'screens/scrap/submit_scrap_screen.dart';
import 'screens/orders/orders_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/admin/admin_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: AppColors.bgSecondary,
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  runApp(MultiProvider(providers: [
    ChangeNotifierProvider(create: (_) => AuthProvider()),
    ChangeNotifierProvider(create: (_) => CartProvider()),
  ], child: const EcoTradeApp()));
}

class EcoTradeApp extends StatelessWidget {
  const EcoTradeApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'EcoTrade',
    theme: AppTheme.dark,
    debugShowCheckedModeBanner: false,
    initialRoute: '/splash',
    routes: {
      '/splash': (_) => const SplashScreen(),
      '/login':  (_) => const _AuthFlow(),
      '/main':   (_) => const _MainGuard(),
    },
  );
}

class _AuthFlow extends StatefulWidget {
  const _AuthFlow();
  @override State<_AuthFlow> createState() => _AuthFlowState();
}
class _AuthFlowState extends State<_AuthFlow> {
  bool _login = true;
  @override Widget build(BuildContext context) => _login
    ? LoginScreen(onRegister: () => setState(() => _login = false))
    : RegisterScreen(onLogin: () => setState(() => _login = true));
}

class _MainGuard extends StatelessWidget {
  const _MainGuard();
  @override Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (auth.loading) return const Scaffold(backgroundColor: AppColors.bg,
        body: Center(child: CircularProgressIndicator(color: AppColors.green500, strokeWidth: 2)));
    if (!auth.isLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) => Navigator.of(context).pushReplacementNamed('/login'));
      return const SizedBox();
    }
    return const MainNavigation();
  }
}

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});
  @override State<MainNavigation> createState() => _MainNavigationState();
}
class _MainNavigationState extends State<MainNavigation> {
  int _i = 0;
  void _go(int i) => setState(() => _i = i);

  @override
  Widget build(BuildContext context) {
    final auth  = context.watch<AuthProvider>();
    final cart  = context.watch<CartProvider>();
    final admin = auth.isAdmin;

    final screens = [
      HomeScreen(onNavigate: _go),
      const ShopScreen(),
      const SubmitScrapScreen(),
      const OrdersScreen(),
      admin ? const AdminScreen() : const ProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: _i, children: screens),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.border))),
        child: NavigationBar(
          selectedIndex: _i,
          onDestinationSelected: _go,
          backgroundColor: AppColors.bgSecondary,
          indicatorColor: AppColors.green500.withOpacity(0.15),
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: [
            const NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
            NavigationDestination(
              icon: Badge(isLabelVisible: cart.count > 0, label: Text('${cart.count}'), child: const Icon(Icons.shopping_bag_outlined)),
              selectedIcon: Badge(isLabelVisible: cart.count > 0, label: Text('${cart.count}'), child: const Icon(Icons.shopping_bag)),
              label: 'Shop'),
            const NavigationDestination(icon: Icon(Icons.recycling_outlined), selectedIcon: Icon(Icons.recycling), label: 'Recycle'),
            const NavigationDestination(icon: Icon(Icons.receipt_outlined), selectedIcon: Icon(Icons.receipt), label: 'Orders'),
            NavigationDestination(
              icon: Icon(admin ? Icons.admin_panel_settings_outlined : Icons.person_outlined),
              selectedIcon: Icon(admin ? Icons.admin_panel_settings : Icons.person),
              label: admin ? 'Admin' : 'Profile'),
          ],
        ),
      ),
    );
  }
}
