import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationInput {
  id: string;
  title: string;
  projected_savings: number;
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  evidence: string[];
  current_cost: number;
  category: string;
}

interface PriorityRanking {
  id: string;
  priority: number;
  confidence: number;
  reasoning: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recommendations } = await req.json() as { recommendations: RecommendationInput[] };
    
    if (!recommendations || recommendations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No recommendations provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the prompt with recommendation data
    const recSummary = recommendations.map((r, i) => 
      `${i + 1}. ID: ${r.id}
   Title: ${r.title}
   Savings: $${r.projected_savings}/mo (from $${r.current_cost}/mo)
   Effort: ${r.effort}, Risk: ${r.risk}
   Category: ${r.category}
   Evidence: ${r.evidence.slice(0, 2).join('; ')}`
    ).join('\n\n');

    const systemPrompt = `You are a cloud cost optimization expert. Analyze the following cost optimization recommendations and prioritize them based on:
1. ROI (savings relative to effort)
2. Risk level (prefer lower risk)
3. Quick wins (low effort, high impact first)
4. Dependencies (some changes enable others)

Consider these effort/risk weights:
- Low effort = 1, Medium = 2, High = 3
- Low risk = 1, Medium = 2, High = 3
- Higher savings with lower effort+risk = higher priority

Provide a prioritized ranking with confidence scores (0-100) and brief reasoning for each recommendation.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please prioritize these ${recommendations.length} recommendations:\n\n${recSummary}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'prioritize_recommendations',
              description: 'Return prioritized recommendations with rankings, confidence scores, and reasoning',
              parameters: {
                type: 'object',
                properties: {
                  rankings: {
                    type: 'array',
                    description: 'Array of recommendation rankings ordered by priority (highest first)',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', description: 'The recommendation ID' },
                        priority: { type: 'number', description: 'Priority rank (1 = highest priority)' },
                        confidence: { type: 'number', description: 'Confidence score 0-100' },
                        reasoning: { type: 'string', description: 'Brief explanation for this ranking (1-2 sentences)' }
                      },
                      required: ['id', 'priority', 'confidence', 'reasoning'],
                      additionalProperties: false
                    }
                  },
                  summary: {
                    type: 'string',
                    description: 'Overall recommendation summary (2-3 sentences on best approach)'
                  }
                },
                required: ['rankings', 'summary'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'prioritize_recommendations' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway returned ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'prioritize_recommendations') {
      throw new Error('Unexpected AI response format');
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Validate and normalize rankings
    const rankings: PriorityRanking[] = result.rankings.map((r: any, index: number) => ({
      id: r.id,
      priority: r.priority || index + 1,
      confidence: Math.min(100, Math.max(0, r.confidence || 70)),
      reasoning: r.reasoning || 'Prioritized based on ROI and risk analysis.'
    }));

    // Sort by priority
    rankings.sort((a, b) => a.priority - b.priority);

    return new Response(
      JSON.stringify({
        rankings,
        summary: result.summary || 'Focus on quick wins with high ROI first, then tackle larger optimizations.',
        prioritizedIds: rankings.map(r => r.id)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI prioritize error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fallback: true 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
