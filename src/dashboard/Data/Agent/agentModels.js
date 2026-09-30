/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

// Where the model list of the agent-creation dialog comes from, in order:
//   1. the provider itself, asked with the key the user typed — so new models
//      show up the day they ship, limited to the ones that key can use;
//   2. the list back4app2 curates for the agent (fetchPlatformModels) — when the
//      key is missing, rejected, or the provider can't be reached.

// Preferred default per provider, used when it is among the models offered;
// otherwise the newest one is the default.
export const PREFERRED_MODEL = {
  openai: 'gpt-6.1-sol',
  anthropic: 'claude-sonnet-5-5',
};

// back4app2 has no endpoint for the agent's supported models yet, so its list
// lives here for now. When the endpoint exists, fetch it in fetchPlatformModels
// and keep this only as the offline fallback.
// Newest first, like the provider lists. Anthropic by launch date: Sonnet 5.5
// (2026-09-28), Opus 5.5 (09-22), Fable 5.1 (09-01). OpenAI: GPT-6.1 Sol
// supersedes GPT-6 Sol; GPT-6 Sol and Luna launched together (09-22).
const PLATFORM_MODELS = {
  openai: ['gpt-6.1-sol', 'gpt-6-sol', 'gpt-6-luna'],
  anthropic: ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-fable-5-1'],
};

// The dropdown always offers the three newest models (plus Custom…).
const MAX_MODELS = 3;

export async function fetchPlatformModels(provider) {
  return (PLATFORM_MODELS[provider] || []).slice(0, MAX_MODELS);
}

// OpenAI's /v1/models returns everything the key can reach — embeddings,
// audio, image, moderation, dated snapshots. Keep the chat/reasoning models the
// agent can run on, one entry per model (no -YYYY-MM-DD snapshots).
const OPENAI_CHAT = /^(gpt-|o\d|chatgpt-)/;
const OPENAI_EXCLUDE = /(audio|realtime|tts|transcribe|image|embedding|search|moderation|instruct|live|dall-e|whisper|computer-use|cyber)/;
const DATED_SNAPSHOT = /-\d{4}-\d{2}-\d{2}$/;

async function fetchOpenAIModels(apiKey, signal) {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal,
  });
  if (!res.ok) {
    throw providerError(res.status);
  }
  const { data = [] } = await res.json();
  return data
    .filter(m => OPENAI_CHAT.test(m.id) && !OPENAI_EXCLUDE.test(m.id) && !DATED_SNAPSHOT.test(m.id))
    .sort((a, b) => (b.created || 0) - (a.created || 0))
    .map(m => m.id);
}

// Anthropic's /v1/models lists Claude models only, newest first. Calling it
// from a browser needs the explicit direct-browser-access header.
async function fetchAnthropicModels(apiKey, signal) {
  const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    signal,
  });
  if (!res.ok) {
    throw providerError(res.status);
  }
  const { data = [] } = await res.json();
  return data
    .filter(m => /^claude-/.test(m.id))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .map(m => m.id);
}

function providerError(status) {
  const message = status === 401 || status === 403
    ? 'the provider rejected this key'
    : `the provider answered ${status}`;
  const error = new Error(message);
  error.status = status;
  return error;
}

// The models this key can use, newest first. Throws when the provider can't
// list them (bad key, network, CORS); callers fall back to the platform list.
export async function fetchProviderModels(provider, apiKey, signal) {
  const models = provider === 'anthropic'
    ? await fetchAnthropicModels(apiKey, signal)
    : await fetchOpenAIModels(apiKey, signal);
  if (!models.length) {
    throw new Error('the provider listed no usable models for this key');
  }
  return models.slice(0, MAX_MODELS);
}

export function defaultModelFor(provider, models) {
  return models.includes(PREFERRED_MODEL[provider]) ? PREFERRED_MODEL[provider] : models[0] || '';
}
