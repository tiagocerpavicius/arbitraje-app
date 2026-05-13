import { NextRequest, NextResponse } from 'next/server';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function getCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  try {
    const res = await fetch(
      'https://query2.finance.yahoo.com/v1/test/getcrumb',
      {
        headers: {
          'User-Agent': UA,
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    );
    const crumb = await res.text();
    const cookie = res.headers.get('set-cookie')?.split(';')[0] ?? '';

    if (crumb && !crumb.startsWith('<') && crumb.length < 50) {
      return { crumb, cookie };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get('tickers')?.split(',').filter(Boolean) ?? [];

  if (!tickers.length) {
    return NextResponse.json({});
  }

  const symbols = tickers.map((t) => `${t}.BA`).join(',');
  const auth = await getCrumb();

  if (!auth) {
    return NextResponse.json(
      { error: 'No se pudo obtener el crumb de Yahoo Finance' },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&crumb=${encodeURIComponent(auth.crumb)}`,
      {
        headers: {
          'User-Agent': UA,
          Cookie: auth.cookie,
          Accept: 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    );

    const data = await res.json();
    const quotes: { symbol: string; regularMarketPrice: number }[] =
      data?.quoteResponse?.result ?? [];

    const prices: Record<string, number> = {};
    quotes.forEach((q) => {
      const ticker = q.symbol.replace('.BA', '');
      if (q.regularMarketPrice) {
        prices[ticker] = q.regularMarketPrice;
      }
    });

    return NextResponse.json(prices);
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    );
  }
}
