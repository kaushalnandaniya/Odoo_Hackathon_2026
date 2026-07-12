import { useState } from 'react'
import Login from './Login'
import Signup from './Signup'
import './index.css'

function App() {
  const [currentView, setCurrentView] = useState<'login' | 'signup'>('login')

  return (
    <div className="split-layout">
      {/* Left Side: Forms */}
      <div className="left-side">
        <div className="form-wrapper">
          {currentView === 'login' ? (
            <Login onNavigate={() => setCurrentView('signup')} />
          ) : (
            <Signup onNavigate={() => setCurrentView('login')} />
          )}
        </div>
      </div>

      {/* Right Side: Illustration */}
      <div className="right-side"></div>
    </div>
  )
}

export default App
