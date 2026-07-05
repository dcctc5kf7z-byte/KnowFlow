// Supabase Edge Function: sync
// Handles data synchronization between client and server

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { entries, nodes, links, lastSyncAt } = await req.json();

    // TODO: Implement sync logic
    // For now, return mock response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          syncedEntries: entries?.map((e: { id: string }) => e.id) || [],
          syncedNodes: nodes?.map((n: { id: string }) => n.id) || [],
          syncedLinks: links?.map((l: { id: string }) => l.id) || [],
          conflicts: [],
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'ERROR', message: String(error) } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
