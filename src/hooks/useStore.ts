'use client';
import { useState, useEffect, useCallback } from 'react';
import { Caucion, Cedear } from '@/lib/types';
import { supabase } from '@/lib/supabase';

const genId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCaucion(r: any): Caucion {
  return {
    id: r.id,
    descripcion: r.descripcion || '',
    monto: r.monto,
    tna: r.tna,
    plazo: r.plazo,
    fechaInicio: r.fecha_inicio,
    renovaciones: r.renovaciones ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCedear(r: any): Cedear {
  return {
    id: r.id,
    ticker: r.ticker,
    cantidad: r.cantidad,
    precioCompra: r.precio_compra,
    precioActual: r.precio_actual,
    caucionId: r.caucion_id ?? undefined,
  };
}

export function useStore(userId: string) {
  const [cauciones, setCauciones] = useState<Caucion[]>([]);
  const [cedears, setCedears] = useState<Cedear[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [caucRes, cedRes] = await Promise.all([
        supabase.from('cauciones').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('cedears').select('*').eq('user_id', userId).order('created_at'),
      ]);
      if (caucRes.data) setCauciones(caucRes.data.map(rowToCaucion));
      if (cedRes.data) setCedears(cedRes.data.map(rowToCedear));
      setHydrated(true);
    };
    load();
  }, [userId]);

  const addCaucion = useCallback(async (data: Omit<Caucion, 'id' | 'renovaciones'>) => {
    const id = genId();
    const { data: row } = await supabase.from('cauciones').insert({
      id, user_id: userId, descripcion: data.descripcion,
      monto: data.monto, tna: data.tna, plazo: data.plazo,
      fecha_inicio: data.fechaInicio, renovaciones: 0,
    }).select().single();
    if (row) setCauciones((p) => [...p, rowToCaucion(row)]);
  }, [userId]);

  const renovarCaucion = useCallback(async (id: string) => {
    const caucion = (await supabase.from('cauciones').select('*').eq('id', id).single()).data;
    if (!caucion) return;
    const nuevaFecha = new Date().toISOString().split('T')[0];
    const { data: row } = await supabase.from('cauciones').update({
      renovaciones: caucion.renovaciones + 1,
      fecha_inicio: nuevaFecha,
    }).eq('id', id).select().single();
    if (row) setCauciones((p) => p.map((c) => (c.id === id ? rowToCaucion(row) : c)));
  }, []);

  const deleteCaucion = useCallback(async (id: string) => {
    await supabase.from('cauciones').delete().eq('id', id).eq('user_id', userId);
    await supabase.from('cedears').update({ caucion_id: null }).eq('caucion_id', id).eq('user_id', userId);
    setCauciones((p) => p.filter((c) => c.id !== id));
    setCedears((p) => p.map((c) => (c.caucionId === id ? { ...c, caucionId: undefined } : c)));
  }, [userId]);

  const addCedear = useCallback(async (data: Omit<Cedear, 'id'>) => {
    const id = genId();
    const { data: row } = await supabase.from('cedears').insert({
      id, user_id: userId, ticker: data.ticker, cantidad: data.cantidad,
      precio_compra: data.precioCompra, precio_actual: data.precioActual,
      caucion_id: data.caucionId ?? null,
    }).select().single();
    if (row) setCedears((p) => [...p, rowToCedear(row)]);
  }, [userId]);

  const updateCedear = useCallback(async (id: string, data: Partial<Omit<Cedear, 'id'>>) => {
    const updates: Record<string, unknown> = {};
    if (data.precioActual !== undefined) updates.precio_actual = data.precioActual;
    if (data.caucionId !== undefined) updates.caucion_id = data.caucionId;
    if (data.cantidad !== undefined) updates.cantidad = data.cantidad;
    await supabase.from('cedears').update(updates).eq('id', id).eq('user_id', userId);
    setCedears((p) => p.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, [userId]);

  const deleteCedear = useCallback(async (id: string) => {
    await supabase.from('cedears').delete().eq('id', id).eq('user_id', userId);
    setCedears((p) => p.filter((c) => c.id !== id));
  }, [userId]);

  return {
    cauciones, cedears, hydrated,
    addCaucion, renovarCaucion, deleteCaucion,
    addCedear, updateCedear, deleteCedear,
  };
}
