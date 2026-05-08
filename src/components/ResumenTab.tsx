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
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '11px', color: 'var(--muted2)', marginBottom: '16px' }}>{sub}</div>
      {children}
    </div>
  );

  const xAxis = <XAxis dataKey="name" tick={{ fill: '#6b6b9a', fontSize: 11, fontFamily: 'DM Mono, monospace' }} axisLine={false} tickLine={false} />;
  const yAxis = (fmt?: (v: number) => string) => <YAxis tick={{ fill: '#6b6b9a', fontSize: 11, fontFamily: 'DM Mono, monospace' }} axisLine={false} tickLine={false} tickFormatter={fmt} domain={['auto', 'auto']} />;
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {card('Total en Cauciones', fmtARS(totalCauciones), `Interés: ${fmtARS(totalInteres)}`, 'var(--amber)')}
        {card('Total CEDEARs (D)', fmtUSD(totalUSD), `${cedears.length} posiciones`, 'var(--amber)')}
        {card('Spread Prom. vs CCL', cedears.length > 0 ? fmtPct(avgSpread) : '—', `CCL ref: ${fmtNum(config.ccl, 0)}`, avgSpread >= 0 ? 'var(--green)' : 'var(--red)')}
        {card('Dólar MEP ref.', fmtNum(config.mep, 0), `CCL: ${fmtNum(config.ccl, 0)}`, 'var(--text)')}
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
          {chartBox('TC Implícito por CEDEAR vs CCL', 'Verde = TC implícito menor al CCL → el CEDEAR está barato en pesos → oportunidad de comprar en $ y vender en D.',
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tcData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                {grid}{xAxis}{yAxis()}
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <ReferenceLine y={config.ccl} stroke="#f43f5e" strokeDasharray="5 3" label={{ value: `CCL ${fmtNum(config.ccl, 0)}`, fill: '#f43f5e', fontSize: 10, fontFamily: 'DM Mono, monospace', position: 'insideTopRight' }} />
                <Bar dataKey="tc" name="TC Impl." radius={[4, 4, 0, 0]}>
                  {tcData.map((e, i) => <Cell key={i} fill={e.tc < config.ccl ? '#10b981' : '#f59e0b'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {chartBox('Spread vs CCL por CEDEAR (%)', 'Spread positivo (verde) = comprás dólares más barato que el CCL.',
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={spreadData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                {grid}{xAxis}{yAxis((v) => `${v}%`)}
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                <Bar dataKey="spread" name="Spread" radius={[4, 4, 0, 0]} unit="%">
                  {spreadData.map((e, i) => <Cell key={i} fill={e.spread >= 0 ? '#10b981' : '#f43f5e'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {arbData.length > 0 && chartBox('Arbitraje Neto (%)', 'Spread del CEDEAR menos costo de la caución vinculada.',
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={arbData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                {grid}{xAxis}{yAxis((v) => `${v}%`)}
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                <Bar dataKey="spread" name="Spread CEDEAR" fill="#8b5cf6" radius={[4, 4, 0, 0]} unit="%" />
                <Bar dataKey="costo" name="Costo caución" fill="#f43f5e" radius={[4, 4, 0, 0]} unit="%" />
                <Bar dataKey="neto" name="Neto" radius={[4, 4, 0, 0]} unit="%">
                  {arbData.map((e, i) => <Cell key={i} fill={e.neto >= 0 ? '#10b981' : '#f43f5e'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}
