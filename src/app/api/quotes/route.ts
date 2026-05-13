import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get('tickers')?.split(',').filter(Boolean) ?? [];

  if (!tickers.length) {
    return NextResponse.json({ error: 'sin tickers' });
  }

  const ticker = tickers[0];

  try {
    const res = await fetch(
      `https://yahoo-finance166.p.rapidapi.com/api/stock/get-price?region=AR&symbol=${ticker}.BA`,
      {
        headers: {
          'x-rapidapi-host': 'yahoo-finance166.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY ?? 'SIN_KEY',
          'Content-Type': 'application/json',
        },
      }
    );

    const status = res.status;
    const data = await res.json();

    return NextResponse.json({
      ticker: `${ticker}.BA`,
      tieneKey: !!process.env.RAPIDAPI_KEY,
      status,
      data,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
