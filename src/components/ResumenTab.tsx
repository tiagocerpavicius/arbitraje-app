'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { Caucion, Cedear } from '@/lib/types';
import { calcInteresTotal, calcPnL, calcPnLPct, calcValorActual, calcValorInvertido, fmtUSD, fmtPct, fmtNum } from '@/lib/calculations';

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
  const totalInvertido = cedears.reduce((a, c) => a + calcValorInvertido(c.precioCompra, c.cantidad), 0);
  const totalActual = cedears.reduce((a, c) => a + calcValorActual(c.precioActual, c.cantidad), 0);
  const totalPnL = totalActual - totalInvertido;
  const totalPnLPct = totalInvertido > 0 ? (totalPnL / totalInvertido) * 100 : 0;
  const totalCostoCauciones = cauciones.reduce((a, c) => a + calcInteresTotal(c.monto, c.tna, c.plazo, c.renovaciones), 0);
  const rendimientoNeto = totalPnL - totalCostoCauciones;
  const rendimientoNetoPct = totalInvertido > 0 ? (rendimientoNeto / totalInvertido) * 100 : 0;

  const pnlData = cedears.map((c) => ({
    name: c.ticker,
    pnl: parseFloat(calcPnL(c.precioCompra, c.precioActual, c.cantidad).toFixed(2)),
  }));

  const pctData = cedears.map((c) => ({
    name: c.ticker,
    pct: parseFloat(calcPnLPct(c.precioCompra, c.precioActual).toFixed(2)),
  }));

  const avgCostoPct = cauciones.length > 0
    ? cauciones.reduce((a, c) => a + (c.tna / 100) * (c.plazo / 365) * 100, 0) / cauciones.length
    : 0;

  const card = (label: string, value: string, sub: string, color: string) => (
    <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
      <div style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted2)', marginBottom: '8px' }}>{label}</div>
      <div className="font-mono-data" style={{ fontSize: '22px', fontWeight: 500, color, marginBottom: '4px' }}>{value}</div>
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
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px' }}>
        {card('Capital invertido', fmtUSD(totalInvertido), `${cedears.length} posiciones`, 'var(--text)')}
        {card('Valor actual CEDEARs', fmtUSD(totalActual), `vs ${fmtUSD(totalInvertido)} invertido`, 'var(--amber)')}
        {card('P&L CEDEARs', fmtUSD(totalPnL), fmtPct(totalPnLPct), totalPnL >= 0 ? 'var(--green)' : 'var(--red)')}
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

      {cedears.length > 0 && (
        <>
          {chartBox('P&L por CEDEAR (USD)', 'Ganancia o pérdida en dólares por posición.',
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pnlData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                {grid}{xAxis}
                <YAxis tick={{ fill: '#6b6b9a', fontSize: 11, fontFamily: 'DM Mono, monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} domain={['auto', 'auto']} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                  {pnlData.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#f43f5e'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartBox('Rendimiento % por CEDEAR vs costo caución', 'Línea roja = costo promedio de tus cauciones activas. Barras sobre la línea = rendimiento positivo neto.',
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pctData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                {grid}{xAxis}
                <YAxis tick={{ fill: '#6b6b9a', fontSize: 11, fontFamily: 'DM Mono, monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={['auto', 'auto']} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                {avgCostoPct > 0 && <ReferenceLine y={avgCostoPct} stroke="#f43f5e" strokeDasharray="5 3" label={{ value: `Costo cauciones ${fmtNum(avgCostoPct)}%`, fill: '#f43f5e', fontSize: 10, position: 'insideTopRight' }} />}
                <Bar dataKey="pct" name="Rend." radius={[4, 4, 0, 0]} unit="%">
                  {pctData.map((e, i) => <Cell key={i} fill={e.pct >= avgCostoPct ? '#10b981' : '#f43f5e'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}
