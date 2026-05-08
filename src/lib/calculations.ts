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

export function calcInteresPeriodo(monto: number, tna: number, plazo: number): number {
  return monto * (tna / 100) * (plazo / 365);
}

export function calcInteresTotal(monto: number, tna: number, plazo: number, renovaciones: number): number {
  return calcInteresPeriodo(monto, tna, plazo) * (renovaciones + 1);
}

export function calcPnL(precioCompra: number, precioActual: number, cantidad: number): number {
  return (precioActual - precioCompra) * cantidad;
}

export function calcPnLPct(precioCompra: number, precioActual: number): number {
  return precioCompra > 0 ? ((precioActual - precioCompra) / precioCompra) * 100 : 0;
}

export function calcValorActual(precioActual: number, cantidad: number): number {
  return precioActual * cantidad;
}

export function calcValorInvertido(precioCompra: number, cantidad: number): number {
  return precioCompra * cantidad;
}

export const fmtUSD = (n: number, dec = 2): string =>
  'U$S ' + new Intl.NumberFormat('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

export const fmtPct = (n: number): string =>
  (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

export const fmtNum = (n: number, dec = 2): string =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
