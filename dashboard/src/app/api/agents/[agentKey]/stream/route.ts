import { NextRequest } from 'next/server';

const KHANATE_API = process.env.KHANATE_API_URL || 'http://host.docker.internal:19100';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper to delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentKey: string }> }
) {
  const { agentKey } = await params;
  const [worldId, envId, projectId, agentId] = decodeURIComponent(agentKey).split('/');

  if (!worldId || !envId || !projectId || !agentId) {
    return new Response('Invalid agent key', { status: 400 });
  }

  const encoder = new TextEncoder();
  let lastLogCount = 0;
  let lastStatus = '';

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`event: connected\ndata: {"agentKey":"${agentKey}"}\n\n`));

      // Continuous polling loop
      while (true) {
        try {
          // Fetch logs
          const logsUrl = `${KHANATE_API}/agent/logs?worldId=${worldId}&envId=${envId}&projectId=${projectId}&agentId=${agentId}&limit=100`;
          const logsRes = await fetch(logsUrl, { cache: 'no-store' });
          const logsData = await logsRes.json();

          if (logsData.success && logsData.data?.logs) {
            const logs = logsData.data.logs;
            const newCount = logs.length;

            // Send new logs if any
            if (newCount > lastLogCount) {
              const newLogs = logs.slice(lastLogCount);
              for (const log of newLogs) {
                controller.enqueue(
                  encoder.encode(`event: log\ndata: ${JSON.stringify(log)}\n\n`)
                );
              }
              lastLogCount = newCount;
            }
          }

          // Fetch status
          const statusUrl = `${KHANATE_API}/agent/status?worldId=${worldId}&envId=${envId}&projectId=${projectId}&agentId=${agentId}`;
          const statusRes = await fetch(statusUrl, { cache: 'no-store' });
          const statusData = await statusRes.json();

          if (statusData.success && statusData.agent) {
            const currentStatus = statusData.agent.status;
            if (currentStatus !== lastStatus) {
              controller.enqueue(
                encoder.encode(`event: status\ndata: ${JSON.stringify(statusData.agent)}\n\n`)
              );
              lastStatus = currentStatus;
            }
          }

          // Send heartbeat to keep connection alive
          controller.enqueue(encoder.encode(`:heartbeat\n\n`));

        } catch (error) {
          // Log error but continue polling
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: String(error) })}\n\n`)
          );
        }

        // Wait 2 seconds before next poll
        await sleep(2000);
      }
    },
    cancel() {
      // Connection closed by client
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
