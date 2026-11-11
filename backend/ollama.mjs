const localURL = 'http://127.0.0.1:11434';

function settings() {
  return {
    url: (process.env.OLLAMA_URL?.trim() || localURL).replace(/\/+$/, ''),
    configuredModel: process.env.OLLAMA_MODEL?.trim() || '',
  };
}

async function installedModels(url) {
  const response = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(2500) });
  if (!response.ok) throw new Error('Ollama model list unavailable.');
  const { models } = await response.json();
  return (models ?? []).flatMap(model => {
    const name = model.name || model.model;
    return typeof name === 'string' && !model.remote_model && !model.remote_host &&
      !/(?:-cloud$|:cloud$)/i.test(name) ? [name] : [];
  });
}

function matchingModel(configured, installed) {
  if (!configured) return installed[0] ?? null;
  const fullName = name => {
    const leaf = name.split('/').at(-1);
    return (leaf.includes(':') ? name : `${name}:latest`).toLowerCase();
  };
  return installed.find(name => fullName(name) === fullName(configured)) ?? null;
}

export async function ollamaStatus() {
  const { url, configuredModel } = settings();
  try {
    const model = matchingModel(configuredModel, await installedModels(url));
    return {
      ai: Boolean(model),
      model: model || configuredModel || null,
      aiError: model ? null : configuredModel
        ? `Ollama is running, but ${configuredModel} is not installed.`
        : 'Ollama is running. Install a local model to use Copilot.',
    };
  } catch {
    return { ai: false, model: configuredModel || null, aiError: 'Start Ollama to connect a local model.' };
  }
}

export async function resolveOllama() {
  const { url, configuredModel } = settings();
  if (configuredModel) return { url, model: configuredModel };
  const status = await ollamaStatus();
  if (!status.ai) throw new Error(status.aiError);
  return { url, model: status.model };
}

export async function chatOllama({ url, model }, messages, format = 'json') {
  let response;
  try {
    response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(90000),
      body: JSON.stringify({ model, stream: false, format, messages, ...(format === 'json' ? {} : {
        options: { temperature: 0, num_predict: 1600 },
      }) }),
    });
  } catch (error) {
    if (error.name === 'TimeoutError') throw error;
    throw new Error('Could not reach Ollama. Start Ollama and try again.');
  }
  if (!response.ok) throw new Error(`Local model request failed. Check that ${model} is installed in Ollama.`);
  return (await response.json()).message?.content || '';
}
