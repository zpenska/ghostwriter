'use client';

import { useParams } from 'next/navigation';
import LogicCanvas from '@/components/logic-builder/LogicCanvas';
import LogicSidebar from '@/components/logic-builder/LogicSidebar';
import CasperLogicWidget from '@/components/logic-builder/CasperLogicWidget';

export default function LogicBuilderPage() {
  const params = useParams();
  const templateId = String(params.id);

  return (
    <div className="h-screen w-full bg-white relative">
      <div className="flex h-full overflow-hidden">
        <LogicSidebar templateId={templateId} />
        <LogicCanvas templateId={templateId} />
      </div>
      <CasperLogicWidget templateId={templateId} />
    </div>
  );
}
