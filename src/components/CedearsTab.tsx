'use client';
import { useState } from 'react';
import { Trash2, Pencil, Check, X, TrendingDown } from 'lucide-react';
import { Cedear } from '@/lib/types';
import { calcPnL, calcPnLPct, calcValorActual, calcValorInvertido, fmtUSD, fmtPct, fmtNum } from '@/lib/calculations';

interface Props {
  cedears: Cedear[];
  addCedear: (data: Omit<Cedear, 'id'>) => void;
  updateCedear: (id: string, data: Partial<Omit<Cedear, 'id'>>) => void;
  deleteCedear: (id: string) => void;
}

const EMPTY = { ticker: '', cantidad: '', precioCompra: '', precioActual: '' };

const lbl = (text: string) => (
  <label style={{ display: 'block', fontSize: '10px', color: 'var(--muted2)', marginBottom: '5px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{text}</label>
);

const th = (text: string, align: 'left' | 'right' = 'right') => (
  <th key={text} style={{ padding: '10px 14px', textAlign: align, fontSize: '10px', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', color: 'var(--muted2)', textTransform: 'uppercase', whiteSpace: 'nowrap' as const }}>{text}</th>
);

const secTitle = (text: string) => (
  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--muted2)', textTransform: 'uppercase', marginBottom: '12px' }}>{text}</div>
);

export default function CedearsTab({ cedears, addCedear, updateCedear, deleteCedear }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [editPrecio, setEditPrecio] = useState('');
  const [selling, setSelling] = useState<string | null>(null);
  const [sellData, setSellData] = useState({ precio: '', fecha: new Date().toISOString().split('T')[0] });

  const set = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ticker || !form.cantidad || !form.precioCompra || !form.precioActual) return;
    addCedear({ ticker: form.ticker.toUpperCase(), cantidad: Number(form.cantidad), precioCompra: Number(form.precioCompra), precioActual: Number(form.precioActual) });
    setForm(EMPTY);
  };

  const startEdit = (c: Cedear) => { setEditing(c.id); setEditPrecio(String(c.precioActual)); setSelling(null); };
  const confirmEdit = (id: string) => { updateCedear(id, { precioActual: Number(editPrecio) }); setEditing(null); };
  const startSell = (c: Cedear) => { setSelling(c.id); setSellData({ precio: String(c.precioActual), fecha: new Date().toISOString().split('T')[0] }); setEditing(null); };
  const confirmSell = (id: string) => { if (!sellData.precio) return; updateCedear(id, { precioVenta: Number(sellData.precio), fechaVenta: sellData.fecha }); setSelling(null); };

  const abiertas = cedears.filter((c) => !c.precioVenta);
  const cerradas = cedears.filter((c) => c.precioVenta !== undefined);

  const totalInvertido = abiertas.reduce((a, c) => a + calcValorInvertido(c.precioCompra, c.cantidad), 0);
  const totalActual = abiertas.reduce((a, c) => a + calcValorActual(c.precioActual, c.cantidad), 0);
  const pnlAbierto = totalActual - totalInvertido;
  const pnlCerrado = cerradas.reduce((a, c) => a + calcPnL(c.precioCompra, c.precioVenta!, c.cantidad), 0);

  const editInput = (val: string, onChange: (v: string) => void, w = '90px') => (
    <input type="number" step="0.0001" value={val} onChange={(e) => onChange(e.target.value)}
      style={{ width: w, background: 'var(--surface2)', border: '1px solid var(--violet)', borderRadius: '4px', padding: '3px 6px', color: 'var(--text)', fontFamily: 'DM Mono, monospace', fontSize: '13px', textAlign: 'right' }} />
  );

  const iconBtn = (onClick: () => void, icon: React.ReactNode, hoverColor: string) => (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '3px', display: 'flex', alignItems: 'center' }}
      onMouseOver={(e) => (e.currentTarget.style.color = hoverColor)}
      onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted)')}>
      {icon}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Formulario */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--muted2)', textTransform: 'uppercase', marginBottom: '16px' }}>Nueva Posición CEDEAR</div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div>{lbl('Ticker')}<input className="input-dark font-mono-data" type="text" placeholder="AAPL" value={form.ticker} onChange={(e) => set('ticker', e.target.value.toUpperCase())} required /></div>
            <div>{lbl('Cantidad')}<input className="input-dark font-mono-data" type="number" step="0.01" placeholder="100" value={form.cantidad} onChange={(e) => set('cantidad', e.target.value)} required /></div>
            <div>{lbl('Precio compra (USD)')}<input className="input-dark font-mono-data" type="number" step="0.0001" placeholder="18.50" value={form.precioCompra} onChange={(e) => set('precioCompra', e.target.value)} required /></div>
            <div>{lbl('Precio actual (USD)')}<input className="input-dark font-mono-data" type="number" step="0.0001" placeholder="19.20" value={form.precioActual} onChange={(e) => set('precioActual', e.target.value)} required /></div>
          </div>
          <button type="submit" style={{ width: '100%', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
            + Agregar CEDEAR
          </button>
        </form>
      </div>

      {/* Cards */}
      {cedears.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Invertido (abiertas)', value: fmtUSD(totalInvertido), color: 'var(--text)' },
            { label: 'Valor actual', value: fmtUSD(totalActual), color: 'var(--amber)' },
            { label: 'P&L no realizado', value: fmtUSD(pnlAbierto), color: pnlAbierto >= 0 ? 'var(--green)' : 'var(--red)' },
            { label: 'P&L realizado', value: fmtUSD(pnlCerrado), color: pnlCerrado >= 0 ? 'var(--green)' : 'var(--red)' },
          ].map((c) => (
            <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted2)', marginBottom: '6px' }}>{c.label}</div>
              <div className="font-mono-data" style={{ fontSize: '18px', fontWeight: 500, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Posiciones abiertas */}
      {abiertas.length > 0 && (
        <div>
          {secTitle('Posiciones abiertas')}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {th('Ticker', 'left')}{th('Cant.')}{th('P. compra')}{th('P. actual')}{th('Invertido')}{th('Valor actual')}{th('P&L USD')}{th('P&L %')}{th('')}
                </tr>
              </thead>
              <tbody>
                {abiertas.map((c) => {
                  const pnl = calcPnL(c.precioCompra, c.precioActual, c.cantidad);
                  const pnlPct = calcPnLPct(c.precioCompra, c.precioActual);
                  const isEditing = editing === c.id;
                  const isSelling = selling === c.id;
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="font-mono-data" style={{ fontWeight: 700, color: 'var(--violet)', fontSize: '14px' }}>{c.ticker}</span>
                      </td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{fmtNum(c.cantidad, 0)}</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{fmtUSD(c.precioCompra, 4)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        {isEditing
                          ? editInput(editPrecio, setEditPrecio)
                          : <span className="font-mono-data" style={{ color: 'var(--text)' }}>{fmtUSD(c.precioActual, 4)}</span>}
                      </td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{fmtUSD(calcValorInvertido(c.precioCompra, c.cantidad))}</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--amber)' }}>{fmtUSD(calcValorActual(c.precioActual, c.cantidad))}</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{fmtUSD(pnl)}</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: pnlPct >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{fmtPct(pnlPct)}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {isSelling ? (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {editInput(sellData.precio, (v) => setSellData((p) => ({ ...p, precio: v })))}
                            <input type="date" value={sellData.fecha} onChange={(e) => setSellData((p) => ({ ...p, fecha: e.target.value }))}
                              style={{ background: 'var(--surface2)', border: '1px solid var(--violet)', borderRadius: '4px', padding: '3px 6px', color: 'var(--text)', fontFamily: 'DM Mono, monospace', fontSize: '12px' }} />
                            <button onClick={() => confirmSell(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)', padding: '3px', display: 'flex', alignItems: 'center' }}><Check size={14} /></button>
                            <button onClick={() => setSelling(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '3px', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
                          </div>
                        ) : isEditing ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => confirmEdit(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)', padding: '3px', display: 'flex', alignItems: 'center' }}><Check size={14} /></button>
                            <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '3px', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {iconBtn(() => startEdit(c), <Pencil size={14} />, 'var(--violet)')}
                            {iconBtn(() => startSell(c), <TrendingDown size={14} />, 'var(--amber)')}
                            {iconBtn(() => deleteCedear(c.id), <Trash2 size={14} />, 'var(--red)')}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Posiciones cerradas */}
      {cerradas.length > 0 && (
        <div>
          {secTitle('Posiciones cerradas')}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {th('Ticker', 'left')}{th('Cant.')}{th('P. compra')}{th('P. venta')}{th('P&L realizado')}{th('P&L %')}{th('Fecha venta')}{th('')}
                </tr>
              </thead>
              <tbody>
                {cerradas.map((c) => {
                  const pnl = calcPnL(c.precioCompra, c.precioVenta!, c.cantidad);
                  const pnlPct = calcPnLPct(c.precioCompra, c.precioVenta!);
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', opacity: 0.75 }}
                      onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseOut={(e) => (e.currentTarget.style.opacity = '0.75')}>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="font-mono-data" style={{ fontWeight: 700, color: 'var(--muted2)', fontSize: '14px' }}>{c.ticker}</span>
                      </td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{fmtNum(c.cantidad, 0)}</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{fmtUSD(c.precioCompra, 4)}</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text)' }}>{fmtUSD(c.precioVenta!, 4)}</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{fmtUSD(pnl)}</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: pnlPct >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{fmtPct(pnlPct)}</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted2)', fontSize: '12px' }}>{c.fechaVenta || '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        {iconBtn(() => deleteCedear(c.id), <Trash2 size={14} />, 'var(--red)')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cedears.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: '14px' }}>
          No hay CEDEARs registrados. Agregá uno arriba.
        </div>
      )}
    </div>
  );
}
