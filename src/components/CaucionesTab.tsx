'use client';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Caucion } from '@/lib/types';
import { calcVencimiento, calcDiasRestantes, calcInteres, fmtARS } from '@/lib/calculations';

interface Props {
  cauciones: Caucion[];
  addCaucion: (data: Omit<Caucion, 'id'>) => void;
  deleteCaucion: (id: string) => void;
}

const EMPTY = { descripcion: '', monto: '', tna: '', plazo: '', fechaInicio: new Date().toISOString().split('T')[0] };

const lbl = (text: string) => (
  <label style={{ display: 'block', fontSize: '10px', color: 'var(--muted2)', marginBottom: '5px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{text}</label>
);

export default function CaucionesTab({ cauciones, addCaucion, deleteCaucion }: Props) {
  const [form, setForm] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.monto || !form.tna || !form.plazo) return;
    addCaucion({ descripcion: form.descripcion, monto: Number(form.monto), tna: Number(form.tna), plazo: Number(form.plazo), fechaInicio: form.fechaInicio });
    setForm(EMPTY);
  };

  const totalMonto = cauciones.reduce((a, c) => a + c.monto, 0);
  const totalInteres = cauciones.reduce((a, c) => a + calcInteres(c.monto, c.tna, c.plazo), 0);

  const th = (text: string, align: 'left' | 'right' = 'right') => (
    <th key={text} style={{ padding: '10px 14px', textAlign: align, fontSize: '10px', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', color: 'var(--muted2)', textTransform: 'uppercase', whiteSpace: 'nowrap' as const }}>{text}</th>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--muted2)', textTransform: 'uppercase', marginBottom: '16px' }}>Nueva Caución Tomadora</div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div style={{ gridColumn: 'span 2' }}>{lbl('Descripción')}<input className="input-dark" type="text" placeholder="Ej: Caución Galicia" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} /></div>
            <div>{lbl('Monto ($)')}<input className="input-dark font-mono-data" type="number" placeholder="1000000" value={form.monto} onChange={(e) => set('monto', e.target.value)} required /></div>
            <div>{lbl('TNA (%)')}<input className="input-dark font-mono-data" type="number" step="0.01" placeholder="45.5" value={form.tna} onChange={(e) => set('tna', e.target.value)} required /></div>
            <div>{lbl('Plazo (días)')}<input className="input-dark font-mono-data" type="number" placeholder="30" value={form.plazo} onChange={(e) => set('plazo', e.target.value)} required /></div>
            <div>{lbl('Fecha inicio')}<input className="input-dark" type="date" value={form.fechaInicio} onChange={(e) => set('fechaInicio', e.target.value)} /></div>
          </div>
          <button type="submit" style={{ width: '100%', background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>+ Agregar Caución</button>
        </form>
      </div>

      {cauciones.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[{ label: 'Total tomado', value: fmtARS(totalMonto), color: 'var(--text)' }, { label: 'Interés a pagar', value: fmtARS(totalInteres), color: 'var(--red)' }, { label: 'Posiciones', value: String(cauciones.length), color: 'var(--text)' }].map((c) => (
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
                {th('Descripción', 'left')}{th('Monto')}{th('TNA')}{th('Plazo')}{th('Vencimiento')}{th('Días rest.')}{th('Interés')}{th('Estado')}{th('')}
              </tr>
            </thead>
            <tbody>
              {cauciones.map((c) => {
                const dias = calcDiasRestantes(c.fechaInicio, c.plazo);
                const vigente = dias >= 0;
                const diasColor = dias < 0 ? 'var(--muted)' : dias < 3 ? 'var(--red)' : dias < 7 ? 'var(--amber)' : 'var(--text)';
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }} onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface2)')} onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 14px', color: 'var(--text)' }}>{c.descripcion || '—'}</td>
                    <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--amber)' }}>{fmtARS(c.monto)}</td>
                    <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--violet)' }}>{c.tna.toFixed(2)}%</td>
                    <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{c.plazo}d</td>
                    <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--muted2)' }}>{calcVencimiento(c.fechaInicio, c.plazo)}</td>
                    <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: diasColor, fontWeight: 600 }}>{dias}d</td>
                    <td className="font-mono-data" style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--red)' }}>{fmtARS(calcInteres(c.monto, c.tna, c.plazo))}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: '20px', background: vigente ? 'rgba(16,185,129,0.1)' : 'rgba(74,74,122,0.2)', color: vigente ? 'var(--green)' : 'var(--muted)', border: vigente ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--border)' }}>
                        {vigente ? 'VIGENTE' : 'VENCIDA'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button onClick={() => deleteCaucion(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px', display: 'flex', alignItems: 'center' }} onMouseOver={(e) => (e.currentTarget.style.color = 'var(--red)')} onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted)')}>
                        <Trash2 size={14} />
                      </button>
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
