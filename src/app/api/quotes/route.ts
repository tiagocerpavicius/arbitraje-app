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
        const res = await fetch(
          `https://yahoo-finance166.p.rapidapi.com/api/stock/get-price?region=AR&symbol=${ticker}.BA`,
          {
            headers: {
              'x-rapidapi-host': 'yahoo-finance166.p.rapidapi.com',
              'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await res.json();

        const price =
          data?.price?.regularMarketPrice?.raw ??
          data?.price?.regularMarketPrice ??
          data?.regularMarketPrice?.raw ??
          data?.regularMarketPrice ??
          null;

        if (price !== null && typeof price === 'number') {
          prices[ticker] = price;
        }
      } catch {
        // ticker no encontrado, se ignora
      }
    })
  );

  return NextResponse.json(prices);
}
