import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveSearchPage } from './pages/LiveSearchPage';
import { ProductsListPage } from './pages/ProductsListPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { InventoryPage } from './pages/InventoryPage';
import { PriceMonitoringPage } from './pages/PriceMonitoringPage';
import { DeliveryEtaPage } from './pages/DeliveryEtaPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { AlertsPage } from './pages/AlertsPage';
import { SyncPage } from './pages/SyncPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsApiPage } from './pages/SettingsApiPage';
import { AdminPage } from './pages/AdminPage';
import { DemoPage } from './pages/DemoPage';
import { DemandDashboardPage } from './pages/DemandDashboardPage';
import { ProductOptimizationPage } from './pages/ProductOptimizationPage';
import { ProductMatchingPage } from './pages/ProductMatchingPage';
import { IndiaMapPage } from './pages/IndiaMapPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected SaaS Layout */}
        <Route element={<RootLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/live-search" element={<LiveSearchPage />} />
          <Route path="/products" element={<ProductsListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/product-matching" element={<ProductMatchingPage />} />
          <Route path="/india-map" element={<IndiaMapPage />} />
          <Route path="/regional-analytics" element={<IndiaMapPage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/prices" element={<PriceMonitoringPage />} />
          <Route path="/delivery" element={<DeliveryEtaPage />} />
          <Route path="/demand" element={<DemandDashboardPage />} />
          <Route path="/product-optimization" element={<ProductOptimizationPage />} />
          <Route path="/data-quality" element={<DataQualityPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/sync" element={<SyncPage />} />
          <Route path="/sources" element={<DataSourcesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings/api" element={<SettingsApiPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/demo" element={<DemoPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
