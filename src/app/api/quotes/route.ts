import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get('tickers')?.split(',').filter(Boolean) ?? [];

  if (!tickers.length) {
    return NextResponse.json({});
  }

  const symbols = tickers.map((t) => `${t}.BA`).join(',');

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36',
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
