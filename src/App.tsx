/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
import LandingPage from './pages/LandingPage';
import Inscription from './pages/auth/Inscription';
import Connexion from './pages/auth/Connexion';
import ProprietaireDashboard from './pages/dashboard/ProprietaireDashboard';
import MaisonsList from './pages/dashboard/maisons/MaisonsList';
import MaisonDetails from './pages/dashboard/maisons/MaisonDetails';
import PaymentsPage from './pages/dashboard/paiements/PaymentsPage';
import MoMoParams from './pages/dashboard/parametres/MoMoParams';
import ContratsPage from './pages/dashboard/contrats/ContratsPage';
import ContratUpload from './pages/dashboard/contrats/ContratUpload';
import UniteDetails from './pages/dashboard/maisons/UniteDetails';
import ImpotsPage from './pages/dashboard/impots/ImpotsPage';
import AlertSettingsPage from './pages/dashboard/parametres/AlertSettingsPage';
import PayerPage from './pages/locataire/PayerPage';
import LocataireDashboard from './pages/locataire/LocataireDashboard';
import DepensesPage from './pages/dashboard/depenses/DepensesPage';
import LocatairesPage from './pages/dashboard/locataires/LocatairesPage';
import AnalyticsPage from './pages/dashboard/analytics/AnalyticsPage';
import ActifsPage from './pages/dashboard/actifs/ActifsPage';
import MessagesPage from './pages/dashboard/messages/MessagesPage';
import CommissionPage from './pages/dashboard/commission/CommissionPage';
import TarifsPage from './pages/tarifs/TarifsPage';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import UnitesPublique from './pages/UnitesPublique';
import CautionsPage from './pages/dashboard/cautions/CautionsPage';
import GestionnairesPage from './pages/dashboard/gestionnaires/GestionnairesPage';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
// AbonnementPage retiré — modèle commission 3.5%

export default function App() {
  return (
    <Router basename={BASE}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/unites" element={<UnitesPublique />} />
        <Route path="/tarifs" element={<TarifsPage />} />
        <Route path="/auth/inscription" element={<Inscription />} />
        <Route path="/auth/connexion" element={<Connexion />} />
        
        {/* Protected Dashboard Routes (Proprietaire) */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><ProprietaireDashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/maisons" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><MaisonsList /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/maisons/:id" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><MaisonDetails /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/paiements" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><PaymentsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/contrats" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><ContratsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/contrats/nouveau" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><ContratUpload /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/contrats/:contratId" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><ContratUpload /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/unites/:uniteId" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><UniteDetails /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/impots" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><ImpotsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/alertes" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><AlertSettingsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/depenses" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><DepensesPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/locataires" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><LocatairesPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/analytics" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><AnalyticsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/momo" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><MoMoParams /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/messages" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><MessagesPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/commission" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><CommissionPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/actifs" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><ActifsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/cautions" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><CautionsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/gestionnaires" element={
          <ProtectedRoute requiredRole="proprietaire">
            <AppLayout userType="proprietaire"><GestionnairesPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="proprietaire" requireAdmin>
            <AppLayout userType="proprietaire"><SuperAdminDashboard /></AppLayout>
          </ProtectedRoute>
        } />
        
        {/* Protected Tenant Routes (Locataire) */}
        <Route path="/locataire" element={
          <ProtectedRoute requiredRole="locataire">
            <AppLayout userType="locataire"><LocataireDashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/locataire/payer" element={
          <ProtectedRoute requiredRole="locataire">
            <AppLayout userType="locataire"><PayerPage /></AppLayout>
          </ProtectedRoute>
        } />
        
        {/* Fallback to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
