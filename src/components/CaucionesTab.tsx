'use client';
import { useState } from 'react';
import { Trash2, RefreshCw, Check, X, ChevronRight, ChevronDown } from 'lucide-react';
import { Caucion, CaucionPeriodo } from '@/lib/types';
import { calcVencimiento, calcDiasRestantes, calcInteresPeriodo, fmtUSD } from '@/lib/calculations';

interface Props {
  cauciones: Caucion[];
  periodos: Record<string, CaucionPeriodo[]>;
  addCaucion: (data: Omit<Caucion, 'id' | 'renovaciones'>) => void;
  renovarCaucion: (id: string, params: { monto: number; tna: number; plazo: number; fechaInicio: string }) => void;
  deleteCaucion: (id: string) => void;
}

const EMPTY = { descripcion: '', monto: '', tna: '', plazo: '', fechaInicio: new Date().toISOString().split('T')[0] };

const lbl = (text: string) => (
  <label style={{ display: 'block', fontSize: '10px', color: 'var(--muted2)', marginBottom: '5px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{text}</label>
);

const th = (text: string, align: 'left' | 'right' = 'right') => (
  <th key={text} style={{ padding: '10px 14px', textAlign: align, fontSize: '10px', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', color: 'var(--muted2)', textTransform: 'uppercase', whiteSpace: 'nowrap' as const }}>{text}</th>
);

interface RenovarForm { monto: string; tna: string; plazo: string; fechaInicio: string; }

export default function CaucionesTab({ cauciones, periodos, addCaucion, renovarCaucion, deleteCaucion }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [renovando, setRenovando] = useState<string | null>(null);
  const [renovForm, setRenovForm] = useState<RenovarForm>({ monto: '', tna: '', plazo: '', fechaInicio: '' });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const set = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.monto || !form.tna || !form.plazo) return;
    addCaucion({ descripcion: form.descripcion, monto: Number(form.monto), tna: Number(form.tna), plazo: Number(form.plazo), fechaInicio: form.fechaInicio });
    setForm(EMPTY);
  };

  const startRenovar = (c: Caucion) => {
    setRenovando(c.id);
    setRenovForm({ monto: String(c.monto), tna: String(c.tna), plazo: String(c.plazo), fechaInicio: new Date().toISOString().split('T')[0] });
  };

  const confirmRenovar = (id: string) => {
    if (!renovForm.monto || !renovForm.tna || !renovForm.plazo) return;
    renovarCaucion(id, { monto: Number(renovForm.monto), tna: Number(renovForm.tna), plazo: Number(renovForm.plazo), fechaInicio: renovForm.fechaInicio });
    setRenovando(null);
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalMonto = cauciones.reduce((a, c) => a + c.monto, 0);
  const totalCosto = cauciones.reduce((a, c) => {
    const historico = (periodos[c.id] ?? []).reduce((s, p) => s + p.intereses, 0);
    return a + historico + calcInteresPeriodo(c.monto, c.tna, c.plazo);
  }, 0);

  const inlineInput = (val: string, onChange: (v: string) => void, placeholder: string, w = '80px', type = 'number') => (
    <input type={type} value={val} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: w, background: 'var(--surface2)', border: '1px solid var(--violet)', borderRadius: '4px', padding: '3px 6px', color: 'var(--text)', fontFamily: 'DM Mono, monospace', fontSize: '12px', textAlign: type === 'number' ? 'right' : 'left' as 'right' | 'left' }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Formulario */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--muted2)', textTransform: 'uppercase', marginBottom: '16px' }}>
          Nueva Caución Tomadora
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div style={{ gridColumn: 'span 2' }}>{lbl('Descripción')}<input className="input-dark" type="text" placeholder="Ej: Caución BYMA 14/5" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} /></div>
            <div>{lbl('Monto (USD MEP)')}<input className="input-dark font-mono-data" type="number" step="0.01" placeholder="10000" value={form.monto} onChange={(e) => set('monto', e.target.value)} required /></div>
            <div>{lbl('TNA (%)')}<input className="input-dark font-mono-data" type="number" step="0.01" placeholder="8.5" value={form.tna} onChange={(e) => set('tna', e.target.value)} required /></div>
            <div>{lbl('Plazo (días)')}<input className="input-dark font-mono-data" type="number" placeholder="7" value={form.plazo} onChange={(e) => set('plazo', e.target.value)} required /></div>
            <div>{lbl('Fecha inicio')}<input className="input-dark" type="date" value={form.fechaInicio} onChange={(e) => set('fechaInicio', e.target.value)} /></div>
          </div>
          <button type="submit" style={{ width: '100%', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
            + Agregar Caución
          </button>
        </form>
      </div>

      {/* Cards */}
      {cauciones.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'Total tomado', value: fmtUSD(totalMonto), color: 'var(--amber)' },
            { label: 'Costo total acumulado', value: fmtUSD(totalCosto), color: 'var(--red)' },
            { label: 'Posiciones', value: String(cauciones.length), color: 'var(--text)' },
          ].map((c) => (
            <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted2)', marginBottom: '6px' }}>{c.label}</div>
              <div className="font-mono-data" style={{ fontSize: '20px', fontWeight: 500, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
      {cauciones.length > 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ width: '32px' }}></th>
                {th('Descripción', 'left')}{th('Monto USD')}{th('TNA')}{th('Plazo')}{th('Vencimiento')}{th('Días rest.')}{th('Renovaciones')}{th('Int. período')}{th('Int. total')}{th('Estado')}{th('')}
              </tr>
            </thead>
            <tbody>
              {cauciones.map((c) => {
                const dias = calcDiasRestantes(c.fechaInicio, c.plazo);
                const vigente = dias >= 0;
                const diasColor = dias < 0 ? 'var(--muted)' : dias < 2 ? 'var(--red)' : dias < 4 ? 'var(--amber)' : 'var(--text)';
                const isRenovando = renovando === c.id;
                const isExpanded = expanded.has(c.id);
                const historial = periodos[c.id] ?? [];
                const costoHistorico = historial.reduce((a, p) => a + p.intereses, 0);
                const costoActual = calcInteresPeriodo(c.monto, c.tna, c.plazo);
                const costoTotal = costoHistorico + costoActual;

                return (
                  <>
                    {/* Fila principal */}
                    <tr key={c.id} style={{ borderBottom: (isRenovando || isExpanded) ? 'none' : '1px solid var(--border)' }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        {historial.length > 0 && (
                          <button onClick={() => toggleExpanded(c.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted2)', padding: '2px', display: 'flex', alignItems: 'center' }}>
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text)' }}>{c.descripcion || '—'}</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--amber)' }}>{fmtUSD(c.monto)}</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--violet)' }}>{c.tna.toFixed(2)}%</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{c.plazo}d</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{calcVencimiento(c.fechaInicio, c.plazo)}</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: diasColor, fontWeight: 600 }}>{dias}d</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted2)' }}>
                        {c.renovaciones === 0 ? '—' : `${c.renovaciones}x`}
                      </td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--red)' }}>{fmtUSD(costoActual)}</td>
                      <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--red)', fontWeight: 600 }}>{fmtUSD(costoTotal)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: '20px', background: vigente ? 'rgba(16,185,129,0.1)' : 'rgba(74,74,122,0.2)', color: vigente ? 'var(--green)' : 'var(--muted)', border: vigente ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--border)' }}>
                          {vigente ? 'VIGENTE' : 'VENCIDA'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button onClick={() => startRenovar(c)} title="Renovar"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isRenovando ? 'var(--violet)' : 'var(--muted)', padding: '3px', display: 'flex', alignItems: 'center' }}
                            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--violet)')}
                            onMouseOut={(e) => (e.currentTarget.style.color = isRenovando ? 'var(--violet)' : 'var(--muted)')}>
                            <RefreshCw size={14} />
                          </button>
                          <button onClick={() => deleteCaucion(c.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '3px', display: 'flex', alignItems: 'center' }}
                            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--red)')}
                            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted)')}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Historial expandible */}
                    {isExpanded && historial.length > 0 && (
                      <tr key={`hist-${c.id}`} style={{ borderBottom: isRenovando ? 'none' : '1px solid var(--border)' }}>
                        <td colSpan={12} style={{ padding: '0 0 0 40px', background: 'rgba(0,0,0,0.2)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '9px', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>Período</th>
                                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '9px', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>Monto</th>
                                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '9px', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>TNA</th>
                                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '9px', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>Plazo</th>
                                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '9px', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>Fecha inicio</th>
                                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '9px', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>Intereses</th>
                              </tr>
                            </thead>
                            <tbody>
                              {historial.map((p, idx) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <td style={{ padding: '8px 14px', color: 'var(--muted2)' }}>
                                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '10px' }}>
                                      Período {idx + 1}
                                    </span>
                                  </td>
                                  <td className="font-mono-data" style={{ padding: '8px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{fmtUSD(p.monto)}</td>
                                  <td className="font-mono-data" style={{ padding: '8px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{p.tna.toFixed(2)}%</td>
                                  <td className="font-mono-data" style={{ padding: '8px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{p.plazo}d</td>
                                  <td className="font-mono-data" style={{ padding: '8px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{p.fechaInicio}</td>
                                  <td className="font-mono-data" style={{ padding: '8px 14px', textAlign: 'right', color: 'var(--red)' }}>{fmtUSD(p.intereses)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}

                    {/* Formulario renovación inline */}
                    {isRenovando && (
                      <tr key={`renov-${c.id}`} style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                        <td colSpan={12} style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '10px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--violet)', textTransform: 'uppercase' }}>
                              Renovar caución
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--muted2)' }}>Monto</span>
                              {inlineInput(renovForm.monto, (v) => setRenovForm((p) => ({ ...p, monto: v })), '10000', '90px')}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--muted2)' }}>TNA %</span>
                              {inlineInput(renovForm.tna, (v) => setRenovForm((p) => ({ ...p, tna: v })), '8.5', '70px')}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--muted2)' }}>Plazo días</span>
                              {inlineInput(renovForm.plazo, (v) => setRenovForm((p) => ({ ...p, plazo: v })), '7', '60px')}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--muted2)' }}>Fecha</span>
                              {inlineInput(renovForm.fechaInicio, (v) => setRenovForm((p) => ({ ...p, fechaInicio: v })), '', '130px', 'date')}
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => confirmRenovar(c.id)}
                                style={{ background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', fontFamily: 'Syne, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={12} /> Confirmar
                              </button>
                              <button onClick={() => setRenovando(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px', display: 'flex', alignItems: 'center' }}>
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: '14px' }}>
          No hay cauciones registradas. Agregá una arriba.
        </div>
      )}
    </div>
  );
}
