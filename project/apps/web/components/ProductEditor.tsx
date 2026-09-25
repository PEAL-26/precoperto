'use client';

import { useState } from 'react';
import type { Category, Product } from '@precoperto/types';
import { getProductAssetPath } from '@precoperto/utils';
import { uploadAsset } from '@precoperto/supabase';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { apiRequest } from '@/lib/api';

export function ProductEditor({
  storeCuid,
  categories,
  product,
  onSaved,
  onCancel,
}: {
  storeCuid: string;
  categories: Category[];
  product?: Product;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [type, setType] = useState<'product' | 'service'>(product?.type ?? 'product');
  const [categoryCuid, setCategoryCuid] = useState(
    product?.category_cuid ?? categories[0]?.cuid ?? '',
  );
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [status, setStatus] = useState<'active' | 'inactive' | 'archived'>(
    product?.status ?? 'active',
  );
  const [cover, setCover] = useState(product?.cover ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const body = {
        storeCuid,
        name,
        type,
        category_cuid: categoryCuid,
        price: Number(price),
        currency: 'AOA',
        description: description || null,
        cover: cover || null,
        status,
      };
      const response = await fetch(product ? `/api/products/${product.cuid}` : '/api/products', {
        method: product ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { message?: string; data?: Product };
      if (!response.ok) throw new Error(payload.message ?? 'Não foi possível guardar o produto.');
      const savedProduct = payload.data;
      if (file && savedProduct) {
        const client = createSupabaseBrowserClient();
        const path = getProductAssetPath(storeCuid, savedProduct.cuid, file.name);
        const upload = await uploadAsset(client, 'product-assets', path, file, file.type);
        if (upload.error) throw new Error(upload.error.message);
        await apiRequest(`/api/products/${savedProduct.cuid}`, {
          method: 'PATCH',
          body: JSON.stringify({ cover: path }),
        });
      }
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Não foi possível guardar o produto.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={save}>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="field">
        <label htmlFor="product-name">Nome</label>
        <input
          id="product-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="product-type">Tipo</label>
          <select
            id="product-type"
            value={type}
            onChange={(event) => setType(event.target.value as 'product' | 'service')}
          >
            <option value="product">Produto</option>
            <option value="service">Serviço</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="product-category">Categoria</label>
          <select
            id="product-category"
            value={categoryCuid}
            onChange={(event) => setCategoryCuid(event.target.value)}
            required
          >
            <option value="">Seleccionar</option>
            {categories.map((category) => (
              <option key={category.cuid} value={category.cuid}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="product-price">Preço (AOA)</label>
        <input
          id="product-price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="product-description">Descrição</label>
        <textarea
          id="product-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="product-status">Estado</label>
        <select
          id="product-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
        >
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="archived">Arquivado</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="product-cover">Imagem (opcional)</label>
        <input
          id="product-cover"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <span className="field-hint">JPG, PNG ou WebP, até 5 MB.</span>
      </div>
      <div className="form-actions">
        <button className="button button-secondary" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? 'A guardar…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
