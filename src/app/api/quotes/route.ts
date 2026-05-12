import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

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
        const quote = await yahooFinance.quote(`${ticker}.BA`, {}, { validateResult: false });
        if (quote.regularMarketPrice) {
          prices[ticker] = quote.regularMarketPrice;
        }
      } catch {
        // ticker no encontrado, se ignora
      }
    })
  );

  return NextResponse.json(prices);
}
