import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { html, fax } = await req.json();
  const username = process.env.INTERFAX_USERNAME;
  const password = process.env.INTERFAX_PASSWORD;

  const res = await fetch('https://rest.interfax.net/outbound/faxes', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      FaxNumber: fax,
      HtmlBody: html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ success: false, error }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ success: true, data });
}
