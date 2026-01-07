import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function IdEntryPage() {
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signInWithCode } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessCode.trim()) { setError('Please enter access code'); return }
    setLoading(true); setError('')
    try {
      await signInWithCode(accessCode.trim())
      navigate('/rooms')
    } catch (err) {
      console.error(err)
      setError('Sign in failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth:420, width:'100%' }}>
        <h2>Enter Access Code</h2>
        <form onSubmit={handleSubmit} style={{ marginTop:12 }}>
          <input className="input" value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="Your access code" />
          {error && <div style={{ color:'red', marginTop:6 }}>{error}</div>}
          <div style={{ marginTop:12 }}>
            <button className="button" type="submit" disabled={loading}>{loading ? 'Entering...' : 'Enter'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
