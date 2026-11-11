const providerConfig = {
  gemini: { name: 'Gemini', keyVar: 'GEMINI_API_KEY', modelVar: 'GEMINI_MODEL', defaultModel: 'gemini-4-carbon' },
  grok: { name: 'Grok', keyVar: 'XAI_API_KEY', modelVar: 'GROK_MODEL', defaultModel: 'grok-4.7' },
  groq: { name: 'Groq', keyVar: 'GROQ_API_KEY', modelVar: 'GROQ_MODEL', defaultModel: 'openai/gpt-oss-120b' },
};

export function isCloudProvider(id) {
  return typeof id === 'string' && Object.hasOwn(providerConfig, id);
}

function config(id) {
  const provider = providerConfig[id];
  return {
    ...provider,
    model: process.env[provider.modelVar]?.trim() || provider.defaultModel,
    key: process.env[provider.keyVar]?.trim(),
  };
}

export function cloudStatus() {
  return Object.fromEntries(Object.keys(providerConfig).map(id => {
    const { name, key, keyVar, model } = config(id);
    return [id, { name, configured: Boolean(key), model, keyVar }];
  }));
}

const string = { type: 'string' };
const number = { type: 'number' };
const object = (properties, required) => ({ type: 'object', properties, required, additionalProperties: false });
const array = (items, maxItems) => ({ type: 'array', items, maxItems });
const optionalNumbers = ['frequency','offset','phase','duty','symmetry','delay','rise','fall','burstCycles',
  'sweepStop','sweepTime','modFrequency','modDepth','deviation','sourceResistance'];
const optionalStrings = ['libraryId','modelName','control','expression','wave','sweep','modulation','inductor1','inductor2'];

const component = object({
  id: string, type: string, nodes: array(string, 128), value: number,
  ...Object.fromEntries(optionalNumbers.map(field => [field, number])),
  ...Object.fromEntries(optionalStrings.map(field => [field, string])),
  outputEnabled: { type: 'boolean' },
  points: array({ type: 'array', items: number, minItems: 2, maxItems: 2 }, 128),
}, ['id', 'type', 'nodes', 'value']);

const cloudFormat = object({
  explanation: string,
  circuit: object({
    name: string,
    mode: { type: 'string', enum: ['analog', 'digital'] },
    components: array(component, 256),
  }, ['name', 'mode', 'components']),
  modelSearch: string,
  modelRequests: array(object({ url: string, name: string, license: string }, ['url']), 3),
}, []);

const tokenLimit = 32768;

function geminiRequest(model, key, messages) {
  const system = messages.filter(m => m.role === 'system').map(m => ({ text: m.content }));
  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.replace(/^models\//, ''))}:generateContent`,
    headers: { 'x-goog-api-key': key },
    body: {
      systemInstruction: { parts: system },
      contents,
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: cloudFormat,
        maxOutputTokens: tokenLimit,
      },
    },
  };
}

function grokRequest(model, key, messages) {
  return {
    url: 'https://api.x.ai/v1/responses',
    headers: { Authorization: `Bearer ${key}` },
    body: {
      model,
      input: messages,
      store: false,
      max_output_tokens: tokenLimit,
      text: { format: { type: 'json_schema', name: 'circuit_proposal', strict: true, schema: cloudFormat } },
    },
  };
}

function groqRequest(model, key, messages) {
  return {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: { Authorization: `Bearer ${key}` },
    body: {
      model,
      messages,
      max_completion_tokens: 3072,
      response_format: { type: 'json_object' },
    },
  };
}

function readGemini(result) {
  const candidate = result.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  return {
    text: parts.filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join(''),
    truncated: candidate?.finishReason === 'MAX_TOKENS',
  };
}

function readGrok(result) {
  const text = (result.output || []).filter(item => item.type === 'message')
    .flatMap(item => item.content || []).filter(part => part.type === 'output_text').map(part => part.text).join('');
  return { text, truncated: result.status === 'incomplete' && result.incomplete_details?.reason === 'max_output_tokens' };
}

function readGroq(result) {
  const choice = result.choices?.[0];
  return { text: choice?.message?.content ?? '', truncated: choice?.finish_reason === 'length' };
}

const transports = {
  gemini: { request: geminiRequest, read: readGemini },
  grok: { request: grokRequest, read: readGrok },
  groq: { request: groqRequest, read: readGroq },
};

function providerError(name, model, status) {
  if (status === 401 || status === 403) return `${name} denied the request. Check the API key and model access.`;
  if (status === 402 || status === 429) return `${name} quota, billing, or rate limit prevented this request.`;
  if (status === 404) return `${name} could not find model ${model}. Check the configured model ID.`;
  return `${name} returned HTTP ${status}. Check model access and try again.`;
}

async function groqRateLimit(response) {
  const payload = await response.json().catch(() => null);
  const message = typeof payload?.error?.message === 'string' ? payload.error.message : '';
  if (response.status === 413 || /request too large/i.test(message)) {
    const amounts = /\bLimit\s+(\d+),\s*Requested\s+(\d+)/i.exec(message);
    const detail = amounts ? ` Groq reported ${amounts[2]} requested tokens against a limit of ${amounts[1]}.` : '';
    return `This request exceeds Groq’s token limit.${detail} Shorten the prompt or turn off Include current circuit and registered model sources.`;
  }
  const wait = Number(response.headers.get('retry-after'));
  const retry = Number.isFinite(wait) && wait > 0 ? ` Try again in ${Math.ceil(wait)} seconds.` : ' Check your GroqCloud limits before retrying.';
  return `Groq’s rate limit was reached.${retry}`;
}

export function resolveCloud(id) {
  const { name, key, keyVar, model } = config(id);
  const transport = transports[id];
  if (!key) throw new Error(`Set ${keyVar} in .env and restart Circuit Studio to use ${name}.`);
  return {
    name,
    model,
    async chat(messages) {
      const { url, headers, body } = transport.request(model, key, messages);
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(body),
          redirect: 'error',
          signal: AbortSignal.timeout(180000),
        });
      } catch (error) {
        throw new Error(error.name === 'TimeoutError' ? `${name} timed out.` : `Could not reach ${name}.`);
      }
      if (!response.ok) {
        const limited = id === 'groq' && [413, 429].includes(response.status);
        throw new Error(limited ? await groqRateLimit(response) : providerError(name, model, response.status));
      }
      const payload = await response.json();
      const { text, truncated } = transport.read(payload);
      if (truncated) throw new Error(`${name} reached its output limit. Ask for a smaller stage or use catalog blocks to reduce the component count.`);
      if (!text.trim()) throw new Error(`${name} did not return a circuit proposal. Review the request and try again.`);
      return text;
    },
  };
}
