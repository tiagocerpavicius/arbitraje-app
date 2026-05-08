export function calcVencimiento(fechaInicio: string, plazo: number): string {
  const d = new Date(fechaInicio + 'T00:00:00');
  d.setDate(d.getDate() + plazo);
  return d.toISOString().split('T')[0];
}

export function calcDiasRestantes(fechaInicio: string, plazo: number): number {
  const venc = new Date(fechaInicio + 'T00:00:00');
  venc.setDate(venc.getDate() + plazo);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.ceil((venc.getTime() - hoy.getTime()) / 86400000);
}

export function calcInteres(monto: number, tna: number, plazo: number): number {
  return monto * (tna / 100) * (plazo / 365);
}

export function calcTCImplicito(precioARS: number, precioUSD: number): number {
  return precioUSD > 0 ? precioARS / precioUSD : 0;
}

export function calcSpread(tcImpl: number, ccl: number): number {
  return tcImpl > 0 ? ((ccl / tcImpl) - 1) * 100 : 0;
}

export function calcCostoCaucionPct(tna: number, plazo: number): number {
  return (tna / 100) * (plazo / 365) * 100;
}

export function calcArbitrajeNeto(spread: number, costo: number): number {
  return spread - costo;
}

export const fmtARS = (n: number): string =>
  '$ ' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n);

export const fmtUSD = (n: number, dec = 2): string =>
  'U$S ' + new Intl.NumberFormat('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

export const fmtPct = (n: number): string =>
  (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

export const fmtNum = (n: number, dec = 2): string =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
