import { NextRequest, NextResponse } from 'next/server';

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxwc00Urx3TIfbnXzyN444S-WxT5s0vBgoaEn9l4g7JuXQXYkuGjzkhIfEaeVVqRspv/exec';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get('tickers')?.split(',').filter(Boolean) ?? [];

  if (!tickers.length) {
    return NextResponse.json({});
  }

  try {
    const res = await fetch(
      `${APPS_SCRIPT_URL}?tickers=${tickers.join(',')}`,
      { redirect: 'follow' }
    );

    const prices: Record<string, number> = await res.json();
    return NextResponse.json(prices);
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    );
  }
}
