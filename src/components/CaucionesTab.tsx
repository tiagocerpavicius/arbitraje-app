'use client';
import { useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { Caucion } from '@/lib/types';
import { calcVencimiento, calcDiasRestantes, calcInteresPeriodo, calcInteresTotal, fmtUSD, fmtNum } from '@/lib/calculations';

interface Props {
  cauciones: Caucion[];
  addCaucion: (data: Omit<Caucion, 'id' | 'renovaciones'>) => void;
  renovarCaucion: (id: string) => void;
  deleteCaucion: (id: string) => void;
}

const EMPTY = { descripcion: '', monto: '', tna: '', plazo: '', fechaInicio: new Date().toISOString().split('T')[0] };

const lbl = (text: string) => (
  <label style={{ display: 'block', fontSize: '10px', color: 'var(--muted2)', marginBottom: '5px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{text}</label>
);

const th = (text: string, align: 'left' | 'right' = 'right') => (
  <th key={text} style={{ padding: '10px 14px', textAlign: align, fontSize: '10px', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', color: 'var(--muted2)', textTransform: 'uppercase', whiteSpace: 'nowrap' as const }}>{text}</th>
);

export default function CaucionesTab({ cauciones, addCaucion, renovarCaucion, deleteCaucion }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [confirmRenew, setConfirmRenew] = useState<string | null>(null);
  const set = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.monto || !form.tna || !form.plazo) return;
    addCaucion({ descripcion: form.descripcion, monto: Number(form.monto), tna: Number(form.tna), plazo: Number(form.plazo), fechaInicio: form.fechaInicio });
    setForm(EMPTY);
  };

  const totalMonto = cauciones.reduce((a, c) => a + c.monto, 0);
  const totalInteresTotal = cauciones.reduce((a, c) => a + calcInteresTotal(c.monto, c.tna, c.plazo, c.renovaciones), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--muted2)', textTransform: 'uppercase', marginBottom: '16px' }}>Nueva Caución Tomadora</div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div style={{ gridColumn: 'span 2' }}>{lbl('Descripción')}<input className="input-dark" type="text" placeholder="Ej: Caución BYMA 14/5" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} /></div>
            <div>{lbl('Monto (USD MEP)')}<input className="input-dark font-mono-data" type="number" step="0.01" placeholder="10000" value={form.monto} onChange={(e) => set('monto', e.target.value)} required /></div>
            <div>{lbl('TNA (%)')}<input className="input-dark font-mono-data" type="number" step="0.01" placeholder="8.5" value={form.tna} onChange={(e) => set('tna', e.target.value)} required /></div>
            <div>{lbl('Plazo (días)')}<input className="input-dark font-mono-data" type="number" placeholder="7" value={form.plazo} onChange={(e) => set('plazo', e.target.value)} required /></div>
            <div>{lbl('Fecha inicio')}<input className="input-dark" type="date" value={form.fechaInicio} onChange={(e) => set('fechaInicio', e.target.value)} /></div>
          </div>
          <button type="submit" style={{ width: '100%', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>+ Agregar Caución</button>
        </form>
      </div>

      {cauciones.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'Total tomado', value: fmtUSD(totalMonto), color: 'var(--amber)' },
            { label: 'Costo total acumulado', value: fmtUSD(totalInteresTotal), color: 'var(--red)' },
            { label: 'Posiciones', value: String(cauciones.length), color: 'var(--text)' },
          ].map((c) => (
            <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted2)', marginBottom: '6px' }}>{c.label}</div>
              <div className="font-mono-data" style={{ fontSize: '20px', fontWeight: 500, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {cauciones.length > 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {th('Descripción', 'left')}{th('Monto USD')}{th('TNA')}{th('Plazo')}{th('Vencimiento')}{th('Días rest.')}{th('Renovaciones')}{th('Int. período')}{th('Int. total')}{th('Estado')}{th('')}
              </tr>
            </thead>
            <tbody>
              {cauciones.map((c) => {
                const dias = calcDiasRestantes(c.fechaInicio, c.plazo);
                const vigente = dias >= 0;
                const diasColor = dias < 0 ? 'var(--muted)' : dias < 2 ? 'var(--red)' : dias < 4 ? 'var(--amber)' : 'var(--text)';
                const intPeriodo = calcInteresPeriodo(c.monto, c.tna, c.plazo);
                const intTotal = calcInteresTotal(c.monto, c.tna, c.plazo, c.renovaciones);
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 14px', color: 'var(--text)' }}>{c.descripcion || '—'}</td>
                    <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--amber)' }}>{fmtUSD(c.monto)}</td>
                    <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--violet)' }}>{c.tna.toFixed(2)}%</td>
                    <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{c.plazo}d</td>
                    <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{calcVencimiento(c.fechaInicio, c.plazo)}</td>
                    <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: diasColor, fontWeight: 600 }}>{dias}d</td>
                    <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted2)' }}>
                      {c.renovaciones === 0 ? '—' : `${c.renovaciones}x`}
                    </td>
                    <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--red)' }}>{fmtUSD(intPeriodo)}</td>
                    <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--red)', fontWeight: 600 }}>{fmtUSD(intTotal)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: '20px', background: vigente ? 'rgba(16,185,129,0.1)' : 'rgba(74,74,122,0.2)', color: vigente ? 'var(--green)' : 'var(--muted)', border: vigente ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--border)' }}>
                        {vigente ? 'VIGENTE' : 'VENCIDA'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {confirmRenew === c.id ? (
                          <>
                            <button onClick={() => { renovarCaucion(c.id); setConfirmRenew(null); }}
                              style={{ background: 'var(--violet)', border: 'none', color: '#fff', cursor: 'pointer', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
                              Confirmar
                            </button>
                            <button onClick={() => setConfirmRenew(null)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '3px', display: 'flex', alignItems: 'center' }}>
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setConfirmRenew(c.id)} title="Renovar caución"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '3px', display: 'flex', alignItems: 'center' }}
                              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--violet)')}
                              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted)')}>
                              <RefreshCw size={14} />
                            </button>
                            <button onClick={() => deleteCaucion(c.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '3px', display: 'flex', alignItems: 'center' }}
                              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--red)')}
                              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted)')}>
                              <Trash2 size={14} />
                            </button>
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
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: '14px' }}>No hay cauciones registradas. Agregá una arriba.</div>
      )}
    </div>
  );
}
