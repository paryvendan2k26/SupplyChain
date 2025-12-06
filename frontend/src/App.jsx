import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import ManufacturerDashboard from './pages/ManufacturerDashboard'
import DistributorDashboard from './pages/DistributorDashboard'
import WarehouseDashboard from './pages/WarehouseDashboard'
import RetailerDashboard from './pages/RetailerDashboard'
import VerifyProduct from './pages/VerifyProduct'
import TestQRCode from './pages/TestQRCode'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify/:productId?" element={<VerifyProduct />} />
      <Route path="/test-qr/:productId?" element={<TestQRCode />} />
      
      {/* Protected Routes */}
      <Route 
        path="/manufacturer" 
        element={
          <PrivateRoute>
            <ManufacturerDashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/distributor" 
        element={
          <PrivateRoute>
            <DistributorDashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/warehouse" 
        element={
          <PrivateRoute>
            <WarehouseDashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/retailer" 
        element={
          <PrivateRoute>
            <RetailerDashboard />
          </PrivateRoute>
        } 
      />
      
      {/* Legacy route for backward compatibility */}
      <Route path="/supply-chain" element={<Navigate to="/distributor" replace />} />
    </Routes>
  )
}
