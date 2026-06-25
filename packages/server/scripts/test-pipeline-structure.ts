async function testPipelineStructure() {
  console.log('=== Pipeline Structure Test ===\n');

  console.log('Testing POST /api/novels/1/chapters/pipeline ...');
  
  const startResponse = await fetch('http://localhost:3000/api/novels/1/chapters/pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  console.log('Status:', startResponse.status);
  console.log('Content-Type:', startResponse.headers.get('content-type'));
  console.log('X-Pipeline-Id:', startResponse.headers.get('x-pipeline-id'));

  const pipelineId = startResponse.headers.get('X-Pipeline-Id');

  const reader = startResponse.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const events: { type: string; data: any }[] = [];

  if (reader) {
    const timeout = setTimeout(() => {
      reader.cancel();
    }, 15000);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const eventStrs = buffer.split('\n\n');
        buffer = eventStrs.pop() || '';

        for (const eventStr of eventStrs) {
          if (!eventStr.trim()) continue;

          const lines = eventStr.split('\n');
          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7);
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);
            }
          }

          let parsedData: any = eventData;
          try {
            parsedData = JSON.parse(eventData);
          } catch {}

          events.push({ type: eventType, data: parsedData });
          console.log(`  Received event: ${eventType}`);
        }
      }
    } catch {
    } finally {
      clearTimeout(timeout);
    }
  }

  console.log('\nEvent sequence:');
  for (const e of events) {
    console.log(`  - ${e.type}`);
  }

  const hasPlanning = events.some(e => e.type === 'phase' && e.data.phase === 'planning');
  const hasOutline = events.some(e => e.type === 'outline');
  const hasAwaiting = events.some(e => e.type === 'phase' && e.data.phase === 'awaiting_approval');
  const hasError = events.some(e => e.type === 'error');

  console.log('\n=== Results ===');
  console.log('Pipeline ID present:', !!pipelineId);
  console.log('phase(planning) event:', hasPlanning);
  console.log('outline event:', hasOutline);
  console.log('phase(awaiting_approval) event:', hasAwaiting);
  console.log('error event:', hasError);

  if (pipelineId) {
    console.log('\nTesting GET /api/novels/1/chapters/pipeline/status ...');
    const statusResp = await fetch(
      `http://localhost:3000/api/novels/1/chapters/pipeline/status?pipeline_id=${pipelineId}`
    );
    const statusData = await statusResp.json();
    console.log('Status:', JSON.stringify(statusData, null, 2));
  }

  const success = !!pipelineId && hasPlanning;
  console.log('\n' + (success ? '✅ Pipeline structure test PASSED' : '❌ Pipeline structure test FAILED'));
  process.exit(success ? 0 : 1);
}

testPipelineStructure().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
