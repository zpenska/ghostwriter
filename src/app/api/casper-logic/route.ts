// src/app/api/casper-logic/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getCasperVariableContext } from '@/lib/firebase/loaders/getCasperVariableContext';
import { getBlockContext } from '@/lib/firebase/loaders/getBlockContext';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function classifyTask(prompt: string): 'review' | 'suggest' | 'edit' | 'build' {
  const lower = prompt.toLowerCase();
  if (lower.includes('improve') || lower.includes('optimize') || lower.includes('recommend')) return 'suggest';
  if (lower.includes('check') || lower.includes('compliance') || lower.includes('quality') || lower.includes('errors')) return 'review';
  if (lower.includes('change') || lower.includes('update') || lower.includes('modify') || lower.includes('replace')) return 'edit';
  return 'build';
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, templateId } = await req.json();

    if (!prompt || !templateId) {
      return NextResponse.json({ error: 'Missing prompt or templateId' }, { status: 400 });
    }

    const taskType = classifyTask(prompt);
    const variables = await getCasperVariableContext();
    const blocks = await getBlockContext();

    const variableContext = variables.map(v => `{{${v.key}}}: ${v.name} - ${v.description}`).join('\n');
    const blockContext = blocks.map(b => `${b.id}: ${b.name} (${b.category})`).join('\n');

    const systemPrompt = `
You are Casper, a healthcare logic-building AI assistant.

You support the following tasks:
1. Build: Generate logic from plain English (default mode)
2. Edit: Modify or replace existing logic
3. Suggest: Recommend new rules to enhance compliance or performance
4. Review: Identify logic quality, compliance, or redundancy issues

Use ONLY these variables:\n${variableContext}

Use ONLY these blocks:\n${blockContext}

Use node types: start, condition, block, loop, stop, formatting, expression

Respond as follows:
- For 'build' or 'edit': return valid JSON with nodes[] and edges[]
- For 'review': return { "mode": "review", "issues": [ { nodeId?, description } ] }
- For 'suggest': return { "mode": "suggest", "suggestions": [ { description, category } ] }

DO NOT insert blocks or variables not listed.
Do NOT return markdown or commentary.
`;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });

    const raw = chat.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return NextResponse.json({ error: 'No AI response' }, { status: 500 });
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!parsed) {
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 });
    }

    if (parsed.nodes && parsed.edges) {
      // BUILD / EDIT LOGIC
      const logicData = {
        nodes: parsed.nodes,
        edges: parsed.edges,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: 'casper-ai'
      };

      const templateRef = doc(db, 'templates', templateId);
      const snap = await getDoc(templateRef);

      if (!snap.exists()) {
        await setDoc(templateRef, { logic: logicData });
      } else {
        await updateDoc(templateRef, {
          'logic.nodes': parsed.nodes,
          'logic.edges': parsed.edges,
          'logic.updatedAt': new Date().toISOString(),
          'logic.lastModifiedBy': 'casper-ai'
        });
      }

      return NextResponse.json({
        success: true,
        message: `Saved ${parsed.nodes.length} nodes and ${parsed.edges.length} edges`,
        nodes: parsed.nodes,
        edges: parsed.edges
      });
    }

    if (parsed.mode === 'review' && parsed.issues) {
      return NextResponse.json({
        success: true,
        mode: 'review',
        issues: parsed.issues
      });
    }

    if (parsed.mode === 'suggest' && parsed.suggestions) {
      return NextResponse.json({
        success: true,
        mode: 'suggest',
        suggestions: parsed.suggestions
      });
    }

    return NextResponse.json({ error: 'No valid output returned by AI.' }, { status: 500 });

  } catch (err: any) {
    console.error('💥 Casper AI error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
