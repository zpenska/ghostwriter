import { doc, setDoc, addDoc, collection } from 'firebase/firestore';

interface SaveTemplateParams {
  templateId: string | null;
  content: string;
  otherData: any;
}

export async function saveTemplate({ templateId, content, otherData }: SaveTemplateParams): Promise<string> {
  const { db } = await import('@/lib/firebase/config');
  
  const templateData = {
    ...otherData,
    content,
    updatedAt: new Date(),
  };

  try {
    if (templateId) {
      // Update existing template
      await setDoc(doc(db, 'templates', templateId), templateData, { merge: true });
      console.log('✅ Template updated with blocks and tags');
      return templateId;
    } else {
      // Create new template
      templateData.createdAt = new Date();
      const docRef = await addDoc(collection(db, 'templates'), templateData);
      console.log('✅ New template created with blocks and tags');
      return docRef.id;
    }
  } catch (error) {
    console.error('❌ Error saving template:', error);
    throw error;
  }
}