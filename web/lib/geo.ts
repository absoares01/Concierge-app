// Distâncias em linha reta (fórmula de haversine). Boa para comparar hotéis
// entre si; o trajeto real a pé costuma ser 20% a 40% maior.

export interface Ponto {
  lat: number;
  lon: number;
}

const RAIO_TERRA_M = 6371000;
const rad = (g: number) => (g * Math.PI) / 180;

export function distanciaM(a: Ponto, b: Ponto): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function textoDistancia(m: number): string {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace(".", ",")} km`;
}

// Estimativa a pé: 4,8 km/h sobre a linha reta acrescida de 30%.
export function minutosAPe(m: number): number {
  return Math.max(1, Math.round((m * 1.3) / 80));
}

export function coordenadaValida(lat: number | null | undefined, lon: number | null | undefined): boolean {
  return typeof lat === "number" && typeof lon === "number" && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0);
}

// Link oficial do Google Maps para um ponto (só um link, sem chave).
export function linkMapa(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lon.toFixed(6)}`;
}

// Coordenadas guardadas no item da viagem (cópia do resultado da busca).
export function coordenadasDoItem(dados: unknown): Ponto | null {
  if (!dados || typeof dados !== "object") return null;
  const d = dados as { lat?: unknown; lon?: unknown };
  const lat = typeof d.lat === "number" ? d.lat : null;
  const lon = typeof d.lon === "number" ? d.lon : null;
  return coordenadaValida(lat, lon) ? { lat: lat!, lon: lon! } : null;
}
