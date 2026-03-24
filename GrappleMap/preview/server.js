#!/usr/bin/env node
/**
 * Simple dev server with API for sequence extraction
 */

import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);

const app = express();
app.use(express.json());

// Serve static files
app.use(express.static('dist'));

// API: Extract sequence
app.post('/api/extract', async (req, res) => {
    try {
        const { sequence } = req.body;

        // Convert sequence to command format
        // sequence = [{type: 'position', id: 557}, ...]
        const parts = sequence.map(s =>
            s.type === 'position' ? `p${s.id}` : `t${s.id}`
        );
        const spec = parts.join(',');

        // Run extraction script
        const scriptPath = join(__dirname, '..', 'scripts', 'extract-sequence.js');
        const cmd = `node "${scriptPath}" "${spec}"`;

        await execAsync(cmd, { cwd: join(__dirname, '..') });

        // Read the generated sequence.json
        const sequenceData = await readFile(
            join(__dirname, 'src', 'sequence.json'),
            'utf8'
        );

        res.json(JSON.parse(sequenceData));
    } catch (err) {
        console.error('Extraction failed:', err);
        res.status(500).json({ error: err.message });
    }
});

// API: Search positions/transitions
app.get('/api/search', async (req, res) => {
    try {
        const { q, type = 'name' } = req.query;

        const scriptPath = join(__dirname, '..', 'scripts', 'extract-sequence.js');
        const cmd = `node "${scriptPath}" search "${q}"`;

        const { stdout } = await execAsync(cmd, { cwd: join(__dirname, '..') });

        // Parse the text output into JSON
        const lines = stdout.split('\n').filter(l => l.includes(':'));
        const results = lines.map(line => {
            const match = line.match(/(position|transition)\s+(\d+):\s*"([^"]+)"/);
            if (match) {
                return {
                    type: match[1],
                    id: parseInt(match[2]),
                    name: match[3]
                };
            }
            return null;
        }).filter(Boolean);

        res.json(results);
    } catch (err) {
        console.error('Search failed:', err);
        res.status(500).json({ error: err.message });
    }
});

// In production, serve the built files
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(join(__dirname, 'dist', 'index.html'));
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
