import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getCasperVariableContext } from '@/lib/firebase/loaders/getCasperVariableContext';
import { getBlockContext } from '@/lib/firebase/loaders/getBlockContext';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { prompt, templateId } = await req.json();

    if (!prompt || !templateId) {
      return NextResponse.json({ error: 'Missing prompt or templateId' }, { status: 400 });
    }

    // Load enhanced variables and blocks
    const variables = await getCasperVariableContext();
    const blocks = await getBlockContext();

    const variableContext = variables
      .map(v => `{{${v.key}}}: ${v.name} - ${v.description}`)
      .join('\n');

    const blockContext = blocks
      .map(b => `${b.id}: ${b.name} (${b.category})`)
      .join('\n');

    const systemPrompt = `
You are Casper, a healthcare logic-building assistant.
The user is building a letter rules engine using React Flow Pro.

Your job is to return a valid JSON of nodes[] and edges[] representing business logic.

You MUST:
- Use only these variables:\n${variableContext}
- Use only these blocks:\n${blockContext}
- Use these node types: start, condition, action, stop
- Use custom edges with label "Yes" or "No"
- Add unique IDs like "node-1", "node-2", etc.
- Include 'position' for each node (grid-style x/y coordinates, spacing nodes 250px apart)
- Include a short 'label' on each node
- Each node's .data must include 'label', and if applicable:
  - 'condition' for condition nodes
  - 'actionType' and 'targetId' for action nodes
  - 'explanation' for clarity

ALWAYS start with a start node and end with a stop node for complete flows.

Output ONLY JSON. No commentary or markdown.

Example prompt: "If member.language is 'es', insert the Spanish footer block."

Respond with:
{
  "nodes": [
    {
      "id": "node-1",
      "type": "start", 
      "position": { "x": 0, "y": 0 },
      "data": { "label": "Start" }
    },
    {
      "id": "node-2",
      "type": "condition",
      "position": { "x": 0, "y": 100 },
      "data": {
        "label": "Language Check",
        "condition": "member.language === 'es'"
      }
    },
    {
      "id": "node-3", 
      "type": "action",
      "position": { "x": 250, "y": 100 },
      "data": {
        "label": "Insert Spanish Footer",
        "actionType": "insertBlock",
        "targetId": "SpanishFooter"
      }
    },
    {
      "id": "node-4",
      "type": "stop",
      "position": { "x": 250, "y": 200 },
      "data": { "label": "Stop" }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2", 
      "type": "custom",
      "label": "→"
    },
    {
      "id": "edge-2",
      "source": "node-2",
      "target": "node-3",
      "type": "custom", 
      "label": "Yes"
    },
    {
      "id": "edge-3",
      "source": "node-3", 
      "target": "node-4",
      "type": "custom",
      "label": "→"
    }
  ]
}
`;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });

    const raw = chat.choices?.[0]?.message?.content?.trim();

    if (!raw) {
      return NextResponse.json({ error: 'No AI response' }, { status: 500 });
    }

    // Extract JSON from response
    const match = raw.match(/\{[\s\S]*\}/);
    const json = match ? JSON.parse(match[0]) : null;

    if (!json || !json.nodes || !json.edges) {
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 });
    }

    // 🔥 FIXED: Save to single document instead of separate collections
    // OLD (4 segments - invalid): templates/{templateId}/logic/nodes
    // NEW (3 segments - valid): templates/{templateId}
    
    const templateDocRef = doc(db, 'templates', templateId);
    
    try {
      // Check if document exists first
      const templateDoc = await getDoc(templateDocRef);
      
      if (!templateDoc.exists()) {
        // Create the document if it doesn't exist
        await updateDoc(templateDocRef, {
          logic: {
            nodes: json.nodes,
            edges: json.edges,
            updatedAt: new Date().toISOString(),
            createdBy: 'casper-ai'
          }
        });
      } else {
        // Update existing document
        await updateDoc(templateDocRef, {
          'logic.nodes': json.nodes,
          'logic.edges': json.edges,
          'logic.updatedAt': new Date().toISOString(),
          'logic.lastModifiedBy': 'casper-ai'
        });
      }

      console.log(`✅ Saved ${json.nodes.length} nodes and ${json.edges.length} edges to Firestore`);

    } catch (firestoreError) {
      console.error('❌ Firestore save error:', firestoreError);
      return NextResponse.json({ 
        error: 'Failed to save logic to database',
        details: firestoreError
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      nodes: json.nodes,
      edges: json.edges,
      message: `Logic created with ${json.nodes.length} nodes and ${json.edges.length} edges`
    });

  } catch (err: any) {
    console.error('💥 /api/casper-logic error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}