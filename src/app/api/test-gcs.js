// pages/api/test-gcs.js
import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export async function POST(request) {
  try {
    // Check if required environment variables are set
    const requiredEnvVars = {
      GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
      GCP_BUCKET_NAME: process.env.GCP_BUCKET_NAME,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return NextResponse.json({
        error: `Missing environment variables: ${missingVars.join(', ')}`,
        details: 'Please check your .env.local file'
      }, { status: 400 });
    }

    // Initialize Google Cloud Storage
    let storage;
    try {
      if (process.env.GCP_SERVICE_ACCOUNT_KEY_PATH) {
        // Use service account key file
        storage = new Storage({
          projectId: process.env.GCP_PROJECT_ID,
          keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH,
        });
      } else if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
        // Use service account key from environment variable
        storage = new Storage({
          projectId: process.env.GCP_PROJECT_ID,
          credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
        });
      } else {
        return NextResponse.json({
          error: 'No service account credentials found',
          details: 'Set either GCP_SERVICE_ACCOUNT_KEY_PATH or GCP_SERVICE_ACCOUNT_KEY environment variable'
        }, { status: 400 });
      }
    } catch (credentialError) {
      return NextResponse.json({
        error: 'Invalid service account credentials',
        details: credentialError.message
      }, { status: 400 });
    }

    const bucketName = process.env.GCP_BUCKET_NAME || 'ghostwriter-letters';
    const bucket = storage.bucket(bucketName);

    // Test 1: Check if bucket exists
    const [bucketExists] = await bucket.exists();
    if (!bucketExists) {
      return NextResponse.json({
        error: `Bucket '${bucketName}' does not exist`,
        details: 'Check your bucket name and ensure it exists in your GCP project'
      }, { status: 404 });
    }

    // Test 2: Test bucket access by getting metadata
    const [metadata] = await bucket.getMetadata();

    // Test 3: Test write permissions by creating a test file
    const testFileName = `test-connection-${Date.now()}.txt`;
    const testFile = bucket.file(testFileName);
    await testFile.save('Test connection from Ghostwriter', {
      metadata: {
        contentType: 'text/plain',
        metadata: {
          source: 'ghostwriter-connection-test',
          timestamp: new Date().toISOString()
        }
      }
    });

    // Test 4: Test read permissions
    const [fileExists] = await testFile.exists();
    if (!fileExists) {
      throw new Error('Failed to verify file upload');
    }

    // Test 5: Clean up test file
    await testFile.delete();

    // Test 6: Get bucket location and storage class info
    const bucketInfo = {
      name: metadata.name,
      location: metadata.location,
      storageClass: metadata.storageClass,
      created: metadata.timeCreated,
      projectNumber: metadata.projectNumber
    };

    return NextResponse.json({
      success: true,
      message: 'Google Cloud Storage connection successful!',
      bucketInfo,
      tests: {
        bucketExists: true,
        metadataAccess: true,
        writePermission: true,
        readPermission: true,
        cleanup: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('GCS connection test failed:', error);

    // Provide specific error messages for common issues
    let userFriendlyMessage = error.message;
    let suggestion = 'Check the setup guide for troubleshooting steps.';

    if (error.message.includes('The caller does not have permission')) {
      userFriendlyMessage = 'Permission denied - service account lacks required permissions';
      suggestion = 'Ensure your service account has Storage Admin or Storage Object Admin role.';
    } else if (error.message.includes('invalid_grant')) {
      userFriendlyMessage = 'Invalid service account credentials';
      suggestion = 'Check that your service account key is valid and not expired.';
    } else if (error.message.includes('Not Found')) {
      userFriendlyMessage = 'Bucket or project not found';
      suggestion = 'Verify your project ID and bucket name are correct.';
    }

    return NextResponse.json({
      error: userFriendlyMessage,
      details: error.message,
      suggestion,
      troubleshooting: {
        checkEnvVars: 'Verify GCP_PROJECT_ID, GCP_BUCKET_NAME are set',
        checkCredentials: 'Verify service account key is valid',
        checkPermissions: 'Ensure service account has Storage Admin role',
        checkBucket: 'Verify bucket exists and is in the correct project'
      }
    }, { status: 500 });
  }
}