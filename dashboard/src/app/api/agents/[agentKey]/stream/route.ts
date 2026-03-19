import { NextRequest } from 'next/server';

const KHANATE_API = process.env.KHANATE_API_URL || 'http://host.docker.internal:19100';

export const dynamic = 'force-dynamic';

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
  let isConnected = true;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`event: connected\ndata: {"agentKey":"${agentKey}"}\n\n`));

      // Poll for updates every 2 seconds
      const poll = async () => {
        if (!isConnected) return;

        try {
          // Fetch logs
          const logsUrl = `${KHANATE_API}/agent/logs?worldId=${worldId}&envId=${envId}&projectId=${projectId}&agentId=${agentId}&limit=100`;
          const logsRes = await fetch(logsUrl);
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
          const statusRes = await fetch(statusUrl);
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

          // Send heartbeat
          controller.enqueue(encoder.encode(`:heartbeat\n\n`));

        } catch (error) {
          console.error('SSE poll error:', error);
        }

        // Continue polling
        if (isConnected) {
          setTimeout(poll, 2000);
        }
      };

      // Start polling
      poll();
    },
    cancel() {
      isConnected = false;
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
