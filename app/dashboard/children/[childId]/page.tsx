'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AuthGuard } from '@/components/auth-guard';
import type { Book, Child, MinuteTransaction, ReadingLog } from '@/lib/types';

export default function ChildPage() {
  return (
    <AuthGuard>
      <ChildContent />
    </AuthGuard>
  );
}

function ChildContent() {
  const params = useParams<{ childId: string }>();
  const childId = params.childId;
  const [child, setChild] = useState<Child | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [minutes, setMinutes] = useState<MinuteTransaction[]>([]);
  const [message, setMessage] = useState('');
  const [bookForm, setBookForm] = useState({ title: '', author: '', category: '', total_pages: '96' });
  const [useMinutesValue, setUseMinutesValue] = useState('');

  async function loadAll() {
    const [{ data: childData }, { data: bookData }, { data: logData }, { data: minutesData }] = await Promise.all([
      supabase.from('children').select('*').eq('id', childId).single(),
      supabase.from('books').select('*').eq('child_id', childId).order('created_at', { ascending: false }),
      supabase.from('reading_logs').select('*').eq('child_id', childId).order('created_at', { ascending: false }),
      supabase.from('minute_transactions').select('*').eq('child_id', childId).order('created_at', { ascending: false }),
    ]);

    setChild((childData as Child) ?? null);
    setBooks((bookData as Book[]) ?? []);
    setLogs((logData as ReadingLog[]) ?? []);
    setMinutes((minutesData as MinuteTransaction[]) ?? []);
  }

  useEffect(() => {
    loadAll();
  }, [childId]);

  const saldoMinutos = useMemo(
    () => minutes.reduce((sum, item) => sum + item.minutes_delta, 0) + (child?.bonus_minutes ?? 0),
    [minutes, child],
  );

  const livrosConcluidos = books.filter((book) => book.status === 'concluido').length;
  const totalPaginas = logs.reduce((sum, item) => sum + item.pages_read, 0);

  async function createBook(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const { error } = await supabase.from('books').insert({
      child_id: childId,
      title: bookForm.title,
      author: bookForm.author || null,
      category: bookForm.category || null,
      total_pages: Number(bookForm.total_pages),
      current_page: 0,
      status: 'nao_iniciado',
    });

    if (error) return setMessage(error.message);
    setBookForm({ title: '', author: '', category: '', total_pages: '96' });
    await loadAll();
  }

  async function registerReading(book: Book, currentPage: number) {
    setMessage('');
    if (currentPage <= book.current_page) return setMessage('A nova página precisa ser maior que a atual.');
    if (currentPage > book.total_pages) return setMessage('A nova página não pode passar do total do livro.');

    const pagesRead = currentPage - book.current_page;
    const minutesEarned = pagesRead * 2;
    const nextStatus = currentPage === book.total_pages ? 'concluido' : 'em_andamento';

    const { error: updateError } = await supabase
      .from('books')
      .update({ current_page: currentPage, status: nextStatus })
      .eq('id', book.id);

    if (updateError) return setMessage(updateError.message);

    const { error: logError } = await supabase.from('reading_logs').insert({
      child_id: childId,
      book_id: book.id,
      previous_page: book.current_page,
      current_page: currentPage,
      pages_read: pagesRead,
      minutes_earned: minutesEarned,
    });
    if (logError) return setMessage(logError.message);

    const { error: minutesError } = await supabase.from('minute_transactions').insert({
      child_id: childId,
      kind: 'reading',
      minutes_delta: minutesEarned,
      note: `Leitura do livro ${book.title}`,
    });
    if (minutesError) return setMessage(minutesError.message);

    await loadAll();
  }

  async function useMinutes(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const value = Number(useMinutesValue);
    if (!value || value <= 0) return setMessage('Digite um valor válido.');
    if (value > saldoMinutos) return setMessage('Saldo insuficiente.');

    const { error } = await supabase.from('minute_transactions').insert({
      child_id: childId,
      kind: 'usage',
      minutes_delta: -value,
      note: 'Uso de minutos para jogar',
    });
    if (error) return setMessage(error.message);

    setUseMinutesValue('');
    await loadAll();
  }

  if (!child) {
    return <div className="center-shell"><div className="glass-card"><p className="subtitle">Carregando perfil...</p></div></div>;
  }

  return (
    <div className="page-shell">
      <div className="topbar">
        <div>
          <div className="muted">Perfil da criança</div>
          <h1 style={{ margin: '4px 0 0' }}>{child.name}</h1>
        </div>
        <div className="topbar-actions">
          <Link className="btn btn-soft" href="/dashboard">Voltar</Link>
          <Link className="btn btn-blue" href="/dashboard/parents">Área dos pais</Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="profile-top">
          <div className="avatar-round">{child.avatar}</div>
          <div>
            <h2>{child.name}</h2>
            <div className="muted">Idade: {child.age ?? '-'}</div>
            <div className="muted">Meta semanal: {child.weekly_goal_pages} páginas</div>
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat purple"><strong>{saldoMinutos}</strong><span>Minutos disponíveis</span></div>
        <div className="stat green"><strong>{totalPaginas}</strong><span>Páginas lidas</span></div>
        <div className="stat blue"><strong>{books.length}</strong><span>Livros cadastrados</span></div>
        <div className="stat orange"><strong>{livrosConcluidos}</strong><span>Livros concluídos</span></div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Cadastrar livro</h2>
          <form onSubmit={createBook}>
            <label className="label">Título</label>
            <input className="input" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} required />
            <label className="label">Autor</label>
            <input className="input" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
            <label className="label">Categoria</label>
            <input className="input" value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} />
            <label className="label">Total de páginas</label>
            <input className="input" type="number" value={bookForm.total_pages} onChange={(e) => setBookForm({ ...bookForm, total_pages: e.target.value })} required />
            <button className="btn btn-green btn-block" type="submit">Salvar livro</button>
          </form>
        </div>

        <div className="card">
          <h2>Usar minutos</h2>
          <form onSubmit={useMinutes}>
            <label className="label">Quantos minutos deseja usar?</label>
            <input className="input" type="number" value={useMinutesValue} onChange={(e) => setUseMinutesValue(e.target.value)} />
            <div className="grid-2">
              <button className="btn btn-orange" type="submit">Confirmar uso</button>
              <button className="btn btn-soft" type="button" onClick={() => setUseMinutesValue(String(saldoMinutos))}>Usar tudo</button>
            </div>
          </form>
          <div className="spacer" />
          <div className="notice">Saldo atual: {saldoMinutos} minutos</div>
        </div>
      </div>

      {message && <><div className="spacer" /><div className="notice">{message}</div></>}

      <div className="spacer" />

      <div className="card">
        <h2>Livros cadastrados</h2>
        {books.length === 0 ? (
          <p className="muted">Nenhum livro cadastrado ainda.</p>
        ) : (
          <div className="book-list">
            {books.map((book) => {
              const progress = Math.round((book.current_page / book.total_pages) * 100) || 0;
              let nextPage = book.current_page + 1;
              return (
                <BookReadingCard key={book.id} book={book} progress={progress} nextPage={nextPage} onSave={registerReading} />
              );
            })}
          </div>
        )}
      </div>

      <div className="spacer" />

      <div className="grid">
        <div className="card">
          <h2>Conquistas</h2>
          <div className="history-item">⭐ Primeira página lida: {totalPaginas >= 1 ? 'desbloqueada' : 'pendente'}</div>
          <div className="history-item">📘 10 páginas lidas: {totalPaginas >= 10 ? 'desbloqueada' : 'pendente'}</div>
          <div className="history-item">🏆 Primeiro livro concluído: {livrosConcluidos >= 1 ? 'desbloqueada' : 'pendente'}</div>
        </div>

        <div className="card">
          <h2>Histórico recente</h2>
          {logs.length === 0 && minutes.length === 0 ? (
            <p className="muted">Nenhuma movimentação ainda.</p>
          ) : (
            <>
              {logs.slice(0, 5).map((log) => (
                <div className="history-item" key={log.id}>
                  <strong>📖 Leitura registrada</strong>
                  <div className="muted">{new Date(log.created_at).toLocaleString('pt-BR')}</div>
                  <div>Páginas: {log.previous_page} → {log.current_page}</div>
                  <div>Minutos ganhos: +{log.minutes_earned}</div>
                </div>
              ))}
              {minutes.slice(0, 5).map((item) => (
                <div className="history-item" key={item.id}>
                  <strong>{item.kind === 'usage' ? '🎮 Uso de minutos' : item.kind === 'bonus' ? '🎁 Bônus' : '⏱️ Movimentação'}</strong>
                  <div className="muted">{new Date(item.created_at).toLocaleString('pt-BR')}</div>
                  <div>{item.note ?? 'Sem observação'}</div>
                  <div>Variação: {item.minutes_delta > 0 ? '+' : ''}{item.minutes_delta} min</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BookReadingCard({ book, progress, nextPage, onSave }: { book: Book; progress: number; nextPage: number; onSave: (book: Book, currentPage: number) => Promise<void>; }) {
  const [value, setValue] = useState(String(nextPage));

  useEffect(() => {
    setValue(String(nextPage));
  }, [nextPage]);

  return (
    <div className="book-card">
      <h3>{book.title}</h3>
      <p className="muted"><strong>Autor:</strong> {book.author ?? '-'}</p>
      <p className="muted"><strong>Categoria:</strong> {book.category ?? '-'}</p>
      <p className="muted"><strong>Página atual:</strong> {book.current_page} / {book.total_pages}</p>
      <div className="progress"><span style={{ width: `${progress}%` }} /></div>
      <p className="muted">Progresso: {progress}%</p>
      <span className="badge">{book.status === 'concluido' ? 'Concluído' : book.status === 'em_andamento' ? 'Em andamento' : 'Não iniciado'}</span>
      <div className="spacer" />
      <label className="label">Nova página</label>
      <input className="input" type="number" value={value} onChange={(e) => setValue(e.target.value)} />
      <button className="btn btn-primary btn-block" onClick={() => onSave(book, Number(value))}>Registrar leitura</button>
    </div>
  );
}
