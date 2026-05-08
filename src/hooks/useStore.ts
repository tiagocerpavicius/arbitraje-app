'use client';
import { useState, useEffect, useCallback } from 'react';
import { Caucion, CaucionPeriodo, Cedear } from '@/lib/types';
import { calcInteresPeriodo } from '@/lib/calculations';
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
function rowToPeriodo(r: any): CaucionPeriodo {
  return {
    id: r.id,
    caucionId: r.caucion_id,
    monto: r.monto,
    tna: r.tna,
    plazo: r.plazo,
    fechaInicio: r.fecha_inicio,
    intereses: r.intereses,
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
    precioVenta: r.precio_venta ?? undefined,
    fechaVenta: r.fecha_venta ?? undefined,
  };
}

export function useStore(userId: string) {
  const [cauciones, setCauciones] = useState<Caucion[]>([]);
  const [periodos, setPeriodos] = useState<Record<string, CaucionPeriodo[]>>({});
  const [cedears, setCedears] = useState<Cedear[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [caucRes, perRes, cedRes] = await Promise.all([
        supabase.from('cauciones').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('caucion_periodos').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('cedears').select('*').eq('user_id', userId).order('created_at'),
      ]);
      if (caucRes.data) setCauciones(caucRes.data.map(rowToCaucion));
      if (perRes.data) {
        const grouped: Record<string, CaucionPeriodo[]> = {};
        perRes.data.forEach((r) => {
          const p = rowToPeriodo(r);
          if (!grouped[p.caucionId]) grouped[p.caucionId] = [];
          grouped[p.caucionId].push(p);
        });
        setPeriodos(grouped);
      }
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

  const renovarCaucion = useCallback(async (
    id: string,
    params: { monto: number; tna: number; plazo: number; fechaInicio: string }
  ) => {
    const caucion = cauciones.find((c) => c.id === id);
    if (!caucion) return;

    // Guardar período actual en historial
    const periodoId = genId();
    const interesesPeriodo = calcInteresPeriodo(caucion.monto, caucion.tna, caucion.plazo);
    await supabase.from('caucion_periodos').insert({
      id: periodoId,
      caucion_id: id,
      user_id: userId,
      monto: caucion.monto,
      tna: caucion.tna,
      plazo: caucion.plazo,
      fecha_inicio: caucion.fechaInicio,
      intereses: interesesPeriodo,
    });

    // Actualizar caución con nuevos términos
    const { data: row } = await supabase.from('cauciones').update({
      monto: params.monto,
      tna: params.tna,
      plazo: params.plazo,
      fecha_inicio: params.fechaInicio,
      renovaciones: caucion.renovaciones + 1,
    }).eq('id', id).select().single();

    if (row) {
      setCauciones((p) => p.map((c) => (c.id === id ? rowToCaucion(row) : c)));
      const nuevoPeriodo: CaucionPeriodo = {
        id: periodoId, caucionId: id,
        monto: caucion.monto, tna: caucion.tna,
        plazo: caucion.plazo, fechaInicio: caucion.fechaInicio,
        intereses: interesesPeriodo,
      };
      setPeriodos((p) => ({ ...p, [id]: [...(p[id] ?? []), nuevoPeriodo] }));
    }
  }, [userId, cauciones]);

  const deleteCaucion = useCallback(async (id: string) => {
    await supabase.from('cauciones').delete().eq('id', id).eq('user_id', userId);
    setCauciones((p) => p.filter((c) => c.id !== id));
    setPeriodos((p) => { const next = { ...p }; delete next[id]; return next; });
  }, [userId]);

  const addCedear = useCallback(async (data: Omit<Cedear, 'id'>) => {
    const id = genId();
    const { data: row } = await supabase.from('cedears').insert({
      id, user_id: userId, ticker: data.ticker,
      cantidad: data.cantidad, precio_compra: data.precioCompra,
      precio_actual: data.precioActual,
    }).select().single();
    if (row) setCedears((p) => [...p, rowToCedear(row)]);
  }, [userId]);

  const updateCedear = useCallback(async (id: string, data: Partial<Omit<Cedear, 'id'>>) => {
    const updates: Record<string, unknown> = {};
    if (data.precioActual !== undefined) updates.precio_actual = data.precioActual;
    if (data.precioVenta !== undefined) updates.precio_venta = data.precioVenta;
    if (data.fechaVenta !== undefined) updates.fecha_venta = data.fechaVenta;
    if (data.cantidad !== undefined) updates.cantidad = data.cantidad;
    await supabase.from('cedears').update(updates).eq('id', id).eq('user_id', userId);
    setCedears((p) => p.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, [userId]);

  const deleteCedear = useCallback(async (id: string) => {
    await supabase.from('cedears').delete().eq('id', id).eq('user_id', userId);
    setCedears((p) => p.filter((c) => c.id !== id));
  }, [userId]);

  return {
    cauciones, periodos, cedears, hydrated,
    addCaucion, renovarCaucion, deleteCaucion,
    addCedear, updateCedear, deleteCedear,
  };
}
