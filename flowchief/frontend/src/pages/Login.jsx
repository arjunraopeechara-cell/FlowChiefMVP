import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed');
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h1>FlowChief</h1>
        <p className="muted">Sign in to receive your daily briefing.</p>
        <form onSubmit={onSubmit}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          {error && <div className="error">{error}</div>}
          <button type="submit">Login</button>
        </form>
        <div className="muted">
          New here? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
