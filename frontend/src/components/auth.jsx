import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlatform } from '../context/PlatformContext';

export default function Auth({ onLoginSuccess }) {
  const { loginUser, registerUser } = usePlatform();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({
    // Login fields
    loginUserId: '',
    loginPassword: '',
    
    // Signup fields
    name: '',
    phone: '',
    userId: '',
    age: '',
    password: '',
    email: '',
    state: '',
    city: ''
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!formData.loginUserId || !formData.loginPassword) {
      setError('Please fill in all fields.');
      return;
    }

    const res = await loginUser(formData.loginUserId, formData.loginPassword);
    if (res.ok) {
      localStorage.setItem('fintrend-current-user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
      const origin = location.state?.from?.pathname || '/';
      navigate(origin, { replace: true });
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const { name, phone, userId, age, password, email, state, city } = formData;

    if (!name || !phone || !userId || !age || !password || !email || !state || !city) {
      setError('Please fill in all fields.');
      return;
    }

    // Convert age to DOB
    const birthYear = new Date().getFullYear() - parseInt(age);
    const dob = `${birthYear}-01-01`;

    const res = await registerUser(email, name, dob, phone, 'FUND_MANAGER', password);
    if (res.ok) {
      setSuccessMsg('Account registered successfully! You can now log in.');
      setIsLoginView(true);
      setError('');
      
      // Clear registration fields
      setFormData(prev => ({
        ...prev,
        loginUserId: email,
        password: '',
        loginPassword: ''
      }));
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#F9FAFB',
      padding: '24px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: isLoginView ? '400px' : '520px',
        backgroundColor: '#FFFFFF',
        border: '1.5px solid var(--border-color)',
        padding: '36px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Brand/Logo Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/logo.jpg" 
            alt="FinTrend Logo" 
            style={{ 
              height: '54px', 
              width: 'auto',
              objectFit: 'contain',
              marginBottom: '4px'
            }} 
          />
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              FinTrend Analytic Platform
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Enterprise Compliance & Portfolio Management
            </p>
          </div>
        </div>

        {/* Success/Error Alerts */}
        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            borderLeft: '4px solid var(--error-red)',
            padding: '12px',
            fontSize: '0.75rem',
            color: 'var(--error-red)',
            fontWeight: '600'
          }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{
            backgroundColor: '#F0FDF4',
            borderLeft: '4px solid var(--success-green)',
            padding: '12px',
            fontSize: '0.75rem',
            color: 'var(--success-green)',
            fontWeight: '600'
          }}>
            {successMsg}
          </div>
        )}

        {isLoginView ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                Fund Manager Email
              </label>
              <input
                type="text"
                name="loginUserId"
                value={formData.loginUserId}
                onChange={handleInputChange}
                placeholder="e.g. rohit.mehta@fintechasset.com"
                style={{
                  padding: '10px 12px',
                  border: '1.5px solid var(--border-color)',
                  outline: 'none',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                Password
              </label>
              <input
                type="password"
                name="loginPassword"
                value={formData.loginPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                style={{
                  padding: '10px 12px',
                  border: '1.5px solid var(--border-color)',
                  outline: 'none',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: 'var(--primary-blue)',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                marginTop: '8px',
                textAlign: 'center',
                textTransform: 'uppercase'
              }}
            >
              Sign In
            </button>

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                New manager?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginView(false);
                    setError('');
                    setSuccessMsg('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-blue)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.75rem'
                  }}
                >
                  Create Account
                </button>
              </span>
            </div>
          </form>
        ) : (
          /* SIGNUP FORM */
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  Manager Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  style={{
                    padding: '8px 10px',
                    border: '1.5px solid var(--border-color)',
                    outline: 'none',
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  User ID (Login)
                </label>
                <input
                  type="text"
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  placeholder="e.g. jdoe99"
                  style={{
                    padding: '8px 10px',
                    border: '1.5px solid var(--border-color)',
                    outline: 'none',
                    fontSize: '0.8rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  Phone No
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="10-digit number"
                  style={{
                    padding: '8px 10px',
                    border: '1.5px solid var(--border-color)',
                    outline: 'none',
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="e.g. 35"
                  style={{
                    padding: '8px 10px',
                    border: '1.5px solid var(--border-color)',
                    outline: 'none',
                    fontSize: '0.8rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="johndoe@amc.com"
                  style={{
                    padding: '8px 10px',
                    border: '1.5px solid var(--border-color)',
                    outline: 'none',
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Min 6 chars"
                  style={{
                    padding: '8px 10px',
                    border: '1.5px solid var(--border-color)',
                    outline: 'none',
                    fontSize: '0.8rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="e.g. Maharashtra"
                  style={{
                    padding: '8px 10px',
                    border: '1.5px solid var(--border-color)',
                    outline: 'none',
                    fontSize: '0.8rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g. Mumbai"
                  style={{
                    padding: '8px 10px',
                    border: '1.5px solid var(--border-color)',
                    outline: 'none',
                    fontSize: '0.8rem'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: 'var(--primary-blue)',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                marginTop: '10px',
                textAlign: 'center',
                textTransform: 'uppercase'
              }}
            >
              Register & Request Access
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginView(true);
                    setError('');
                    setSuccessMsg('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-blue)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.75rem'
                  }}
                >
                  Log In
                </button>
              </span>
            </div>
          </form>
        )}


      </div>
    </div>
  );
}
