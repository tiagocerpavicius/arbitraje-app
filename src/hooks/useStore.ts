'use client';
import { useState, useEffect, useCallback } from 'react';
import { Caucion, Cedear, AppConfig } from '@/lib/types';
import { supabase } from '@/lib/supabase';

const DEFAULT_CONFIG: AppConfig = { ccl: 1200, mep: 1180 };

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
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCedear(r: any): Cedear {
  return {
    id: r.id,
    ticker: r.ticker,
    cantidad: r.cantidad,
    precioARS: r.precio_ars,
    precioUSD: r.precio_usd,
    caucionId: r.caucion_id ?? undefined,
  };
}

export function useStore(userId: string) {
  const [cauciones, setCauciones] = useState<Caucion[]>([]);
  const [cedears, setCedears] = useState<Cedear[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [caucRes, cedRes, cfgRes] = await Promise.all([
        supabase.from('cauciones').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('cedears').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('user_config').select('*').eq('user_id', userId).single(),
      ]);
      if (caucRes.data) setCauciones(caucRes.data.map(rowToCaucion));
      if (cedRes.data) setCedears(cedRes.data.map(rowToCedear));
      if (cfgRes.data) setConfig({ ccl: cfgRes.data.ccl, mep: cfgRes.data.mep });
      setHydrated(true);
    };
    load();
  }, [userId]);

  const addCaucion = useCallback(async (data: Omit<Caucion, 'id'>) => {
    const id = genId();
    const { data: row } = await supabase.from('cauciones').insert({
      id, user_id: userId, descripcion: data.descripcion,
      monto: data.monto, tna: data.tna, plazo: data.plazo, fecha_inicio: data.fechaInicio,
    }).select().single();
    if (row) setCauciones((p) => [...p, rowToCaucion(row)]);
  }, [userId]);

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
      precio_ars: data.precioARS, precio_usd: data.precioUSD, caucion_id: data.caucionId ?? null,
    }).select().single();
    if (row) setCedears((p) => [...p, rowToCedear(row)]);
  }, [userId]);

  const updateCedear = useCallback(async (id: string, data: Partial<Omit<Cedear, 'id'>>) => {
    const updates: Record<string, unknown> = {};
    if (data.precioARS !== undefined) updates.precio_ars = data.precioARS;
    if (data.precioUSD !== undefined) updates.precio_usd = data.precioUSD;
    if (data.caucionId !== undefined) updates.caucion_id = data.caucionId;
    if (data.ticker !== undefined) updates.ticker = data.ticker;
    if (data.cantidad !== undefined) updates.cantidad = data.cantidad;
    await supabase.from('cedears').update(updates).eq('id', id).eq('user_id', userId);
    setCedears((p) => p.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, [userId]);

  const deleteCedear = useCallback(async (id: string) => {
    await supabase.from('cedears').delete().eq('id', id).eq('user_id', userId);
    setCedears((p) => p.filter((c) => c.id !== id));
  }, [userId]);

  const updateConfig = useCallback(async (data: Partial<AppConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...data };
      supabase.from('user_config').upsert({ user_id: userId, ccl: next.ccl, mep: next.mep });
      return next;
    });
  }, [userId]);

  return {
    cauciones, cedears, config, hydrated,
    addCaucion, deleteCaucion,
    addCedear, updateCedear, deleteCedear,
    updateConfig,
  };
}
