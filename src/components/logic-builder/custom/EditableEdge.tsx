'use client';

import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from 'reactflow';

export default function EditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, centerX, centerY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onClick = () => {
    alert(`Edge ${id} clicked — you could trigger a rule editor here.`);
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <button
          onClick={onClick}
          className="nodrag nopan absolute transform -translate-x-1/2 -translate-y-1/2 text-xs px-2 py-1 bg-white border border-zinc-300 shadow-sm rounded text-zinc-600 hover:bg-zinc-100"
          style={{ left: centerX, top: centerY }}
        >
          +
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
