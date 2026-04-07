'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName });
          await supabase.from('parent_settings').upsert({ parent_id: data.user.id, parent_pin: '1234' });
        }
        setMessage('Conta criada com sucesso. O PIN inicial da área dos pais é 1234. Agora faça login.');
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (error: any) {
      setMessage(error.message ?? 'Não foi possível continuar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-shell">
      <div className="glass-card">
        <div className="logo">📚</div>
        <h1 className="title">Leu, Ganhou!</h1>
        <p className="subtitle">
          O responsável entra com login, e a área dos pais continua protegida por PIN separado.
        </p>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label className="label">Nome do responsável</label>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ex: Diego Araújo" />
            </>
          )}

          <label className="label">E-mail</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />

          <label className="label">Senha</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required />

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <div className="spacer" />
        {message && <div className="notice">{message}</div>}
        <div className="spacer" />
        <button className="btn btn-soft btn-block" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'Criar conta de responsável' : 'Já tenho conta'}
        </button>
      </div>
    </div>
  );
}
