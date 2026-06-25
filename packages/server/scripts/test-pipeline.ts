async function testPipeline() {
  console.log('=== Pipeline Test ===\n');

  console.log('Step 1: Start pipeline (planning phase)...');
  const startResponse = await fetch('http://localhost:3000/api/novels/1/chapters/pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const pipelineId = startResponse.headers.get('X-Pipeline-Id');
  console.log('Pipeline ID:', pipelineId);

  const reader = startResponse.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let pipelineStarted = false;
  let gotOutline = false;
  let gotAwaitingApproval = false;

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const eventStr of events) {
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

        if (eventType === 'phase') {
          const data = JSON.parse(eventData);
          console.log(`  [phase] ${data.phase} (${data.status})`);
          if (data.phase === 'planning') pipelineStarted = true;
          if (data.phase === 'awaiting_approval') gotAwaitingApproval = true;
        } else if (eventType === 'outline') {
          const data = JSON.parse(eventData);
          console.log(`  [outline] ${data.chapter_outline?.title || '无标题'}`);
          console.log(`    摘要: ${data.chapter_outline?.summary?.substring(0, 80)}...`);
          gotOutline = true;
        } else if (eventType === 'error') {
          const data = JSON.parse(eventData);
          console.error('  [error]', data.message);
        }
      }

      if (gotAwaitingApproval) {
        break;
      }
    }
  }

  console.log('\nStep 1 result:');
  console.log('  Pipeline started:', pipelineStarted);
  console.log('  Got outline:', gotOutline);
  console.log('  Awaiting approval:', gotAwaitingApproval);

  if (!pipelineId || !gotAwaitingApproval) {
    console.error('\nPipeline failed to reach awaiting_approval phase');
    process.exit(1);
  }

  console.log('\nStep 2: Approve pipeline...');
  const approveResponse = await fetch('http://localhost:3000/api/novels/1/chapters/pipeline/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pipeline_id: pipelineId, approved: true }),
  });

  const approveReader = approveResponse.body?.getReader();
  let approveBuffer = '';
  let gotComposing = false;
  let gotWriting = false;
  let gotFastAudit = false;
  let gotDeepAudit = false;
  let gotDone = false;
  let tokenCount = 0;

  if (approveReader) {
    while (true) {
      const { done, value } = await approveReader.read();
      if (done) break;

      approveBuffer += decoder.decode(value, { stream: true });
      const events = approveBuffer.split('\n\n');
      approveBuffer = events.pop() || '';

      for (const eventStr of events) {
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

        if (eventType === 'phase') {
          const data = JSON.parse(eventData);
          console.log(`  [phase] ${data.phase} (${data.status})`);
          if (data.phase === 'composing') gotComposing = true;
          if (data.phase === 'writing') gotWriting = true;
          if (data.phase === 'fast_audit') gotFastAudit = true;
          if (data.phase === 'deep_audit') gotDeepAudit = true;
        } else if (eventType === 'token') {
          const token = JSON.parse(eventData);
          tokenCount += token.length;
          if (tokenCount <= 200) {
            process.stdout.write(token);
          } else if (tokenCount === token.length + 200 || tokenCount < 200) {
            console.log('... (more tokens)');
          }
        } else if (eventType === 'audit_fast') {
          const data = JSON.parse(eventData);
          console.log(`\n  [audit_fast] score: ${data.score}, passed: ${data.passed}`);
        } else if (eventType === 'audit_deep') {
          const data = JSON.parse(eventData);
          console.log(`  [audit_deep] overall_score: ${data.overall_score}`);
          console.log(`    角色一致性: ${data.scores.character_consistency}`);
          console.log(`    情节逻辑: ${data.scores.plot_logic}`);
          console.log(`    AI味: ${data.scores.ai_taste}`);
          console.log(`    叙事节奏: ${data.scores.pacing}`);
          console.log(`    风格匹配: ${data.scores.style_match}`);
        } else if (eventType === 'done') {
          const data = JSON.parse(eventData);
          console.log(`  [done] chapter_id: ${data.chapter_id}, total_tokens: ${data.total_tokens}`);
          gotDone = true;
        } else if (eventType === 'error') {
          const data = JSON.parse(eventData);
          console.error('  [error]', data.message);
        }
      }
    }
  }

  console.log('\n=== Test Summary ===');
  console.log('Pipeline ID:', pipelineId);
  console.log('Phase reached:', gotDone ? 'done' : (gotDeepAudit ? 'deep_audit' : (gotFastAudit ? 'fast_audit' : 'incomplete')));
  console.log('Total tokens generated:', tokenCount);
  console.log('All phases passed:', gotComposing && gotWriting && gotFastAudit && gotDeepAudit && gotDone);

  if (gotDone) {
    console.log('\n✅ Pipeline end-to-end test PASSED!');
  } else {
    console.log('\n❌ Pipeline test FAILED!');
    process.exit(1);
  }
}

testPipeline().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
