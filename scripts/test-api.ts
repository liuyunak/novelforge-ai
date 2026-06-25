import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { deepSeekClient } from '../packages/server/src/ai/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testChat() {
  console.log('=== 测试 DeepSeek 普通调用 ===');
  try {
    const result = await deepSeekClient.chat(
      [
        { role: 'system', content: '你是一个简洁的助手。' },
        { role: 'user', content: '用一句话介绍什么是网文创作。' },
      ],
      'planner'
    );
    console.log('回复:', result.content);
    console.log('Token 使用:', result.usage);
    console.log('✅ 普通调用测试通过\n');
  } catch (error: any) {
    console.error('❌ 普通调用失败:', error.message);
  }
}

async function testStream() {
  console.log('=== 测试 DeepSeek 流式调用 ===');
  try {
    const stream = await deepSeekClient.streamChat(
      [
        { role: 'system', content: '你是一个简洁的助手。' },
        { role: 'user', content: '用三句话介绍玄幻小说的特点。' },
      ],
      'writer'
    );

    const reader = stream.getReader();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullContent += value;
      process.stdout.write(value);
    }

    console.log('\n\n✅ 流式调用测试通过');
    console.log('总长度:', fullContent.length, '字符\n');
  } catch (error: any) {
    console.error('❌ 流式调用失败:', error.message);
  }
}

async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
    console.log('⚠️  未配置有效的 DEEPSEEK_API_KEY，跳过 API 测试');
    console.log('请在 .env 文件中配置你的 DeepSeek API Key');
    return;
  }

  console.log(`API Key: ${apiKey.substring(0, 8)}...\n`);

  await testChat();
  await testStream();

  console.log('=== 所有测试完成 ===');
}

main().catch(console.error);
