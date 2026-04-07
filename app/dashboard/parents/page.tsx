'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { LogoutButton } from '@/components/logout-button';
import { supabase } from '@/lib/supabase';
import type { Book, Child, MinuteTransaction, ParentSettings, ReadingLog } from '@/lib/types';

const PIN_SESSION_KEY = 'leu_ganhou_parent_pin_ok';

export default function ParentsPage() {
  return (
    <AuthGuard>
      <ParentsContent />
    </AuthGuard>
  );
}

function ParentsContent() {
  const [children, setChildren] = useState<Child[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [minutes, setMinutes] = useState<MinuteTransaction[]>([]);
  const [settings, setSettings] = useState<ParentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinReady, setPinReady] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [message, setMessage] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [pinForm, setPinForm] = useState({ current: '', next: '', confirm: '' });

  async function ensureSettings() {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return null;

    const { data, error } = await supabase.from('parent_settings').select('*').eq('parent_id', user.id).single();
    if (data) {
      setSettings(data as ParentSettings);
      return data as ParentSettings;
    }

    if (error) {
      const { data: created, error: createError } = await supabase
        .from('parent_settings')
        .upsert({ parent_id: user.id, parent_pin: '1234' })
        .select('*')
        .single();
      if (createError) {
        setPinMessage(createError.message);
        return null;
      }
      setSettings(created as ParentSettings);
      return created as ParentSettings;
    }

    return null;
  }

  async function loadAll() {
    setLoading(true);
    const currentSettings = await ensureSettings();
    const [{ data: childrenData }, { data: booksData }, { data: logsData }, { data: minutesData }] = await Promise.all([
      supabase.from('children').select('*').order('created_at', { ascending: true }),
      supabase.from('books').select('*').order('created_at', { ascending: false }),
      supabase.from('reading_logs').select('*').order('created_at', { ascending: false }),
      supabase.from('minute_transactions').select('*').order('created_at', { ascending: false }),
    ]);

    setChildren((childrenData ?? []) as Child[]);
    setBooks((booksData ?? []) as Book[]);
    setLogs((logsData ?? []) as ReadingLog[]);
    setMinutes((minutesData ?? []) as MinuteTransaction[]);
    setLoading(false);

    const hasSessionPin = typeof window !== 'undefined' && sessionStorage.getItem(PIN_SESSION_KEY) === 'ok';
    setPinReady(Boolean(hasSessionPin && currentSettings));
  }

  useEffect(() => {
    loadAll();
  }, []);

  const report = useMemo(() => ({
    children: children.length,
    books: books.length,
    doneBooks: books.filter((book) => book.status === 'concluido').length,
    pages: logs.reduce((sum, item) => sum + item.pages_read, 0),
    minutes: minutes.reduce((sum, item) => sum + item.minutes_delta, 0),
    history: logs.length + minutes.length,
  }), [children, books, logs, minutes]);

  async function validatePin(e: React.FormEvent) {
    e.preventDefault();
    setPinMessage('');
    const currentSettings = settings ?? await ensureSettings();
    if (!currentSettings) return;

    if (pinValue.trim() !== currentSettings.parent_pin) {
      setPinMessage('PIN incorreto.');
      return;
    }

    sessionStorage.setItem(PIN_SESSION_KEY, 'ok');
    setPinReady(true);
    setPinValue('');
  }

  async function changePin(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const currentSettings = settings ?? await ensureSettings();
    if (!currentSettings) return;

    if (pinForm.current !== currentSettings.parent_pin) {
      setMessage('PIN atual incorreto.');
      return;
    }
    if (!pinForm.next.trim()) {
      setMessage('Digite o novo PIN.');
      return;
    }
    if (pinForm.next !== pinForm.confirm) {
      setMessage('A confirmação do novo PIN não confere.');
      return;
    }

    const { data, error } = await supabase
      .from('parent_settings')
      .update({ parent_pin: pinForm.next.trim() })
      .eq('parent_id', currentSettings.parent_id)
      .select('*')
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setSettings(data as ParentSettings);
    setPinForm({ current: '', next: '', confirm: '' });
    sessionStorage.removeItem(PIN_SESSION_KEY);
    setPinReady(false);
    setMessage('PIN alterado com sucesso. Digite o novo PIN para entrar novamente na área dos pais.');
  }

  async function addBonus(childId: string, amount: number) {
    setMessage('');
    const { error } = await supabase.from('minute_transactions').insert({
      child_id: childId,
      kind: 'bonus',
      minutes_delta: amount,
      note: `Bônus dado pelos pais: +${amount} minutos`,
    });
    if (error) setMessage(error.message);
    await loadAll();
  }

  async function deleteChild(childId: string) {
    if (!confirm('Tem certeza que deseja apagar esta criança?')) return;
    const { error } = await supabase.from('children').delete().eq('id', childId);
    if (error) setMessage(error.message);
    await loadAll();
  }

  async function deleteBook(bookId: string) {
    if (!confirm('Tem certeza que deseja apagar este livro?')) return;
    const { error } = await supabase.from('books').delete().eq('id', bookId);
    if (error) setMessage(error.message);
    await loadAll();
  }

  if (loading) {
    return <div className="center-shell"><div className="glass-card"><p className="subtitle">Carregando área dos pais...</p></div></div>;
  }

  if (!pinReady) {
    return (
      <div className="center-shell">
        <div className="glass-card">
          <div className="logo">🔐</div>
          <h1 className="title">Área dos pais</h1>
          <p className="subtitle">Digite o PIN para liberar as ações administrativas.</p>
          <form onSubmit={validatePin}>
            <label className="label">PIN dos pais</label>
            <input className="input" type="password" value={pinValue} onChange={(e) => setPinValue(e.target.value)} placeholder="Digite o PIN" required />
            <button className="btn btn-primary btn-block" type="submit">Entrar na área dos pais</button>
          </form>
          <div className="spacer" />
          <Link className="btn btn-soft btn-block" href="/dashboard">Voltar</Link>
          <div className="spacer" />
          <div className="notice">PIN inicial: 1234. Depois você pode trocar aqui dentro.</div>
          {pinMessage && <><div className="spacer" /><div className="notice">{pinMessage}</div></>}
          {message && <><div className="spacer" /><div className="notice">{message}</div></>}
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="topbar">
        <div>
          <div className="muted">Painel administrativo</div>
          <h1 style={{ margin: '4px 0 0' }}>Área dos pais</h1>
        </div>
        <div className="topbar-actions">
          <Link className="btn btn-soft" href="/dashboard">Voltar</Link>
          <button className="btn btn-blue" onClick={() => { sessionStorage.removeItem(PIN_SESSION_KEY); setPinReady(false); }}>Bloquear área</button>
          <LogoutButton />
        </div>
      </div>

      <div className="hero">
        <h1>Relatório geral</h1>
        <p>Somente os pais podem entrar aqui com PIN, dar bônus, remover livros, apagar crianças e trocar o PIN de acesso.</p>
      </div>

      <div className="stats">
        <div className="stat purple"><strong>{report.children}</strong><span>Crianças</span></div>
        <div className="stat green"><strong>{report.books}</strong><span>Livros</span></div>
        <div className="stat blue"><strong>{report.doneBooks}</strong><span>Concluídos</span></div>
        <div className="stat orange"><strong>{report.pages}</strong><span>Páginas lidas</span></div>
      </div>

      {message && <><div className="spacer" /><div className="notice">{message}</div></>}

      <div className="grid">
        <div className="card"><h3>Minutos totais</h3><div className="notice">{report.minutes} minutos</div></div>
        <div className="card"><h3>Movimentações</h3><div className="notice">{report.history} registros</div></div>
      </div>

      <div className="spacer" />

      <div className="card">
        <h2>Trocar PIN dos pais</h2>
        <form className="grid-2" onSubmit={changePin}>
          <div>
            <label className="label">PIN atual</label>
            <input className="input" type="password" value={pinForm.current} onChange={(e) => setPinForm({ ...pinForm, current: e.target.value })} required />
          </div>
          <div>
            <label className="label">Novo PIN</label>
            <input className="input" type="password" value={pinForm.next} onChange={(e) => setPinForm({ ...pinForm, next: e.target.value })} required />
          </div>
          <div>
            <label className="label">Confirmar novo PIN</label>
            <input className="input" type="password" value={pinForm.confirm} onChange={(e) => setPinForm({ ...pinForm, confirm: e.target.value })} required />
          </div>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button className="btn btn-primary btn-block" type="submit">Salvar novo PIN</button>
          </div>
        </form>
      </div>

      <div className="spacer" />
      <div className="card">
        <h2>Gerenciar crianças</h2>
        {children.length === 0 ? (
          <p className="muted">Nenhuma criança cadastrada ainda.</p>
        ) : (
          <div className="book-list">
            {children.map((child) => {
              const childBooks = books.filter((book) => book.child_id === child.id);
              const childPages = logs.filter((item) => item.child_id === child.id).reduce((sum, item) => sum + item.pages_read, 0);
              const childMinutes = minutes.filter((item) => item.child_id === child.id).reduce((sum, item) => sum + item.minutes_delta, 0);
              return (
                <div className="book-card" key={child.id}>
                  <h3>{child.avatar} {child.name}</h3>
                  <p className="muted">Idade: {child.age ?? '-'}</p>
                  <p className="muted">Meta semanal: {child.weekly_goal_pages}</p>
                  <p className="muted">Livros: {childBooks.length}</p>
                  <p className="muted">Páginas lidas: {childPages}</p>
                  <p className="muted">Minutos atuais: {childMinutes}</p>
                  <div className="grid-2">
                    <button className="btn btn-green" onClick={() => addBonus(child.id, 10)}>+10 min</button>
                    <button className="btn btn-blue" onClick={() => addBonus(child.id, 20)}>+20 min</button>
                  </div>
                  <div className="spacer" />
                  <button className="btn btn-danger btn-block" onClick={() => deleteChild(child.id)}>Apagar criança</button>
                  <div className="spacer" />
                  <div>
                    <strong>Livros da criança</strong>
                    <div className="spacer" />
                    {childBooks.length === 0 ? <p className="muted">Nenhum livro.</p> : childBooks.map((book) => (
                      <div className="history-item" key={book.id}>
                        <strong>{book.title}</strong>
                        <div className="muted">{book.current_page}/{book.total_pages} páginas • {book.status}</div>
                        <div className="spacer" />
                        <button className="btn btn-danger btn-block" onClick={() => deleteBook(book.id)}>Apagar livro</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="spacer" />
      <div className="grid">
        <div className="card">
          <h2>Últimas leituras</h2>
          {logs.slice(0, 10).map((log) => (
            <div className="history-item" key={log.id}>
              <strong>📖 {log.pages_read} páginas lidas</strong>
              <div className="muted">{new Date(log.created_at).toLocaleString('pt-BR')}</div>
              <div>Página: {log.previous_page} → {log.current_page}</div>
              <div>Minutos ganhos: +{log.minutes_earned}</div>
            </div>
          ))}
          {logs.length === 0 && <p className="muted">Nenhuma leitura ainda.</p>}
        </div>

        <div className="card">
          <h2>Últimas movimentações de minutos</h2>
          {minutes.slice(0, 10).map((item) => (
            <div className="history-item" key={item.id}>
              <strong>{item.kind === 'bonus' ? '🎁 Bônus' : item.kind === 'usage' ? '🎮 Uso' : '⏱️ Leitura'}</strong>
              <div className="muted">{new Date(item.created_at).toLocaleString('pt-BR')}</div>
              <div>{item.note ?? 'Sem observação'}</div>
              <div>Variação: {item.minutes_delta > 0 ? '+' : ''}{item.minutes_delta} min</div>
            </div>
          ))}
          {minutes.length === 0 && <p className="muted">Nenhuma movimentação ainda.</p>}
        </div>
      </div>
    </div>
  );
}
