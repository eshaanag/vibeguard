import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_FILE = path.join(process.cwd(), 'tmp', 'ai-cache.json');

export function getCacheKey(file: string, snippet: string): string {
    return crypto.createHash('md5').update(`${file}:${snippet}`).digest('hex');
}

export function loadCache(): Record<string, any> {
    if (!fs.existsSync(CACHE_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch (e) {
        return {};
    }
}

export function saveToCache(key: string, value: any) {
    const cache = loadCache();
    cache[key] = value;

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}
