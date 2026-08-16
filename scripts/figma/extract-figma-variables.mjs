#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { mkdir } from 'node:fs/promises';

import { parseFigFile } from '@open-pencil/core';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error('Usage: node extract-figma-variables.mjs <input.fig> <output.json>');
  process.exit(2);
}

const expectedSha = process.env.EXPECTED_FIG_SHA256 ?? '';
const expectedVariableCount = Number(process.env.EXPECTED_FIG_VARIABLE_COUNT ?? '92');
const extractorVersion = process.env.OPEN_PENCIL_EXTRACTOR_VERSION ?? '0.13.2';

const source = await readFile(inputPath);
const sourceSha256 = createHash('sha256').update(source).digest('hex');
if (expectedSha && sourceSha256 !== expectedSha) {
  throw new Error(`Native .fig SHA-256 mismatch: ${sourceSha256}; expected ${expectedSha}`);
}

const arrayBuffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
const graph = await parseFigFile(arrayBuffer, { populate: 'first-page' });

const collectionById = new Map(graph.variableCollections);
const variableById = new Map(graph.variables);
const typeCounts = {};
let aliasCount = 0;
const unresolvedAliases = [];
const incompleteModeValues = [];

function normalizeValue(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(normalizeValue);
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, normalizeValue(nested)])
  );
}

const collections = [...collectionById.values()]
  .map((collection) => {
    const modes = [...collection.modes].map((mode) => ({ modeId: mode.modeId, name: mode.name }));
    const modeIds = new Set(modes.map((mode) => mode.modeId));
    const variables = [...variableById.values()]
      .filter((variable) => variable.collectionId === collection.id)
      .map((variable) => {
        typeCounts[variable.type] = (typeCounts[variable.type] ?? 0) + 1;
        const valuesByMode = Object.fromEntries(
          Object.entries(variable.valuesByMode ?? {})
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([modeId, value]) => {
              if (value && typeof value === 'object' && 'aliasId' in value) {
                aliasCount += 1;
                if (!variableById.has(value.aliasId)) {
                  unresolvedAliases.push({ variableId: variable.id, modeId, aliasId: value.aliasId });
                }
              }
              return [modeId, normalizeValue(value)];
            })
        );
        const presentModes = new Set(Object.keys(valuesByMode));
        const missingModes = [...modeIds].filter((modeId) => !presentModes.has(modeId));
        const unknownModes = [...presentModes].filter((modeId) => !modeIds.has(modeId));
        if (missingModes.length > 0 || unknownModes.length > 0) {
          incompleteModeValues.push({
            variableId: variable.id,
            variableName: variable.name,
            missingModes,
            unknownModes
          });
        }
        return {
          id: variable.id,
          name: variable.name,
          type: variable.type,
          collectionId: variable.collectionId,
          description: variable.description ?? '',
          hiddenFromPublishing: variable.hiddenFromPublishing === true,
          key: variable.key ?? null,
          version: variable.version ?? null,
          valuesByMode
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

    return {
      id: collection.id,
      name: collection.name,
      defaultModeId: collection.defaultModeId,
      modes,
      variables
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

const orphanVariables = [...variableById.values()]
  .filter((variable) => !collectionById.has(variable.collectionId))
  .map((variable) => ({ id: variable.id, name: variable.name, collectionId: variable.collectionId }));

const variableCount = variableById.size;
if (variableCount !== expectedVariableCount) {
  throw new Error(`Expected ${expectedVariableCount} native Figma variables, parsed ${variableCount}`);
}
if (collections.length === 0) {
  throw new Error('Native Figma variable extraction returned zero collections');
}
if (orphanVariables.length > 0) {
  throw new Error(`Native Figma variable extraction found ${orphanVariables.length} variables without a parsed collection`);
}

const evidence = {
  schemaVersion: 1,
  source: {
    path: inputPath,
    bytes: source.byteLength,
    sha256: sourceSha256
  },
  extractor: {
    package: '@open-pencil/core',
    version: extractorVersion,
    mode: 'read-only parseFigFile'
  },
  summary: {
    collectionCount: collections.length,
    variableCount,
    typeCounts: Object.fromEntries(Object.entries(typeCounts).sort(([a], [b]) => a.localeCompare(b))),
    aliasCount,
    unresolvedAliasCount: unresolvedAliases.length,
    incompleteModeValueCount: incompleteModeValues.length
  },
  collections,
  diagnostics: {
    unresolvedAliases,
    incompleteModeValues,
    orphanVariables
  }
};

const encoded = `${JSON.stringify(evidence, null, 2)}\n`;
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, encoded, 'utf8');

const payloadSha256 = createHash('sha256').update(encoded).digest('hex');
console.log(JSON.stringify({
  ok: true,
  collectionCount: collections.length,
  variableCount,
  typeCounts: evidence.summary.typeCounts,
  aliasCount,
  unresolvedAliasCount: unresolvedAliases.length,
  incompleteModeValueCount: incompleteModeValues.length,
  evidenceSha256: payloadSha256,
  outputPath
}));
