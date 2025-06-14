import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { db } from '@/lib/firebase/config';
import { addDoc, collection } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('[FAX TEST] 📥 Received request body:', JSON.stringify(body, null, 2));

  const recipientFaxNumber = '+12157955537';

  // Simulated, clean HTML known to work with InterFAX
  const htmlContent = `<!DOCTYPE html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <h1>Ghostwriter Test Fax</h1>
    <p>This is a test message to verify fax delivery success logging.</p>
  </body>
</html>`;

  const payload = {
    faxNumber: recipientFaxNumber,
    subject: 'Ghostwriter Test Fax',
    content: htmlContent,
    contentType: 'html',
  };

  console.log('[FAX TEST] 📤 Sending test fax to InterFAX with payload:', {
    subject: payload.subject,
    contentSize: htmlContent.length,
    faxNumber: recipientFaxNumber,
  });

  try {
    const response = await axios.post('https://rest.interfax.net/outbound/faxes', payload, {
      auth: {
        username: process.env.INTERFAX_USERNAME ?? '',
        password: process.env.INTERFAX_PASSWORD ?? '',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[FAX TEST] ✅ InterFAX response:', JSON.stringify(response.data, null, 2));

    await addDoc(collection(db, 'delivery_status'), {
      deliveryId: body.deliveryId ?? 'manual-test',
      type: 'fax',
      test: true,
      to: recipientFaxNumber,
      result: response.data,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, faxId: response.data.id });
  } catch (error: any) {
    console.error('[FAX TEST ERROR] ❌ InterFAX failed:', {
      status: error.response?.status,
      data: error.response?.data?.toString?.() || error.response?.data,
      message: error.message,
    });

    await addDoc(collection(db, 'delivery_status'), {
      deliveryId: body.deliveryId ?? 'manual-test',
      type: 'fax',
      test: true,
      to: recipientFaxNumber,
      error: {
        status: error.response?.status,
        rawError: error.response?.data,
        message: error.message,
      },
      timestamp: new Date(),
    });

    return NextResponse.json(
      { success: false, error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
