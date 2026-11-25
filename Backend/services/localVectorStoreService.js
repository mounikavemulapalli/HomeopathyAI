/** @format */

const fs = require("fs");
const path = require("path");

const DEFAULT_VECTOR_CANDIDATES = [
  path.join(__dirname, "../data/rubric-vectors.json"),
  path.join(__dirname, "../database/rubric-vectors.json"),
  path.join(__dirname, "rubric-vectors.json"),
];

const DEFAULT_OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434";
const DEFAULT_EMBED_MODEL =
  process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
const DEFAULT_VECTOR_DIM = 256;

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeForLocalVector(text) {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const words = normalized.split(" ").filter(Boolean);
  const charBigrams = [];

  for (const w of words) {
    if (w.length >= 3) {
      for (let i = 0; i < w.length - 1; i++) {
        charBigrams.push(`bg_${w.slice(i, i + 2)}`);
      }
    }
  }

  return [...words, ...charBigrams];
}

function fnv1a32(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function computeLocalFallbackEmbedding(text, dim = DEFAULT_VECTOR_DIM) {
  const vec = new Float32Array(dim);
  const tokens = tokenizeForLocalVector(text);
  if (tokens.length === 0) return Array.from(vec);

  for (const token of tokens) {
    const h1 = fnv1a32(token);
    const h2 = fnv1a32(`sign_${token}`);
    const idx = h1 % dim;
    const sign = h2 % 2 === 0 ? 1 : -1;
    const weight = token.startsWith("bg_") ? 0.35 : 1.0;
    vec[idx] += sign * weight;
  }

  let normSq = 0;
  for (let i = 0; i < dim; i++) {
    normSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(normSq);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vec[i] = Number((vec[i] / norm).toFixed(4));
    }
  }

  return Array.from(vec);
}

function dotProductFloat32(vecA, vecB) {
  const len = Math.min(vecA.length, vecB.length);
  let dot = 0;
  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
  }
  return dot;
}

function toNormalizedFloat32(arr) {
  const f32 = new Float32Array(arr.length);
  let normSq = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = Number(arr[i]) || 0;
    f32[i] = v;
    normSq += v * v;
  }
  const norm = Math.sqrt(normSq);
  if (norm > 0) {
    for (let i = 0; i < f32.length; i++) {
      f32[i] = f32[i] / norm;
    }
  }
  return f32;
}

class LocalVectorStoreService {
  constructor(options = {}) {
    this.customFilePath = options.vectorFilePath || null;
    this.entries = [];
    this.loaded = false;
    this.sourcePath = null;
    this.lastLoadError = null;
  }

  _resolveVectorFilePath() {
    if (this.customFilePath) {
      return path.isAbsolute(this.customFilePath)
        ? this.customFilePath
        : path.resolve(__dirname, "..", this.customFilePath);
    }
    for (const candidate of DEFAULT_VECTOR_CANDIDATES) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  ensureLoaded(forceReload = false) {
    if (this.loaded && !forceReload) {
      return this.entries.length > 0;
    }

    this.loaded = true;
    this.lastLoadError = null;
    this.entries = [];

    const filePath = this._resolveVectorFilePath();
    this.sourcePath = filePath;

    if (!filePath || !fs.existsSync(filePath)) {
      return false;
    }

    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      const records = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.entries)
          ? parsed.entries
          : Array.isArray(parsed?.vectors)
            ? parsed.vectors
            : [];

      this.entries = records
        .filter((item) => item && Array.isArray(item.embedding) && item.embedding.length > 0)
        .map((item) => ({
          id: item.id,
          rubric: item.rubric || item.text || "",
          chapter: item.chapter ? String(item.chapter).toUpperCase() : "",
          vec: toNormalizedFloat32(item.embedding),
        }));

      return this.entries.length > 0;
    } catch (error) {
      this.lastLoadError = error.message;
      console.warn(
        `[LocalVectorStoreService] Failed to load vector store from ${filePath}:`,
        error.message,
      );
      return false;
    }
  }

  async embedQuery(text, { timeoutMs = 1500 } = {}) {
    const cleanText = String(text || "").trim();
    if (!cleanText) return [];

    const useOllama = process.env.USE_OLLAMA_EMBEDDINGS === "true";
    if (useOllama) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(`${DEFAULT_OLLAMA_URL}/api/embeddings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: DEFAULT_EMBED_MODEL,
            prompt: cleanText,
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.embedding) && data.embedding.length > 0) {
            return data.embedding;
          }
        }
      } catch (_) {
        // Offline or timeout: fall back cleanly to deterministic local embedding
      } finally {
        clearTimeout(timer);
      }
    }

    return computeLocalFallbackEmbedding(cleanText, DEFAULT_VECTOR_DIM);
  }

  async search(queryOrEmbedding, topK = 100, options = {}) {
    this.ensureLoaded();
    if (!this.entries.length) {
      return [];
    }

    let queryArr = queryOrEmbedding;
    if (typeof queryOrEmbedding === "string") {
      queryArr = await this.embedQuery(queryOrEmbedding);
    }

    if (!Array.isArray(queryArr) || queryArr.length === 0) {
      return [];
    }

    const queryVec = toNormalizedFloat32(queryArr);
    const allowedChaptersSet = Array.isArray(options.allowedChapters)
      ? new Set(
          options.allowedChapters
            .filter(Boolean)
            .map((ch) => String(ch).trim().toUpperCase()),
        )
      : null;

    const minScore =
      typeof options.minScore === "number" ? options.minScore : 0.05;

    const scored = [];
    for (const entry of this.entries) {
      if (allowedChaptersSet && allowedChaptersSet.size > 0) {
        if (!entry.chapter || !allowedChaptersSet.has(entry.chapter)) {
          continue;
        }
      }

      const score = dotProductFloat32(queryVec, entry.vec);
      if (score >= minScore) {
        scored.push({
          id: entry.id,
          rubric: entry.rubric,
          chapter: entry.chapter,
          score,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  async checkHealth() {
    this.ensureLoaded();
    return {
      ok: true,
      loaded: this.entries.length > 0,
      vectorCount: this.entries.length,
      sourcePath: this.sourcePath,
      lastLoadError: this.lastLoadError,
      mode:
        process.env.USE_OLLAMA_EMBEDDINGS === "true"
          ? `ollama:${DEFAULT_EMBED_MODEL} (+local-fallback)`
          : "local-deterministic-vector",
    };
  }
}

module.exports = new LocalVectorStoreService();
module.exports.LocalVectorStoreService = LocalVectorStoreService;
module.exports.computeLocalFallbackEmbedding = computeLocalFallbackEmbedding;
module.exports.dotProductFloat32 = dotProductFloat32;
