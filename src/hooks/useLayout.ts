'use client';

import { useEffect } from 'react';
import { stratify, tree, HierarchyPointNode } from 'd3-hierarchy';
import { timer } from 'd3-timer';
import { Node } from 'reactflow';

interface LayoutOptions {
  nodes: Node[];
  edges: { source: string; target: string }[];
  setNodes: (fn: (nodes: Node[]) => Node[]) => void;
  duration?: number;
}

export default function useLayout({
  nodes,
  edges,
  setNodes,
  duration = 300,
}: LayoutOptions) {
  useEffect(() => {
    if (!nodes.length) return;

    const layoutTree = tree<HierarchyPointNode<Node>>().nodeSize([200, 150]);

    const hierarchy = stratify<Node>()
      .id((d: Node) => d.id)
      .parentId((d: Node) => edges.find((e) => e.target === d.id)?.source)(nodes);

    const root = layoutTree(hierarchy as any);
    const positions = root.descendants().map((d: HierarchyPointNode<Node>) => ({
      ...d.data,
      position: { x: d.x, y: d.y },
    }));

    const t = timer((elapsed: number) => {
      const s = Math.min(1, elapsed / duration);

      const animated = positions.map(({ id, position, ...rest }: any) => {
        const original = nodes.find((n) => n.id === id);
        const from = original?.position || position;

        return {
          id,
          ...rest,
          position: {
            x: from.x + (position.x - from.x) * s,
            y: from.y + (position.y - from.y) * s,
          },
        };
      });

      setNodes(() => animated);

      if (elapsed > duration) {
        setNodes(() =>
          positions.map(({ id, position, ...rest }: any) => ({
            id,
            ...rest,
            position,
          }))
        );
        t.stop();
      }
    });

    return () => t.stop();
  }, [nodes.length, edges.length]);
}
