'use client';
import { useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { Cedear, Caucion, AppConfig } from '@/lib/types';
import { calcTCImplicito, calcSpread, fmtARS, fmtUSD, fmtPct, fmtNum } from '@/lib/calculations';

interface Props {
  cedears: Cedear[]; cauciones: Caucion[]; config: AppConfig;
  addCedear: (data: Omit<Cedear, 'id'>) => void;
  updateCedear: (id: string, data: Partial<Omit<Cedear, 'id'>>) => void;
  deleteCedear: (id: string) => void;
}

const EMPTY = { ticker: '', cantidad: '', precioARS: '', precioUSD: '', caucionId: '' };

const lbl = (text: string) => (
  <label style={{ display: 'block', fontSize: '10px', color: 'var(--muted2)', marginBottom: '5px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{text}</label>
);

export default function CedearsTab({ cedears, cauciones, config, addCedear, updateCedear, deleteCedear }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState({ precioARS: '', precioUSD: '' });

  const set = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ticker || !form.cantidad || !form.precioARS || !form.precioUSD) return;
    addCedear({ ticker: form.ticker.toUpperCase(), cantidad: Number(form.cantidad), precioARS: Number(form.precioARS), precioUSD: Number(form.precioUSD), caucionId: form.caucionId || undefined });
    setForm(EMPTY);
  };

  const startEdit = (c: Cedear) => { setEditing(c.id); setEditData({ precioARS: String(c.precioARS), precioUSD: String(c.precioUSD) }); };
  const confirmEdit = (id: string) => { updateCedear(id, { precioARS: Number(editData.precioARS), precioUSD: Number(editData.precioUSD) }); setEditing(null); };

  const totalUSD = cedears.reduce((a, c) => a + c.cantidad * c.precioUSD, 0);
  const avgSpread = cedears.length > 0 ? cedears.reduce((a, c) => a + calcSpread(calcTCImplicito(c.precioARS, c.precioUSD), config.ccl), 0) / cedears.length : 0;

  const td = (align: 'left' | 'right' = 'right') => ({ padding: '11px 14px', textAlign: align as 'left' | 'right', whiteSpace: 'nowrap' as const });
  const th = (text: string, align: 'left' | 'right' = 'right') => (
    <th key={text} style={{ padding: '10px 14px', textAlign: align, fontSize: '10px', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', color: 'var(--muted2)', textTransform: 'uppercase', whiteSpace: 'nowrap' as const }}>{text}</th>
  );

  const editInput = (val: string, onChange: (v: string) => void, w = '100px') => (
    <input type="number" step="0.01" value={val} onChange={(e) => onChange(e.target.value)}
      style={{ width: w, background: 'var(--surface2)', border: '1px solid var(--violet)', borderRadius: '4px', padding: '3px 6px', color: 'var(--text)', fontFamily: 'DM Mono, monospace', fontSize: '13px', textAlign: 'right' }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--muted2)', textTransform: 'uppercase', marginBottom: '16px' }}>Nueva Posición CEDEAR</div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div>{lbl('Ticker')}<input className="input-dark font-mono-data" type="text" placeholder="AAPL" value={form.ticker} onChange={(e) => set('ticker', e.target.value.toUpperCase())} required /></div>
            <div>{lbl('Cantidad')}<input className="input-dark font-mono-data" type="number" placeholder="100" value={form.cantidad} onChange={(e) => set('cantidad', e.target.value)} required /></div>
            <div>{lbl('Precio $ (ARS)')}<input className="input-dark font-mono-data" type="number" step="0.01" placeholder="14500" value={form.precioARS} onChange={(e) => set('precioARS', e.target.value)} required /></div>
            <div>{lbl('Precio D (USD)')}<input className="input-dark font-mono-data" type="number" step="0.01" placeholder="12.50" value={form.precioUSD} onChange={(e) => set('precioUSD', e.target.value)} required /></div>
            {cauciones.length > 0 && (
              <div>{lbl('Caución vinculada')}
                <select className="input-dark" value={form.caucionId} onChange={(e) => set('caucionId', e.target.value)}>
                  <option value="">Sin vincular</option>
                  {cauciones.map((c) => <option key={c.id} value={c.id}>{c.descripcion || `$ ${c.monto.toLocaleString()}`}</option>)}
                </select>
              </div>
            )}
          </div>
          <button type="submit" style={{ width: '100%', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>+ Agregar CEDEAR</button>
        </form>
      </div>

      {cedears.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[{ label: 'Total USD (D)', value: fmtUSD(totalUSD), color: 'var(--amber)' }, { label: 'Spread prom. vs CCL', value: fmtPct(avgSpread), color: avgSpread >= 0 ? 'var(--green)' : 'var(--red)' }, { label: 'Posiciones', value: String(cedears.length), color: 'var(--text)' }].map((c) => (
            <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted2)', marginBottom: '6px' }}>{c.label}</div>
              <div className="font-mono-data" style={{ fontSize: '20px', fontWeight: 500, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {cedears.length > 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {th('Ticker', 'left')}{th('Cant.')}{th('Precio $')}{th('Precio D')}{th('TC Impl.')}{th('CCL')}{th('Spread')}{th('Valor USD')}{th('Caución')}{th('')}
              </tr>
            </thead>
            <tbody>
              {cedears.map((c) => {
                const tc = calcTCImplicito(c.precioARS, c.precioUSD);
                const spread = calcSpread(tc, config.ccl);
                const caucion = cauciones.find((x) => x.id === c.caucionId);
                const isEditing = editing === c.id;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }} onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface2)')} onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={td('left')}><span className="font-mono-data" style={{ fontWeight: 700, color: 'var(--violet)', fontSize: '14px' }}>{c.ticker}</span></td>
                    <td className="font-mono-data" style={{ ...td(), color: 'var(--muted2)' }}>{fmtNum(c.cantidad, 0)}</td>
                    <td style={td()}>{isEditing ? editInput(editData.precioARS, (v) => setEditData((p) => ({ ...p, precioARS: v }))) : <span className="font-mono-data" style={{ color: 'var(--text)' }}>{fmtARS(c.precioARS)}</span>}</td>
                    <td style={td()}>{isEditing ? editInput(editData.precioUSD, (v) => setEditData((p) => ({ ...p, precioUSD: v })), '80px') : <span className="font-mono-data" style={{ color: 'var(--text)' }}>{fmtUSD(c.precioUSD)}</span>}</td>
                    <td className="font-mono-data" style={{ ...td(), color: tc < config.ccl ? 'var(--green)' : 'var(--amber)', fontWeight: 600 }}>{fmtNum(tc, 0)}</td>
                    <td className="font-mono-data" style={{ ...td(), color: 'var(--muted2)' }}>{fmtNum(config.ccl, 0)}</td>
                    <td className="font-mono-data" style={{ ...td(), color: spread >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700, fontSize: '14px' }}>{fmtPct(spread)}</td>
                    <td className="font-mono-data" style={{ ...td(), color: 'var(--amber)' }}>{fmtUSD(c.cantidad * c.precioUSD)}</td>
                    <td style={{ ...td(), fontSize: '11px', color: 'var(--muted2)' }}>{caucion ? caucion.descripcion || `$ ${caucion.monto.toLocaleString()}` : '—'}</td>
                    <td style={{ ...td(), paddingLeft: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {isEditing ? (
                          <>
                            <button onClick={() => confirmEdit(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)', padding: '3px', display: 'flex', alignItems: 'center' }}><Check size={14} /></button>
                            <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '3px', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '3px', display: 'flex', alignItems: 'center' }} onMouseOver={(e) => (e.currentTarget.style.color = 'var(--violet)')} onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted)')}><Pencil size={14} /></button>
                            <button onClick={() => deleteCedear(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '3px', display: 'flex', alignItems: 'center' }} onMouseOver={(e) => (e.currentTarget.style.color = 'var(--red)')} onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted)')}><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: '14px' }}>No hay CEDEARs registrados. Agregá uno arriba.</div>
      )}
    </div>
  );
}
