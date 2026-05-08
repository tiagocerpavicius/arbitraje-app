'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Cuenta creada. Ya podés iniciar sesión.');
        setMode('login');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : msg);
    } finally {
      setLoading(false);
    }
  };

  const btnStyle = (active: boolean) => ({
    flex: 1, padding: '8px',
    background: active ? 'var(--violet)' : 'transparent',
    color: active ? '#fff' : 'var(--muted2)',
    border: 'none', borderRadius: '6px', cursor: 'pointer',
    fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '11px',
    letterSpacing: '0.08em', textTransform: 'uppercase' as const, transition: 'all 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '30px', color: 'var(--text)', letterSpacing: '0.04em', marginBottom: '6px' }}>
            ARB<span style={{ color: 'var(--violet)' }}>/</span>TC
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted2)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em' }}>
            CAUCIONES · CEDEARs
          </div>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px', marginBottom: '24px' }}>
          <button onClick={() => { setMode('login'); setError(''); }} style={btnStyle(mode === 'login')}>Iniciar sesión</button>
          <button onClick={() => { setMode('register'); setError(''); }} style={btnStyle(mode === 'register')}>Crear cuenta</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', color: 'var(--muted2)', marginBottom: '5px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Email</label>
            <input className="input-dark" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', color: 'var(--muted2)', marginBottom: '5px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Contraseña</label>
            <input className="input-dark" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '6px', padding: '10px 12px', fontSize: '12px', color: 'var(--red)' }}>{error}</div>}
          {success && <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '6px', padding: '10px 12px', fontSize: '12px', color: 'var(--green)' }}>{success}</div>}

          <button type="submit" disabled={loading}
            style={{ background: loading ? 'var(--surface2)' : 'var(--violet)', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '4px', letterSpacing: '0.05em' }}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
