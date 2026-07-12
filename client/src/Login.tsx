import { useState } from 'react'

interface LoginProps {
  onNavigate: () => void;
}

export default function Login({ onNavigate }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('dispatcher')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Invalid credentials')
      } else {
        alert('Login successful!')
      }
    } catch (err) {
      setError('Server unreachable')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div style={{marginBottom: '2rem'}}>
        <h1 style={{fontSize: '2rem', fontWeight: 700, margin: 0}}>TransitOps</h1>
        <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem'}}>Smart Transport Operations Platform</p>
        
        <h2 style={{fontSize: '1.8rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem', color: '#111827'}}>Sign in to your account</h2>
        <p className="subtitle" style={{marginBottom: '1.5rem'}}>Enter your credentials to continue.</p>
      </div>

      {error && (
        <div className="error-container">
            <strong>Invalid credentials.</strong><br/>
            Account locked after 5 failed attempts.
            <br/>{error}
        </div>
      )}

      <form onSubmit={handleLogin}>
          <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                className={`form-control ${error ? 'error-input' : ''}`}
                placeholder="raven.k@transitops.in" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
          </div>

          <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                className="form-control" 
                placeholder="••••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
          </div>

          <div className="form-group">
              <label htmlFor="role">Role (RBAC)</label>
              <select 
                id="role" 
                className="form-control" 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                  <option value="dispatcher">Dispatcher</option>
                  <option value="fleet_manager">Fleet Manager</option>
                  <option value="safety_officer">Safety Officer</option>
                  <option value="financial_analyst">Financial Analyst</option>
              </select>
          </div>

          <div className="form-actions">
              <label className="checkbox-wrapper">
                  <input type="checkbox" id="remember" />
                  Remember me
              </label>
              <a href="#" className="forgot-link">Forgot password?</a>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
          

          
          <div className="auth-links">
              Don't have an account? <span onClick={onNavigate}>Sign up for free!</span>
          </div>
      </form>
      

    </>
  )
}
