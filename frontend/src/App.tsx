import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router'

import type {
  ReactNode,
} from 'react'

import {
  isAuthenticated,
} from './api/client'

import DashboardLayout from './components/layout/DashboardLayout'

import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import VehicleDetails from './pages/VehicleDetails'
import NewInspection from './pages/NewInspection'
import Reports from './pages/Reports'
import InspectionReport from './pages/InspectionReport'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'


function ProtectedRoutes() {
  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  return <Outlet />
}


function PublicOnlyRoute({
  children,
}: {
  children: ReactNode
}) {
  if (isAuthenticated()) {
    return (
      <Navigate
        to="/app"
        replace
      />
    )
  }

  return children
}


function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Landing />}
      />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      <Route
        element={<ProtectedRoutes />}
      >
        <Route
          element={<DashboardLayout />}
        >
          <Route
            path="/app"
            element={<Dashboard />}
          />

          <Route
            path="/app/vehicles"
            element={<Vehicles />}
          />

          <Route
            path="/app/vehicles/:registration"
            element={<VehicleDetails />}
          />

          <Route
            path="/app/inspections/new"
            element={<NewInspection />}
          />

          <Route
            path="/app/reports"
            element={<Reports />}
          />

          <Route
            path="/app/reports/:inspectionId"
            element={<InspectionReport />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  )
}


export default App