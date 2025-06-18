// migration/migrate-simple.js
// Simple Node.js version - run with: npm run migrate:components-to-blocks

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch 
} = require('firebase/firestore');

// Firebase configuration for ghostwriter-e14a2
const firebaseConfig = {
  apiKey: "AIzaSyDVfVK2_FVdJZbYJzbiq1MUOOVPiY5EGqc",
  authDomain: "ghostwriter-e14a2.firebaseapp.com",
  projectId: "ghostwriter-e14a2",
  storageBucket: "ghostwriter-e14a2.firebasestorage.app",
  messagingSenderId: "187529387980",
  appId: "1:187529387980:web:5370fa77a755fac4c08769"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateComponentsToBlocks() {
  console.log('🔄 Starting migration from components to blocks...');
  
  try {
    // Step 1: Get all documents from the 'components' collection
    console.log('📖 Reading components collection...');
    const componentsRef = collection(db, 'components');
    const componentsSnapshot = await getDocs(componentsRef);
    
    if (componentsSnapshot.empty) {
      console.log('ℹ️ No components found to migrate.');
      console.log('✨ Migration completed - nothing to migrate!');
      return;
    }

    const componentsData = [];
    componentsSnapshot.forEach((doc) => {
      componentsData.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`📊 Found ${componentsData.length} components to migrate.`);

    // Step 2: Create 'blocks' collection with the same data
    console.log('✨ Creating blocks collection...');
    
    // Use batch writes for better performance (max 500 per batch)
    const batchSize = 500;
    const batches = [];
    
    for (let i = 0; i < componentsData.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchData = componentsData.slice(i, i + batchSize);
      
      batchData.forEach((componentData) => {
        const { id, ...dataWithoutId } = componentData;
        const blockDocRef = doc(collection(db, 'blocks'), id);
        batch.set(blockDocRef, dataWithoutId);
      });
      
      batches.push(batch);
    }

    // Execute all batches
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`✅ Batch ${i + 1}/${batches.length} completed.`);
    }

    console.log('✅ Successfully created blocks collection with migrated data.');

    // Step 3: Verify the migration
    console.log('🔍 Verifying migration...');
    const blocksSnapshot = await getDocs(collection(db, 'blocks'));
    console.log(`✅ Verified: ${blocksSnapshot.size} blocks created.`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n⚠️  IMPORTANT: Please verify that your blocks collection is working correctly.');
    console.log('💡 You can manually delete the old "components" collection from the Firebase Console once you\'re confident.');
    console.log('🔗 Firebase Console: https://console.firebase.google.com/');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    // More helpful error messages
    if (error.code === 'permission-denied') {
      console.error('🚫 Permission denied. Check your Firebase security rules.');
    } else if (error.code === 'not-found') {
      console.error('🔍 Collection not found. Make sure the "components" collection exists.');
    } else if (error.message && error.message.includes('apiKey')) {
      console.error('🔑 Invalid Firebase configuration. Please check your config values.');
    }
    
    throw error;
  }
}

// Run the migration
migrateComponentsToBlocks()
  .then(() => {
    console.log('✨ Migration script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });