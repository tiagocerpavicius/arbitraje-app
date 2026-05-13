import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get('tickers')?.split(',').filter(Boolean) ?? [];

  if (!tickers.length) {
    return NextResponse.json({});
  }

  try {
    const res = await fetch(
      'https://open.bymadata.com.ar/vanoms-be-core/rest/api/bymadata/free/cedears',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          limit: 200,
          excludeZeroPx: false,
          excludeNoRem: false,
          T2: true,
          T1: false,
          T0: false,
        }),
      }
    );

    const data = await res.json();
    const list: Record<string, unknown>[] = Array.isArray(data)
      ? data
      : (data?.data ?? data?.content ?? []);

    const prices: Record<string, number> = {};

    for (const ticker of tickers) {
      const item = list.find(
        (i) =>
          i['symbol'] === ticker ||
          i['Simbolo'] === ticker ||
          i['symbolWithSuffix'] === ticker ||
          i['ticker'] === ticker
      );
      if (item) {
        const price =
          (item['price'] as number) ||
          (item['ultimoPrecio'] as number) ||
          (item['c'] as number) ||
          (item['trade'] as number);
        if (price) prices[ticker] = price;
      }
    }

    return NextResponse.json(prices);
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    );
  }
}
