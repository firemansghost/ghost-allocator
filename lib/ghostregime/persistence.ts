/**
 * GhostRegime Persistence
 * Adapter pattern for storage (BlobStorageAdapter for prod, LocalFileAdapter for dev)
 */

import { put, head } from '@vercel/blob';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { GhostRegimeRow, StorageMeta } from './types';
import { BLOB_KEYS, MODEL_VERSION } from './config';

export interface StorageAdapter {
  readHistory(): Promise<GhostRegimeRow[]>;
  readLatest(): Promise<GhostRegimeRow | null>;
  readMeta(): Promise<StorageMeta | null>;
  appendToHistory(row: GhostRegimeRow): Promise<void>;
  writeLatest(row: GhostRegimeRow): Promise<void>;
  writeMeta(meta: StorageMeta): Promise<void>;
}

/**
 * BlobStorageAdapter - Production storage using Vercel Blob
 */
export class BlobStorageAdapter implements StorageAdapter {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async readHistory(): Promise<GhostRegimeRow[]> {
    try {
      const blob = await head(BLOB_KEYS.HISTORY, { token: this.token });
      const response = await fetch(blob.url);
      if (!response.ok) return [];

      const text = await response.text();
      const lines = text.trim().split('\n').filter((l) => l.trim());
      return lines.map((line) => JSON.parse(line) as GhostRegimeRow);
    } catch (error) {
      // Blob doesn't exist yet - return empty array
      return [];
    }
  }

  async readLatest(): Promise<GhostRegimeRow | null> {
    try {
      const blob = await head(BLOB_KEYS.LATEST, { token: this.token });
      const response = await fetch(blob.url);
      if (!response.ok) return null;

      const json = await response.json();
      return json as GhostRegimeRow;
    } catch (error) {
      // Blob doesn't exist yet - return null
      return null;
    }
  }

  async readMeta(): Promise<StorageMeta | null> {
    try {
      const blob = await head(BLOB_KEYS.META, { token: this.token });
      const response = await fetch(blob.url);
      if (!response.ok) return null;

      const json = await response.json();
      return {
        version: json.version,
        lastUpdated: new Date(json.lastUpdated),
      };
    } catch (error) {
      // Blob doesn't exist yet - return null
      return null;
    }
  }

  async appendToHistory(row: GhostRegimeRow): Promise<void> {
    try {
      const existing = await this.readHistory();
      const updated = [...existing, row];
      const content = updated.map((r) => JSON.stringify(r)).join('\n') + '\n';

      await put(BLOB_KEYS.HISTORY, content, {
        access: 'public',
        token: this.token,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    } catch (error) {
      console.error('Error appending to history:', error);
      throw error;
    }
  }

  async writeLatest(row: GhostRegimeRow): Promise<void> {
    try {
      await put(BLOB_KEYS.LATEST, JSON.stringify(row, null, 2), {
        access: 'public',
        token: this.token,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    } catch (error) {
      console.error('Error writing latest:', error);
      throw error;
    }
  }

  async writeMeta(meta: StorageMeta): Promise<void> {
    try {
      await put(
        BLOB_KEYS.META,
        JSON.stringify({
          version: meta.version,
          lastUpdated: meta.lastUpdated.toISOString(),
        }),
        {
          access: 'public',
          token: this.token,
          addRandomSuffix: false,
          allowOverwrite: true,
        }
      );
    } catch (error) {
      console.error('Error writing meta:', error);
      throw error;
    }
  }
}

/**
 * LocalFileAdapter - Development/testing storage using local filesystem
 */
export class LocalFileAdapter implements StorageAdapter {
  private basePath: string;

  constructor(basePath: string = '.ghostregime') {
    this.basePath = basePath;
    // Ensure directory exists
    if (!existsSync(this.basePath)) {
      mkdirSync(this.basePath, { recursive: true });
    }
  }

  private getHistoryPath(): string {
    return join(this.basePath, 'history.jsonl');
  }

  private getLatestPath(): string {
    return join(this.basePath, 'latest.json');
  }

  private getMetaPath(): string {
    return join(this.basePath, 'meta.json');
  }

  async readHistory(): Promise<GhostRegimeRow[]> {
    try {
      const path = this.getHistoryPath();
      if (!existsSync(path)) return [];

      const content = readFileSync(path, 'utf-8');
      const lines = content.trim().split('\n').filter((l) => l.trim());
      return lines.map((line) => JSON.parse(line) as GhostRegimeRow);
    } catch (error) {
      console.error('Error reading history from file:', error);
      return [];
    }
  }

  async readLatest(): Promise<GhostRegimeRow | null> {
    try {
      const path = this.getLatestPath();
      if (!existsSync(path)) return null;

      const content = readFileSync(path, 'utf-8');
      return JSON.parse(content) as GhostRegimeRow;
    } catch (error) {
      console.error('Error reading latest from file:', error);
      return null;
    }
  }

  async readMeta(): Promise<StorageMeta | null> {
    try {
      const path = this.getMetaPath();
      if (!existsSync(path)) return null;

      const content = readFileSync(path, 'utf-8');
      const json = JSON.parse(content);
      return {
        version: json.version,
        lastUpdated: new Date(json.lastUpdated),
      };
    } catch (error) {
      console.error('Error reading meta from file:', error);
      return null;
    }
  }

  async appendToHistory(row: GhostRegimeRow): Promise<void> {
    try {
      const existing = await this.readHistory();
      const updated = [...existing, row];
      const content = updated.map((r) => JSON.stringify(r)).join('\n') + '\n';
      writeFileSync(this.getHistoryPath(), content, 'utf-8');
    } catch (error) {
      console.error('Error appending to history:', error);
      throw error;
    }
  }

  async writeLatest(row: GhostRegimeRow): Promise<void> {
    try {
      writeFileSync(
        this.getLatestPath(),
        JSON.stringify(row, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error writing latest:', error);
      throw error;
    }
  }

  async writeMeta(meta: StorageMeta): Promise<void> {
    try {
      writeFileSync(
        this.getMetaPath(),
        JSON.stringify({
          version: meta.version,
          lastUpdated: meta.lastUpdated.toISOString(),
        }),
        'utf-8'
      );
    } catch (error) {
      console.error('Error writing meta:', error);
      throw error;
    }
  }
}

/**
 * Factory function to get appropriate storage adapter
 */
export function getStorageAdapter(): StorageAdapter {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const isDev = process.env.NODE_ENV === 'development';

  // Use local file adapter in dev if no token, otherwise use blob
  if (isDev && !token) {
    return new LocalFileAdapter();
  }

  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required in production');
  }

  return new BlobStorageAdapter(token);
}

