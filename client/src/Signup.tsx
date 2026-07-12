import { useState } from 'react'

interface SignupProps {
  onNavigate: () => void;
}

export default function Signup({ onNavigate }: SignupProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [emailExists, setEmailExists] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailBlur = async () => {
    if (!email) return;
    try {
      const res = await fetch('http://localhost:3000/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.exists) {
        setEmailExists(true)
        setError('Email is already registered.')
      } else {
        setEmailExists(false)
        setError(null)
      }
    } catch (err) {
      console.error("Could not reach Bloom Filter check")
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (emailExists) {
      setError('Cannot register with an existing email.')
      return;
    }
    
    setIsLoading(true)
    
    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
      } else {
        alert('Account creation successful!')
        onNavigate()
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
          
          <h2 style={{fontSize: '1.8rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem', color: '#111827'}}>Create Account</h2>
          <p className="subtitle" style={{marginBottom: '1.5rem'}}>Join the network. Enter your details.</p>
        </div>

        {error && (
            <div className="error-container">
                {error}
            </div>
        )}

        <form onSubmit={handleSignup}>
            <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  className="form-control" 
                  placeholder="Jane Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
            </div>

            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  className={`form-control ${emailExists ? 'error-input' : ''}`} 
                  placeholder="jane.doe@transitops.in" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  required 
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  className="form-control" 
                  placeholder="Create a strong password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={8} 
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
                    <option value="" disabled>Select a role...</option>
                    <option value="dispatcher">Dispatcher</option>
                    <option value="fleet_manager">Fleet Manager</option>
                    <option value="safety_officer">Safety Officer</option>
                    <option value="financial_analyst">Financial Analyst</option>
                </select>
            </div>

            <button type="submit" className="btn-primary" style={{marginTop: '1rem'}} disabled={isLoading || emailExists}>
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
            


            <div className="auth-links">
                Already have an account? <span onClick={onNavigate}>Sign in instead!</span>
            </div>
        </form>
    </>
  )
}
