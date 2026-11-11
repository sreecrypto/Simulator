import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from '../server.mjs';
import { cloneExample } from '../src/examples.js';
import { evaluateDigital } from '../src/digital.js';

test('cloud providers generate and validate large circuits without exposing credentials', async () => {
  const names = ['GEMINI_API_KEY','GEMINI_MODEL','XAI_API_KEY','GROK_MODEL','GROQ_API_KEY','GROQ_MODEL'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  Object.assign(process.env, {
    GEMINI_API_KEY: 'gemini-fixture-key',
    GEMINI_MODEL: 'gemini-fixture',
    XAI_API_KEY: 'xai-fixture-key',
    GROK_MODEL: 'grok-fixture',
    GROQ_API_KEY: 'groq-fixture-key',
    GROQ_MODEL: 'openai/gpt-oss-120b',
  });
  const adder = JSON.parse(await readFile(new URL('../examples/ripple-adder-16bit.json', import.meta.url)));
  const project = circuit => ({
    explanation: 'Fixture circuit',
    circuit: {
      name: circuit.name,
      mode: circuit.mode,
      components: circuit.components.map(({ x, y, ...part }) => part),
    },
  });
  const originalFetch = globalThis.fetch;
  let geminiCalls = 0, grokCalls = 0, groqCalls = 0, quota = false;
  globalThis.fetch = async (url, options) => {
    if (url === 'https://generativelanguage.googleapis.com/v1beta/models/gemini-fixture:generateContent') {
      geminiCalls++;
      const request = JSON.parse(options.body);
      assert.equal(options.headers['x-goog-api-key'], 'gemini-fixture-key');
      assert.equal(options.redirect, 'error');
      assert.equal(request.generationConfig.responseMimeType, 'application/json');
      assert.ok(request.generationConfig.maxOutputTokens >= 32000);
      assert.ok(request.systemInstruction.parts[0].text.includes('functional stages'));
      const context = JSON.parse(request.contents[0].parts[0].text);
      assert.equal(context.currentCircuit, undefined);
      assert.ok(context.catalog.length > 100);
      if (quota) return Response.json({ error: 'gemini-fixture-key' }, { status: 429 });
      return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [
        { thought: true, text: 'Internal reasoning fixture' }, { text: JSON.stringify(project(adder)) },
      ] } }] });
    }
    if (url === 'https://api.x.ai/v1/responses') {
      grokCalls++;
      const request = JSON.parse(options.body);
      assert.equal(options.headers.Authorization, 'Bearer xai-fixture-key');
      assert.equal(request.store, false);
      assert.equal(request.model, 'grok-fixture');
      assert.equal(request.text.format.type, 'json_schema');
      const output = project(cloneExample('halfadder'));
      if (grokCalls === 1) output.circuit.components.at(-1).nodes = ['missing'];
      else {
        assert.equal(request.input.at(-2).role, 'assistant');
        assert.match(request.input.at(-1).content, /Undriven net/);
      }
      return Response.json({ status: 'completed', output: [{ type: 'reasoning' },
        { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(output) }] }] });
    }
    if (url === 'https://api.groq.com/openai/v1/chat/completions') {
      groqCalls++;
      const request = JSON.parse(options.body);
      assert.equal(options.headers.Authorization, 'Bearer groq-fixture-key');
      assert.equal(request.model, 'openai/gpt-oss-120b');
      assert.deepEqual(request.response_format, { type: 'json_object' });
      assert.equal(request.max_completion_tokens, 3072);
      const catalog = JSON.parse(request.messages[1].content).catalog;
      assert.ok(Buffer.byteLength(JSON.stringify(catalog)) <= 3201);
      assert.ok(catalog.some(part => part.libraryId === 'adder_16'));
      if (groqCalls === 3) return Response.json({ error: {
        message: 'Request too large. Limit 8000, Requested 10500. groq-fixture-key',
      } }, { status: 429 });
      if (groqCalls === 4) return Response.json({}, { status: 429, headers: { 'retry-after': '12' } });
      return Response.json({ choices: [{
        finish_reason: groqCalls === 1 ? 'stop' : 'length',
        message: { content: JSON.stringify(project(adder)) },
      }] });
    }
    if (String(url).endsWith('/api/tags')) return Response.json({ models: [] });
    return originalFetch(url, options);
  };
  const server = createServer({ engineCheck: async () => false });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async provider => {
    const response = await originalFetch(base + '/api/assistant', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, prompt: 'Build a 16-bit ripple-carry adder.' }),
    });
    return { status: response.status, data: await response.json() };
  };
  try {
    const status = await (await originalFetch(base + '/api/status')).json();
    assert.equal(status.providers.gemini.configured, true);
    assert.equal(status.providers.grok.configured, true);
    assert.equal(status.providers.groq.configured, true);
    assert.doesNotMatch(JSON.stringify(status), /fixture-key/);

    const gemini = await post('gemini');
    assert.equal(gemini.status, 200, JSON.stringify(gemini.data.error));
    assert.equal(gemini.data.circuit.components.length, adder.components.length);
    assert.ok(adder.components.length > 100);
    assert.equal(gemini.data.verification.passed, true);
    assert.deepEqual(evaluateDigital(gemini.data.circuit).outputs, evaluateDigital(adder).outputs);

    const grok = await post('grok');
    assert.equal(grok.status, 200, JSON.stringify(grok.data));
    assert.equal(grok.data.attempts, 2);
    assert.equal(grok.data.provider, 'grok');
    assert.equal(grokCalls, 2);

    const groq = await post('groq');
    assert.equal(groq.status, 200, JSON.stringify(groq.data.error));
    assert.equal(groq.data.provider, 'groq');
    assert.equal(groq.data.circuit.components.length, adder.components.length);
    assert.equal(groq.data.verification.passed, true);
    const truncated = await post('groq');
    assert.equal(truncated.status, 502);
    assert.match(truncated.data.error, /Groq reached its output limit/);
    const oversized = await post('groq');
    assert.match(oversized.data.error, /10500 requested tokens against a limit of 8000/);
    assert.doesNotMatch(oversized.data.error, /fixture-key/);
    assert.match((await post('groq')).data.error, /Try again in 12 seconds/);

    quota = true;
    const rateLimited = await post('gemini');
    assert.equal(rateLimited.status, 502);
    assert.match(rateLimited.data.error, /quota/);
    assert.doesNotMatch(JSON.stringify(rateLimited), /fixture-key/);
    delete process.env.GEMINI_API_KEY;
    const missing = await post('gemini');
    assert.equal(missing.status, 503);
    assert.match(missing.data.error, /GEMINI_API_KEY/);
    assert.equal(geminiCalls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
    await new Promise(resolve => server.close(resolve));
  }
});
