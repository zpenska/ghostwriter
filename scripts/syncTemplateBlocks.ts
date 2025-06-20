// scripts/syncTemplateBlocks.ts
import 'dotenv/config'; // ✅ FORCE .env to load before anything else
import { db } from '@/lib/firebase/config';
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore';

function toPascalCaseId(name: string): string {
  return name
    .replace(/[^\w\s]/g, '') // remove emojis or punctuation
    .replace(/\s+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^./, str => str.toUpperCase())
    .replace(/\s/g, '');
}

async function syncBlocksToTemplates() {
  const blocksSnapshot = await getDocs(collection(db, 'blocks'));
  const templatesSnapshot = await getDocs(collection(db, 'templates'));

  const allBlocks = blocksSnapshot.docs.map(blockDoc => {
    const data = blockDoc.data();
    const name = data.name;
    const tags = data.tags || [];
    return {
      id: toPascalCaseId(name),
      label: `📄 ${name}`,
      tags: tags
    };
  });

  for (const templateDoc of templatesSnapshot.docs) {
    const templateId = templateDoc.id;
    const templateData = templateDoc.data();
    const content = templateData.content || '';

    const foundBlocks = allBlocks.filter(block =>
      content.includes(block.label)
    );

    const tagSet = new Set<string>();
    foundBlocks.forEach(block => {
      block.tags.forEach(tag => tagSet.add(tag));
    });

    const tags = Array.from(tagSet);

    await updateDoc(doc(db, 'templates', templateId), {
      blocks: foundBlocks.map(({ id, label }) => ({ id, label })),
      tags
    });

    console.log(`✅ Updated template ${templateId} with ${foundBlocks.length} blocks and tags:`, tags);
  }
}

syncBlocksToTemplates().catch(err => console.error('❌ Error:', err));
