import type { ProductStatus, SearchCursor } from '@precoperto/types';

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string, locale = 'pt-AO') {
  const key = `${locale}:${currency}`;
  const existing = currencyFormatters.get(key);
  if (existing) return existing;
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  });
  currencyFormatters.set(key, formatter);
  return formatter;
}

export function formatCurrency(value: number, currency = 'AOA', locale = 'pt-AO') {
  return getCurrencyFormatter(currency, locale).format(value);
}

export function formatDistance(distanceMeters: number | null | undefined) {
  if (distanceMeters === null || distanceMeters === undefined || !Number.isFinite(distanceMeters)) {
    return null;
  }
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1000).toFixed(1).replace('.', ',')} km`;
}

export function formatDateTime(value: string | Date, locale = 'pt-AO') {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

const dayNames = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export function formatDayOfWeek(dayOfWeek: number, short = false) {
  const name = dayNames[dayOfWeek] ?? 'Dia inválido';
  if (!short) return name;
  return name.slice(0, 3);
}

export function formatTime(value: string | null | undefined) {
  if (!value) return '—';
  const [hours, minutes] = value.split(':');
  return `${hours}:${minutes}`;
}

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-AO');
}

export function isValidCuid(value: string) {
  return /^c[0-9a-z]{23,}$/.test(value);
}

export function isValidCoordinate(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function encodeSearchCursor(cursor: SearchCursor) {
  return [cursor.relevanceRank, cursor.distanceMeters ?? '', cursor.cuid]
    .map((part) => encodeURIComponent(String(part)))
    .join(':');
}

export function decodeSearchCursor(value: string | null | undefined): SearchCursor | null {
  if (!value) return null;
  try {
    const [rank, distance, cuid] = value.split(':');
    if (!rank || !cuid) return null;
    const relevanceRank = Number(decodeURIComponent(rank));
    const distanceMeters = distance ? Number(decodeURIComponent(distance)) : null;
    if (!Number.isInteger(relevanceRank) || !isValidCuid(cuid)) return null;
    if (distance !== '' && (!Number.isFinite(distanceMeters) || distanceMeters === null))
      return null;
    return { relevanceRank, distanceMeters, cuid };
  } catch {
    return null;
  }
}

export function getProductStatusLabel(status: ProductStatus) {
  return {
    active: 'Activo',
    inactive: 'Inactivo',
    archived: 'Arquivado',
  }[status];
}

export function getProductTypeLabel(type: 'product' | 'service') {
  return type === 'service' ? 'Serviço' : 'Produto';
}

export function getInitials(name: string) {
  return normalizeSearchText(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('pt-PT') ?? '')
    .join('');
}

export function clampPageSize(value: number, fallback = 24) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(50, Math.max(1, Math.floor(value)));
}

export function getStoreAssetPath(storeCuid: string, kind: 'avatar' | 'cover', fileName: string) {
  return `store-assets/${storeCuid}/${kind}/${fileName}`;
}

export function getProductAssetPath(storeCuid: string, productCuid: string, fileName: string) {
  return `product-assets/${storeCuid}/${productCuid}/${fileName}`;
}
