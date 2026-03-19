import { NextRequest, NextResponse } from 'next/server';

const KHANATE_API = process.env.KHANATE_API_URL || 'http://localhost:19100';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentKey: string }> }
) {
  try {
    const { message } = await request.json();
    const { agentKey: rawKey } = await params;
    const agentKey = decodeURIComponent(rawKey);
    const [worldId, envId, projectId, agentId] = agentKey.split('/');

    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 });
    }

    // First, spawn/ensure agent is running and send task
    const spawnRes = await fetch(`${KHANATE_API}/agent/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        worldId,
        envId,
        projectId,
        agentId,
        task: message.trim(),
      }),
    });

    const spawnData = await spawnRes.json();

    if (!spawnData.success) {
      return NextResponse.json({ 
        success: false, 
        error: spawnData.error || 'Failed to send message' 
      });
    }

    // Extract reply from clawdbot result
    const clawdbotResult = spawnData.data?.clawdbot_result;
    
    if (clawdbotResult?.success) {
      // Try to extract text response
      let reply = '';
      
      if (clawdbotResult.data?.raw) {
        reply = clawdbotResult.data.raw;
      } else if (typeof clawdbotResult.data === 'string') {
        reply = clawdbotResult.data;
      } else if (clawdbotResult.message) {
        reply = clawdbotResult.message;
      }

      // Parse JSON response if needed
      if (reply) {
        try {
          const parsed = JSON.parse(reply);
          if (parsed.reply) {
            reply = parsed.reply;
          } else if (parsed.content) {
            reply = parsed.content;
          } else if (parsed.text) {
            reply = parsed.text;
          }
        } catch {
          // Not JSON, use as-is
        }
      }

      if (reply) {
        return NextResponse.json({ success: true, reply });
      }
    }

    // Check if we have any response text
    if (spawnData.action === 'sent_to_existing' || spawnData.action === 'spawned') {
      // Message was sent, try to get latest log as response
      const logsRes = await fetch(
        `${KHANATE_API}/agent/logs?worldId=${worldId}&envId=${envId}&projectId=${projectId}&agentId=${agentId}&limit=1`
      );
      const logsData = await logsRes.json();
      
      if (logsData.success && logsData.data?.logs?.length > 0) {
        const lastLog = logsData.data.logs[logsData.data.logs.length - 1];
        if (lastLog.role === 'assistant') {
          return NextResponse.json({ success: true, reply: lastLog.content });
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        reply: 'Mesaj gönderildi. Cevap için Logs sekmesini kontrol edin.' 
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Beklenmedik yanıt formatı' 
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
