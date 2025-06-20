// ghostwriter-campaign-setup.js
// READY TO RUN - No changes needed!
// Save this file and run: node ghostwriter-campaign-setup.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

// Your Ghostwriter Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDVfVK2_FVdJZbYJzbiq1MUOOVPiY5EGqc",
  authDomain: "ghostwriter-e14a2.firebaseapp.com",
  projectId: "ghostwriter-e14a2",
  storageBucket: "ghostwriter-e14a2.firebasestorage.app",
  messagingSenderId: "187529387980",
  appId: "1:187529387980:web:5370fa77a755fac4c08769"
};

// Initialize Firebase
console.log('🔥 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupGhostwriterCampaigns() {
  console.log('🚀 Setting up Ghostwriter campaign data...\n');

  try {
    // Step 1: Create Campaign Templates
    console.log('📄 Creating campaign templates...');
    
    const diabetesTemplate = await addDoc(collection(db, 'campaign-templates'), {
      name: "Diabetes Care Gap Outreach",
      description: "Outreach for members missing HbA1c tests and diabetes care gaps",
      status: "active",
      linkedTemplateId: "diabetes_template_001", // Update this to match your actual Ghostwriter template IDs
      deliveryMethod: "lob",
      defaultSenderName: "Ghostwriter Care Team",
      defaultReplyEmail: "care@ghostwriter.com", // Update with your email
      createdBy: "system@ghostwriter.com",
      createdAt: Timestamp.now()
    });
    console.log(`✅ Diabetes template: ${diabetesTemplate.id}`);

    const preventiveTemplate = await addDoc(collection(db, 'campaign-templates'), {
      name: "Preventive Care Reminder",
      description: "Annual wellness visits and preventive care reminders",
      status: "active",
      linkedTemplateId: "preventive_template_001", // Update this
      deliveryMethod: "fax",
      defaultSenderName: "Ghostwriter Wellness Team",
      defaultReplyEmail: "wellness@ghostwriter.com", // Update with your email
      createdBy: "system@ghostwriter.com",
      createdAt: Timestamp.now()
    });
    console.log(`✅ Preventive care template: ${preventiveTemplate.id}`);

    const medicationTemplate = await addDoc(collection(db, 'campaign-templates'), {
      name: "Medication Adherence Follow-up",
      description: "Follow-up letters for medication compliance and adherence",
      status: "active",
      linkedTemplateId: "medication_template_001", // Update this
      deliveryMethod: "lob",
      defaultSenderName: "Ghostwriter Pharmacy Team",
      defaultReplyEmail: "pharmacy@ghostwriter.com", // Update with your email  
      createdBy: "system@ghostwriter.com",
      createdAt: Timestamp.now()
    });
    console.log(`✅ Medication template: ${medicationTemplate.id}`);

    // Step 2: Create Sample Populations
    console.log('\n👥 Creating sample populations...');
    
    await addDoc(collection(db, 'populations'), {
      populationId: "DIAHIGHRISK",
      populationName: "Diabetes High Risk Members",
      visibilityLevel: "1 (Not Restricted)",
      addedFilters: 3,
      estimatedSize: 1543,
      lastRunAt: Timestamp.now(),
      sourceSystem: "Population Builder"
    });
    console.log('✅ Diabetes population created');

    await addDoc(collection(db, 'populations'), {
      populationId: "PREVCARE",
      populationName: "Preventive Care Due",
      visibilityLevel: "2 (Restricted)",
      addedFilters: 2,
      estimatedSize: 892,
      lastRunAt: Timestamp.now(),
      sourceSystem: "Population Builder"
    });
    console.log('✅ Preventive care population created');

    await addDoc(collection(db, 'populations'), {
      populationId: "MEDADHERE",
      populationName: "Medication Non-Adherent",
      visibilityLevel: "1 (Not Restricted)",
      addedFilters: 4,
      estimatedSize: 674,
      lastRunAt: Timestamp.now(),
      sourceSystem: "Population Builder"
    });
    console.log('✅ Medication adherence population created');

    // Step 3: Create Sample Campaign Events (realistic timeline)
    console.log('\n📊 Creating campaign events...');

    // Successful diabetes campaign from 3 days ago
    await addDoc(collection(db, 'campaign-events'), {
      campaignId: diabetesTemplate.id,
      populationId: "DIAHIGHRISK",
      memberCount: 1245,
      triggeredBy: "Manual",
      status: "sent",
      deliveryMethod: "lob",
      docVaultGroupId: "group_diabetes_2025_001",
      sentAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))
    });
    console.log('✅ Diabetes campaign (sent) - 3 days ago');

    // Queued preventive care campaign from yesterday
    await addDoc(collection(db, 'campaign-events'), {
      campaignId: preventiveTemplate.id,
      populationId: "PREVCARE",
      memberCount: 756,
      triggeredBy: "Rules Builder",
      status: "queued", 
      deliveryMethod: "fax",
      docVaultGroupId: "group_preventive_2025_001",
      sentAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000))
    });
    console.log('✅ Preventive care campaign (queued) - 1 day ago');

    // Failed medication campaign from 8 hours ago
    await addDoc(collection(db, 'campaign-events'), {
      campaignId: medicationTemplate.id,
      populationId: "MEDADHERE",
      memberCount: 674,
      triggeredBy: "Manual",
      status: "error",
      deliveryMethod: "lob",
      errorMessage: "Address validation failed for 89 members", 
      sentAt: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000))
    });
    console.log('✅ Medication campaign (error) - 8 hours ago');

    // Another diabetes campaign that was cancelled
    await addDoc(collection(db, 'campaign-events'), {
      campaignId: diabetesTemplate.id,
      populationId: "DIAHIGHRISK", 
      memberCount: 1543,
      triggeredBy: "Rules Builder",
      status: "cancelled",
      deliveryMethod: "lob",
      sentAt: Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000))
    });
    console.log('✅ Diabetes campaign (cancelled) - 6 hours ago');

    // Recent successful preventive care campaign
    await addDoc(collection(db, 'campaign-events'), {
      campaignId: preventiveTemplate.id,
      populationId: "PREVCARE",
      memberCount: 892,
      triggeredBy: "Manual",
      status: "sent",
      deliveryMethod: "fax", 
      docVaultGroupId: "group_preventive_2025_002",
      sentAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000))
    });
    console.log('✅ Preventive care campaign (sent) - 2 hours ago');

    console.log('\n🎉 SUCCESS! Ghostwriter campaign data is ready!');
    console.log('\n📊 Campaign Dashboard Summary:');
    console.log('• 3 Campaign Templates');
    console.log('• 3 Member Populations');
    console.log('• 5 Campaign Events (mix of statuses)');
    
    console.log('\n💡 What you can test now:');
    console.log('1. 📈 Analytics cards with real numbers');
    console.log('2. 🔍 Search campaigns by name/population');
    console.log('3. 🏷️  Filter by status, delivery method, trigger type');
    console.log('4. ↕️  Sort by any column');
    console.log('5. ✅ Select campaigns for bulk actions');
    console.log('6. ⚙️  Individual campaign actions (retry, cancel, view)');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Start your app: npm run dev');
    console.log('2. Sign in to Ghostwriter');
    console.log('3. Navigate to /campaigns');
    console.log('4. Your dashboard should be fully functional!');
    
    console.log('\n🔗 Pro Tip:');
    console.log('Update the linkedTemplateId values above to match your actual');
    console.log('Ghostwriter template IDs for full integration.');

  } catch (error) {
    console.error('\n❌ SETUP FAILED:', error.message);
    console.error('\n🔧 Troubleshooting Steps:');
    console.error('1. Make sure you are signed in to Ghostwriter');
    console.error('2. Check Firestore security rules allow authenticated writes');
    console.error('3. Verify Firebase project is active and Firestore is enabled');
    console.error('4. Try running: npm install firebase');
    console.error('\n📋 Firestore Rules should include:');
    console.error('allow read, write: if request.auth != null;');
  }
}

// Run the Ghostwriter campaign setup
console.log('🎯 Ghostwriter Campaign Setup Starting...\n');
setupGhostwriterCampaigns()
  .then(() => {
    console.log('\n✅ Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });