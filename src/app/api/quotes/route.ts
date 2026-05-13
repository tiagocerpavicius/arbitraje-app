import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get('tickers')?.split(',').filter(Boolean) ?? [];

  if (!tickers.length) {
    return NextResponse.json({});
  }

  const prices: Record<string, number> = {};

  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const symbol = `${ticker}.BA`;
        const res = await fetch(
          `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'application/json',
              'Accept-Language': 'en-US,en;q=0.9',
              Referer: 'https://finance.yahoo.com/',
            },
          }
        );

        const data = await res.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

        if (price && typeof price === 'number') {
          prices[ticker] = price;
        }
      } catch {
        // ticker no encontrado, se ignora
      }
    })
  );

  return NextResponse.json(prices);
}
