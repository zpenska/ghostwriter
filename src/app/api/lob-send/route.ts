import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { db } from '@/lib/firebase/config';
import { addDoc, collection } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('[LOB] 📥 Received request body:', JSON.stringify(body, null, 2));

  if (!body.html || !body.deliveryId) {
    console.warn('[LOB] ❌ Missing HTML or deliveryId.');
    return NextResponse.json(
      { success: false, error: 'Missing HTML content or deliveryId' },
      { status: 400 }
    );
  }

  // Replace all merge variables with test values
  const cleanedHtml = body.html
    .replace(/{{member_name}}/g, 'Test Member')
    .replace(/{{diagnosis_code}}/g, 'D123.4')
    .replace(/{{dob}}/g, '01/01/1970')
    .replace(/{{member_id}}/g, '1234567890')
    .replace(/{{provider_name}}/g, 'Dr. Smith')
    .replace(/{{facility_name}}/g, 'HealthCare Clinic')
    .replace(/{{service_date}}/g, '06/14/2025')
    .replace(/{{procedure_code}}/g, 'PROC-001');

  const htmlPayload = `<html style="padding-top: 3in; margin: .5in;">${cleanedHtml}</html>`;

  const address = {
    name: 'Zachary Penska',
    address_line1: '1650 Governors Way',
    address_city: 'Blue Bell',
    address_state: 'PA',
    address_zip: '19422',
    address_country: 'US',
  };

  const lobRequestPayload = {
    description: 'Ghostwriter Letter',
    to: address,
    from: address,
    file: htmlPayload,
    color: false,
    mail_type: 'usps_first_class',
    use_type: 'operational',
  };

  console.log('[LOB] 📤 Sending to Lob with payload:', {
    ...lobRequestPayload,
    htmlLength: htmlPayload.length,
  });

  try {
    const response = await axios.post(
      'https://api.lob.com/v1/letters',
      lobRequestPayload,
      {
        auth: {
          username: process.env.LOB_API_KEY ?? '',
          password: '',
        },
      }
    );

    console.log('[LOB] ✅ Lob response:', JSON.stringify(response.data, null, 2));

    await addDoc(collection(db, 'delivery_status'), {
      deliveryId: body.deliveryId,
      type: 'lob',
      result: response.data,
      replacedPlaceholders: true,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, lobId: response.data.id });
  } catch (error: any) {
    console.error('[LOB ERROR]', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    await addDoc(collection(db, 'delivery_status'), {
      deliveryId: body.deliveryId,
      type: 'lob',
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
      replacedPlaceholders: true,
      timestamp: new Date(),
    });

    return NextResponse.json(
      { success: false, error: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}
