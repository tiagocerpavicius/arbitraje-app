'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import { Caucion, Cedear } from '@/lib/types';
import {
  calcInteresTotal, calcPnL, calcPnLPct,
  calcValorActual, calcValorInvertido,
  fmtUSD, fmtPct,
} from '@/lib/calculations';

interface Props { cauciones: Caucion[]; cedears: Cedear[]; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '8px', padding: '10px 14px', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>
      <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '6px' }}>{label}</div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.fill ?? p.color, marginBottom: '2px' }}>
          {p.name}: {typeof p.value === 'number' && p.value >= 0 ? '+' : ''}U$S {p.value}
        </div>
      ))}
    </div>
  );
};

export default function ResumenTab({ cauciones, cedears }: Props) {
  const abiertas = cedears.filter((c) => !c.precioVenta);
  const cerradas = cedears.filter((c) => c.precioVenta !== undefined);

  const totalInvertido = abiertas.reduce((a, c) => a + calcValorInvertido(c.precioCompra, c.cantidad), 0);
  const totalActual = abiertas.reduce((a, c) => a + calcValorActual(c.precioActual, c.cantidad), 0);
  const pnlNoRealizado = totalActual - totalInvertido;
  const pnlRealizado = cerradas.reduce((a, c) => a + calcPnL(c.precioCompra, c.precioVenta!, c.cantidad), 0);
  const pnlTotal = pnlNoRealizado + pnlRealizado;
  const totalCostoCauciones = cauciones.reduce((a, c) => a + calcInteresTotal(c.monto, c.tna, c.plazo, c.renovaciones), 0);
  const rendimientoNeto = pnlTotal - totalCostoCauciones;
  const rendimientoNetoPct = totalInvertido > 0 ? (rendimientoNeto / totalInvertido) * 100 : 0;

  // Gráfico 1: P&L individual por CEDEAR (solo abiertas)
  const pnlData = abiertas.map((c) => ({
    name: c.ticker,
    valor: parseFloat(calcPnL(c.precioCompra, c.precioActual, c.cantidad).toFixed(2)),
    pct: parseFloat(calcPnLPct(c.precioCompra, c.precioActual).toFixed(2)),
  }));

  // Gráfico 2: Comparación cartera total
  const totalData = [
    { name: 'P&L CEDEARs', valor: parseFloat(pnlTotal.toFixed(2)), color: pnlTotal >= 0 ? '#10b981' : '#f43f5e' },
    { name: 'Costo cauciones', valor: parseFloat((-totalCostoCauciones).toFixed(2)), color: '#f43f5e' },
    { name: 'Rend. neto', valor: parseFloat(rendimientoNeto.toFixed(2)), color: rendimientoNeto >= 0 ? '#10b981' : '#f43f5e' },
  ];

  const card = (label: string, value: string, sub: string, color: string) => (
    <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
      <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted2)', marginBottom: '8px' }}>{label}</div>
      <div className="font-mono-data" style={{ fontSize: '20px', fontWeight: 500, color, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{sub}</div>
    </div>
  );

  const chartBox = (title: string, sub: string, children: React.ReactNode) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '11px', color: 'var(--muted2)', marginBottom: '16px' }}>{sub}</div>
      {children}
    </div>
  );

  const xAxis = <XAxis dataKey="name" tick={{ fill: '#6b6b9a', fontSize: 11, fontFamily: 'DM Mono, monospace' }} axisLine={false} tickLine={false} />;
  const yAxis = <YAxis tick={{ fill: '#6b6b9a', fontSize: 11, fontFamily: 'DM Mono, monospace' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />;
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />;
  const cursor = { fill: 'rgba(255,255,255,0.04)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {card('P&L no realizado', fmtUSD(pnlNoRealizado), `${abiertas.length} posiciones abiertas`, pnlNoRealizado >= 0 ? 'var(--green)' : 'var(--red)')}
        {card('P&L realizado', fmtUSD(pnlRealizado), `${cerradas.length} posiciones cerradas`, pnlRealizado >= 0 ? 'var(--green)' : 'var(--red)')}
        {card('P&L total', fmtUSD(pnlTotal), fmtPct(totalInvertido > 0 ? (pnlTotal / totalInvertido) * 100 : 0), pnlTotal >= 0 ? 'var(--green)' : 'var(--red)')}
        {card('Costo cauciones', fmtUSD(totalCostoCauciones), `${cauciones.length} cauciones activas`, 'var(--red)')}
        {card('Rendimiento neto', fmtUSD(rendimientoNeto), fmtPct(rendimientoNetoPct), rendimientoNeto >= 0 ? 'var(--green)' : 'var(--red)')}
      </div>

      {cedears.length === 0 && cauciones.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: 800, color: 'var(--border2)', marginBottom: '16px', letterSpacing: '0.1em' }}>ARB/TC</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '6px' }}>Todo listo para empezar.</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Cargá cauciones y CEDEARs en las pestañas de arriba.</div>
        </div>
      )}

      {abiertas.length > 0 && (
        <>
          {/* Gráfico 1: P&L individual */}
          {chartBox(
            'P&L por CEDEAR (USD)',
            'Ganancia o pérdida de cada posición abierta en dólares, independientemente del costo de financiamiento.',
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pnlData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                {grid}{xAxis}{yAxis}
                <Tooltip content={<DarkTooltip />} cursor={cursor} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                <Bar dataKey="valor" name="P&L" radius={[4, 4, 0, 0]}>
                  {pnlData.map((e, i) => <Cell key={i} fill={e.valor >= 0 ? '#10b981' : '#f43f5e'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Gráfico 2: Comparación total cartera */}
          {chartBox(
            'Resultado total de la estrategia (USD)',
            'P&L total de CEDEARs vs costo total de cauciones. La barra "Rend. neto" es lo que efectivamente ganás.',
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={totalData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                {grid}{xAxis}{yAxis}
                <Tooltip content={<DarkTooltip />} cursor={cursor} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                <Bar dataKey="valor" name="USD" radius={[4, 4, 0, 0]}>
                  {totalData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}
