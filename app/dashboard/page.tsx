'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthGuard } from '@/components/auth-guard';
import { LogoutButton } from '@/components/logout-button';
import type { Child, Book, ReadingLog, MinuteTransaction } from '@/lib/types';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', age: '', avatar: '🧒', weekly_goal_pages: '30' });

  async function loadChildren() {
    setLoading(true);
    const { data, error } = await supabase.from('children').select('*').order('created_at', { ascending: true });
    if (error) setMessage(error.message);
    else setChildren((data ?? []) as Child[]);
    setLoading(false);
  }

  useEffect(() => {
    loadChildren();
  }, []);

  async function createChild(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return;

    const payload = {
      parent_id: user.id,
      name: form.name,
      age: form.age ? Number(form.age) : null,
      avatar: form.avatar,
      weekly_goal_pages: Number(form.weekly_goal_pages || 0),
      bonus_minutes: 0,
    };

    const { error } = await supabase.from('children').insert(payload);
    if (error) {
      setMessage(error.message);
      return;
    }

    setForm({ name: '', age: '', avatar: '🧒', weekly_goal_pages: '30' });
    await loadChildren();
  }

  const totals = useMemo(() => ({
    children: children.length,
  }), [children]);

  return (
    <div className="page-shell">
      <div className="topbar">
        <div>
          <div className="muted">Painel principal</div>
          <h1 style={{ margin: '4px 0 0' }}>Leu, Ganhou!</h1>
        </div>
        <div className="topbar-actions">
          <Link className="btn btn-blue" href="/dashboard/parents">Área dos pais</Link>
          <LogoutButton />
        </div>
      </div>

      <div className="hero">
        <h1>Perfis das crianças</h1>
        <p>Cadastre crianças, abra o perfil de cada uma e acompanhe leitura, minutos e relatórios em nuvem.</p>
      </div>

      <div className="stats">
        <div className="stat purple"><strong>{totals.children}</strong><span>Crianças</span></div>
        <div className="stat green"><strong>2</strong><span>Min por página</span></div>
        <div className="stat blue"><strong>100%</strong><span>Dados online</span></div>
        <div className="stat orange"><strong>Web</strong><span>MVP profissional</span></div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Adicionar criança</h2>
          <form onSubmit={createChild}>
            <label className="label">Nome</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

            <label className="label">Idade</label>
            <input className="input" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />

            <label className="label">Avatar</label>
            <select className="select" value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })}>
              <option value="🧒">🧒 Criança</option>
              <option value="👦">👦 Menino</option>
              <option value="👧">👧 Menina</option>
              <option value="🦸">🦸 Herói</option>
              <option value="🦄">🦄 Unicórnio</option>
              <option value="🚀">🚀 Foguete</option>
              <option value="🐼">🐼 Panda</option>
            </select>

            <label className="label">Meta semanal de páginas</label>
            <input className="input" type="number" value={form.weekly_goal_pages} onChange={(e) => setForm({ ...form, weekly_goal_pages: e.target.value })} />

            <button className="btn btn-primary btn-block" type="submit">Salvar criança</button>
          </form>
          {message && <><div className="spacer" /><div className="notice">{message}</div></>}
        </div>

        <div className="card">
          <h2>Próximos passos</h2>
          <ul className="list-clean muted">
            <li>• Cada criança tem livros e progresso próprios.</li>
            <li>• Os pais gerenciam bônus e remoções na área dos pais.</li>
            <li>• O banco salva tudo no Supabase.</li>
            <li>• A publicação web pode ser feita na Vercel.</li>
          </ul>
        </div>
      </div>

      <div className="spacer" />

      <div className="card">
        <h2>Perfis criados</h2>
        {loading ? (
          <p className="muted">Carregando...</p>
        ) : children.length === 0 ? (
          <p className="muted">Nenhuma criança cadastrada ainda.</p>
        ) : (
          <div className="children-grid">
            {children.map((child) => (
              <div className="child-card" key={child.id}>
                <div className="child-avatar">{child.avatar}</div>
                <h3>{child.name}</h3>
                <p className="muted">Idade: {child.age ?? '-'}</p>
                <p className="muted">Meta: {child.weekly_goal_pages} páginas</p>
                <Link className="btn btn-primary btn-block" href={`/dashboard/children/${child.id}`}>
                  Abrir perfil
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
