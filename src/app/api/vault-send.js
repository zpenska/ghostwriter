// pages/api/vault-send.js
import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import puppeteer from 'puppeteer';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(request) {
  try {
    const { html, deliveryId, memberName, memberId, templateName } = await request.json();

    if (!html || !deliveryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Initialize Google Cloud Storage
    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH, // Path to your service account JSON file
      // Or use credentials directly:
      // credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
    });

    const bucketName = process.env.GCP_BUCKET_NAME || 'ghostwriter-letters';
    const bucket = storage.bucket(bucketName);

    // Generate PDF from HTML using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set up page for letter format
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF with proper letter formatting
    const pdfBuffer = await page.pdf({
      format: 'Letter', // 8.5 x 11 inches
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      },
      printBackground: true,
      preferCSSPageSize: false
    });

    await browser.close();

    // Generate filename with timestamp and member info
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const cleanMemberName = memberName ? memberName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') : 'Unknown';
    const cleanTemplateName = templateName ? templateName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') : 'Letter';
    
    const fileName = `letters/${timestamp}_${cleanMemberName}_${memberId}_${cleanTemplateName}.pdf`;

    // Upload PDF to Google Cloud Storage
    const file = bucket.file(fileName);
    
    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          deliveryId,
          memberName: memberName || 'Unknown',
          memberId: memberId || 'Unknown',
          templateName: templateName || 'Letter',
          createdAt: new Date().toISOString(),
          source: 'ghostwriter'
        }
      }
    });

    // Make file publicly accessible with a signed URL (expires in 7 days)
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    });

    // Also create a permanent public URL if bucket allows public access
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

    // Update delivery record in Firestore
    await updateDoc(doc(db, 'deliveries', deliveryId), {
      status: 'completed',
      vaultUrl: signedUrl,
      publicUrl: publicUrl,
      fileName: fileName,
      fileSize: pdfBuffer.length,
      completedAt: new Date(),
      deliveryMethod: 'vault'
    });

    console.log(`✅ Letter stored in vault: ${fileName}`);
    console.log(`🔗 Vault URL: ${signedUrl}`);

    return NextResponse.json({
      success: true,
      vaultUrl: signedUrl,
      publicUrl: publicUrl,
      fileName: fileName,
      fileSize: pdfBuffer.length,
      message: 'Letter successfully stored in Document Vault'
    });

  } catch (error) {
    console.error('Error storing letter in vault:', error);
    
    // Update delivery record with error status
    if (deliveryId) {
      try {
        await updateDoc(doc(db, 'deliveries', deliveryId), {
          status: 'failed',
          error: error.message,
          failedAt: new Date()
        });
      } catch (updateError) {
        console.error('Error updating delivery record:', updateError);
      }
    }

    return NextResponse.json(
      { error: 'Failed to store letter in vault', details: error.message },
      { status: 500 }
    );
  }
}