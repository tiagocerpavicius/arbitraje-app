'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { Caucion, Cedear, AppConfig } from '@/lib/types';
import { calcTCImplicito, calcSpread, calcCostoCaucionPct, calcArbitrajeNeto, calcInteres, fmtARS, fmtUSD, fmtPct, fmtNum } from '@/lib/calculations';

interface Props { cauciones: Caucion[]; cedears: Cedear[]; config: AppConfig; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '8px', padding: '10px 14px', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>
      <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '6px' }}>{label}</div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.fill ?? p.color, marginBottom: '2px' }}>
          {p.name}: {typeof p.value === 'number' && p.value >= 0 ? '+' : ''}{p.value}{p.unit ?? ''}
        </div>
      ))}
    </div>
  );
};

export default function ResumenTab({ cauciones, cedears, config }: Props) {
  const totalCauciones = cauciones.reduce((a, c) => a + c.monto, 0);
  const totalInteres = cauciones.reduce((a, c) => a + calcInteres(c.monto, c.tna, c.plazo), 0);
  const totalUSD = cedears.reduce((a, c) => a + c.cantidad * c.precioUSD, 0);
  const avgSpread = cedears.length > 0 ? cedears.reduce((a, c) => a + calcSpread(calcTCImplicito(c.precioARS, c.precioUSD), config.ccl), 0) / cedears.length : 0;

  const tcData = cedears.map((c) => ({ name: c.ticker, tc: Math.round(calcTCImplicito(c.precioARS, c.precioUSD)) }));
  const spreadData = cedears.map((c) => ({ name: c.ticker, spread: parseFloat(calcSpread(calcTCImplicito(c.precioARS, c.precioUSD), config.ccl).toFixed(2)) }));
  const arbData = cedears.filter((c) => c.caucionId).map((c) => {
    const caucion = cauciones.find((x) => x.id === c.caucionId);
    if (!caucion) return null;
    const spread = calcSpread(calcTCImplicito(c.precioARS, c.precioUSD), config.ccl);
    const costo = calcCostoCaucionPct(caucion.tna, caucion.plazo);
    return { name: c.ticker, spread: parseFloat(spread.toFixed(2)), costo: parseFloat((-costo).toFixed(2)), neto: parseFloat(calcArbitrajeNeto(spread, costo).toFixed(2)) };
  }).filter(Boolean) as { name: string; spread: number; costo: number; neto: number }[];

  const card = (label: string, value: string, sub: string, valueColor: string) => (
    <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
      <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted2)', marginBottom: '8px' }}>{label}</div>
      <div className="font-mono-data" style={{ fontSize: '22px', fontWeight: 500, color: valueColor, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{sub}</div>
    </div>
  );

  const chartBox = (title: string, sub: string, children: React.ReactNode) => (
    <div style={{ background: 'var(--s
