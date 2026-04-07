'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { LogoutButton } from '@/components/logout-button';
import { supabase } from '@/lib/supabase';
import type { Book, Child, MinuteTransaction, ReadingLog } from '@/lib/types';

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
  const [message, setMessage] = useState('');

  async function loadAll() {
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

  return (
    <div className="page-shell">
      <div className="topbar">
        <div>
          <div className="muted">Painel administrativo</div>
          <h1 style={{ margin: '4px 0 0' }}>Área dos pais</h1>
        </div>
        <div className="topbar-actions">
          <Link className="btn btn-soft" href="/dashboard">Voltar</Link>
          <LogoutButton />
        </div>
      </div>

      <div className="hero">
        <h1>Relatório geral</h1>
        <p>Os pais controlam bônus, removem livros e visualizam tudo que foi lido, jogado e concluído.</p>
      </div>

      <div className="stats">
        <div className="stat purple"><strong>{report.children}</strong><span>Crianças</span></div>
        <div className="stat green"><strong>{report.books}</strong><span>Livros</span></div>
        <div className="stat blue"><strong>{report.doneBooks}</strong><span>Concluídos</span></div>
        <div className="stat orange"><strong>{report.pages}</strong><span>Páginas lidas</span></div>
      </div>

      <div className="grid">
        <div className="card"><h3>Minutos totais</h3><div className="notice">{report.minutes} minutos</div></div>
        <div className="card"><h3>Movimentações</h3><div className="notice">{report.history} registros</div></div>
      </div>

      {message && <><div className="spacer" /><div className="notice">{message}</div></>}

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
        </div>
        <div className="card">
          <h2>Últimas movimentações de minutos</h2>
          {minutes.slice(0, 10).map((item) => (
            <div className="history-item" key={item.id}>
              <strong>{item.kind === 'bonus' ? '🎁 Bônus' : item.kind === 'usage' ? '🎮 Uso' : '⏱️ Leitura'}</strong>
              <div className="muted">{new Date(item.created_at).toLocaleString('pt-BR')}</div>
              <div>{item.note ?? 'Sem observação'}</div>
              <div>{item.minutes_delta > 0 ? '+' : ''}{item.minutes_delta} min</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
