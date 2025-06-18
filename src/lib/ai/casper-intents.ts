// src/lib/ai/casper-intents.ts

export const intentExamples = [
    {
      pattern: "Only show this block if the member is Spanish-speaking",
      output: {
        nodes: [
          {
            id: 'node-1',
            type: 'condition',
            position: { x: 0, y: 0 },
            data: {
              label: 'Language Check',
              condition: `member.language === 'es'`,
            },
          },
          {
            id: 'node-2',
            type: 'action',
            position: { x: 250, y: 0 },
            data: {
              label: 'Insert Spanish Footer',
              actionType: 'insertblocks',
              targetId: 'SpanishFooter',
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            label: 'Yes',
            type: 'custom',
          },
        ],
      },
    },
    {
      pattern: "Repeat this block for every claim line",
      output: {
        nodes: [
          {
            id: 'node-1',
            type: 'loop',
            position: { x: 0, y: 0 },
            data: {
              label: 'For Each Line Item',
              arrayPath: 'claim.lines',
            },
          },
          {
            id: 'node-2',
            type: 'action',
            position: { x: 250, y: 0 },
            data: {
              label: 'Insert Line Item Block',
              actionType: 'insertblocks',
              targetId: 'LineItemRow',
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            label: 'Loop',
            type: 'custom',
          },
        ],
      },
    },
    {
      pattern: "Insert paragraph if member is under 18",
      output: {
        nodes: [
          {
            id: 'node-1',
            type: 'condition',
            position: { x: 0, y: 0 },
            data: {
              label: 'Check Age',
              condition: `member.age < 18`,
            },
          },
          {
            id: 'node-2',
            type: 'action',
            position: { x: 250, y: 0 },
            data: {
              label: 'Insert Pediatric Note',
              actionType: 'insertblocks',
              targetId: 'Under18Notice',
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            label: 'Yes',
            type: 'custom',
          },
        ],
      },
    },
    {
      pattern: "Use Spanish version if language = ES",
      output: {
        nodes: [
          {
            id: 'node-1',
            type: 'condition',
            position: { x: 0, y: 0 },
            data: {
              label: 'Language Match',
              condition: `member.language === 'es'`,
            },
          },
          {
            id: 'node-2',
            type: 'action',
            position: { x: 250, y: 0 },
            data: {
              label: 'Insert Spanish blocks',
              actionType: 'insertblocks',
              targetId: 'Spanishblocks',
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            label: 'Yes',
            type: 'custom',
          },
        ],
      },
    },
  ];
  