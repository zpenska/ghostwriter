import { db } from './config';
import {
  addDoc,
  setDoc,
  doc,
  collection,
  Timestamp,
} from 'firebase/firestore';

export interface SaveLogicNodeInput {
  templateId: string;
  logic: Record<string, any>;
  nodeType: string;
  nodeId?: string;
  experimental?: boolean;
}

export async function saveLogicNode({
  templateId,
  logic,
  nodeType,
  nodeId,
  experimental = false,
}: SaveLogicNodeInput): Promise<string> {
  const path = collection(db, 'templates', templateId, 'logic-nodes');

  const data = {
    ...logic,
    type: nodeType,
    experimental,
    createdAt: Timestamp.now(),
  };

  if (nodeId) {
    await setDoc(doc(path, nodeId), data, { merge: true });
    return nodeId;
  } else {
    const ref = await addDoc(path, data);
    return ref.id;
  }
}
