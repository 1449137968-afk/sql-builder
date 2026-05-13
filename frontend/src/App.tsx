import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import BuilderPage from './pages/BuilderPage'
import FieldsPage from './pages/FieldsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<BuilderPage />} />
        <Route path="/fields" element={<FieldsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
