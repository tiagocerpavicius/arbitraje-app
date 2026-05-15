import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.invertironline.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username: process.env.IOL_USERNAME!,
        password: process.env.IOL_PASSWORD!,
        grant_type: 'password',
      }),
    });

    const data = await res.json();

    if (data.access_token) {
      return NextResponse.json({ ok: true, expira_en: data.expires_in });
    }
    return NextResponse.json({ ok: false, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
