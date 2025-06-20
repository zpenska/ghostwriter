import { db } from './config';
import { collection, getDocs, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

export async function getLogicEdges(templateId: string) {
  const snapshot = await getDocs(
    collection(db, 'templates', templateId, 'logic-edges')
  );

  return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
