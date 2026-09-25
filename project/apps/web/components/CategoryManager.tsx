'use client';

import { useState } from 'react';
import type { Category } from '@precoperto/types';
import { Modal } from '@/components/Modal';

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function open(category?: Category) {
    setEditing(
      category ?? { cuid: '', name: '', description: null, created_at: '', updated_at: '' },
    );
    setName(category?.name ?? '');
    setDescription(category?.description ?? '');
    setError(null);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        editing.cuid ? `/api/categories/${editing.cuid}` : '/api/categories',
        {
          method: editing.cuid ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description: description || null }),
        },
      );
      const payload = (await response.json()) as { message?: string; data?: Category };
      if (!response.ok) throw new Error(payload.message ?? 'Não foi possível guardar.');
      if (payload.data)
        setCategories((current) =>
          editing.cuid
            ? current.map((item) =>
                item.cuid === editing.cuid ? (payload.data as Category) : item,
              )
            : [...current, payload.data as Category].sort((a, b) => a.name.localeCompare(b.name)),
        );
      setEditing(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível guardar.');
    } finally {
      setPending(false);
    }
  }

  async function remove(category: Category) {
    if (!window.confirm(`Eliminar a categoria “${category.name}”?`)) return;
    setError(null);
    const response = await fetch(`/api/categories/${category.cuid}`, { method: 'DELETE' });
    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(payload.message ?? 'Não foi possível eliminar.');
      return;
    }
    setCategories((current) => current.filter((item) => item.cuid !== category.cuid));
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Categorias</h2>
          <p>Categorias globais da plataforma</p>
        </div>
        <button className="button button-primary button-small" type="button" onClick={() => open()}>
          Nova categoria
        </button>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.cuid}>
                <td>
                  <strong>{category.name}</strong>
                </td>
                <td>{category.description || '—'}</td>
                <td>
                  <div className="product-actions">
                    <button
                      className="button button-secondary button-small"
                      type="button"
                      onClick={() => open(category)}
                    >
                      Editar
                    </button>
                    <button
                      className="button button-danger button-small"
                      type="button"
                      onClick={() => void remove(category)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing ? (
        <Modal
          title={editing.cuid ? 'Editar categoria' : 'Nova categoria'}
          onClose={() => setEditing(null)}
        >
          <form className="form-stack" onSubmit={save}>
            {error ? <p className="form-error">{error}</p> : null}
            <div className="field">
              <label htmlFor="category-name">Nome</label>
              <input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="category-description">Descrição</label>
              <textarea
                id="category-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="form-actions">
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
              <button className="button button-primary" type="submit" disabled={pending}>
                {pending ? 'A guardar…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
