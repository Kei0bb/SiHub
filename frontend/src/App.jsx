import { useState } from 'react'
import './index.css'
import Dashboard from './pages/Dashboard'
import WaferMapViewer from './pages/WaferMapViewer'
import { LayoutDashboard, BarChart2, FileText, Settings, User, Bell, Map } from 'lucide-react'
import { ThemeProvider } from './context/ThemeContext'
import ThemeToggle from './components/ThemeToggle'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <ThemeProvider>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div style={{ width: '24px', height: '24px', background: 'var(--primary-color)', borderRadius: '6px' }}></div>
            SONAR
          </div>
          <nav>
            <div
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={20} />
              Dashboard
            </div>
            <div
              className={`nav-item ${activeTab === 'wafermap' ? 'active' : ''}`}
              onClick={() => setActiveTab('wafermap')}
            >
              <Map size={20} />
              Wafer Map
            </div>
            <div className="nav-item">
              <BarChart2 size={20} />
              Analytics
            </div>
            <div className="nav-item">
              <FileText size={20} />
              Reports
            </div>
            <div className="nav-item" style={{ marginTop: 'auto' }}>
              <Settings size={20} />
              Settings
            </div>
          </nav>
        </aside>

        <main className="main-content">
          <header className="header">
            <h3>{activeTab === 'dashboard' ? 'Yield Overview' : 'Wafer Map Viewer'}</h3>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <ThemeToggle />
              <Bell size={20} color="var(--text-muted)" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Keisuke</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Engineer</div>
                </div>
                <div style={{ padding: '8px', background: 'var(--card-bg)', borderRadius: '50%', border: '1px solid var(--border-color)' }}>
                  <User size={20} />
                </div>
              </div>
            </div>
          </header>

          <div className="dashboard-content">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'wafermap' && <WaferMapViewer />}
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App
