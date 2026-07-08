import { } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Collectors from './pages/Collectors';
import ScrapRequests from './pages/ScrapRequests';
import DeliveryRequests from './pages/DeliveryRequests';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Complaints from './pages/Complaints';
import MapPage from './pages/MapPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />

          {/* Secure Admin Portal Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/collectors" element={<Collectors />} />
              <Route path="/scrap-requests" element={<ScrapRequests />} />
              <Route path="/delivery-requests" element={<DeliveryRequests />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/new" element={<ProductForm mode="create" />} />
              <Route path="/products/:id/edit" element={<ProductForm mode="edit" />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/complaints" element={<Complaints />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
