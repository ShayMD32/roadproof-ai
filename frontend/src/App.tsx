import {
  Navigate,
  Route,
  Routes,
} from 'react-router'

import DashboardLayout from './components/layout/DashboardLayout'

import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import VehicleDetails from './pages/VehicleDetails'
import NewInspection from './pages/NewInspection'
import Reports from './pages/Reports'
import InspectionReport from './pages/InspectionReport'


function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/vehicles"
          element={<Vehicles />}
        />

        <Route
          path="/vehicles/:registration"
          element={<VehicleDetails />}
        />

        <Route
          path="/inspections/new"
          element={<NewInspection />}
        />

        <Route
          path="/reports"
          element={<Reports />}
        />

        <Route
          path="/reports/:inspectionId"
          element={<InspectionReport />}
        />
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