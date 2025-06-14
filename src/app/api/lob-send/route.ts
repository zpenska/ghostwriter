import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { html, recipient } = await req.json();
  const apiKey = process.env.NEXT_PUBLIC_LOB_API_KEY;

  const res = await fetch('https://api.lob.com/v1/letters', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Letter from Ghostwriter',
      to: recipient,
      from: recipient, // using same for test purposes
      file: html,
      color: true,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    return NextResponse.json({ success: false, error }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ success: true, data });
}
