import { useRouter } from 'next/router';
import LogicCanvas from '@/components/logic-builder/LogicCanvas';
import LogicSidebar from '@/components/logic-builder/LogicSidebar';

export default function LogicBuilderPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return (
      <div className="h-screen w-full flex items-center justify-center text-zinc-500">
        Loading template...
      </div>
    );
  }

  const templateId = id;

  return (
    <div className="h-screen w-full bg-white">
      <div className="flex h-full overflow-hidden">
        <LogicSidebar templateId={templateId} />
        <LogicCanvas templateId={templateId} />
      </div>
    </div>
  );
}
