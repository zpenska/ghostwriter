import { db } from './config';
import { collection, getDocs, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

export async function getLogicNodes(templateId: string) {
  const snapshot = await getDocs(
    collection(db, 'templates', templateId, 'logic-nodes')
  );

  return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
    id: doc.id,
    type: doc.data().type || 'block',
    data: doc.data(),
    position: { x: 0, y: 0 }, // Layout assigns position
  }));
}
