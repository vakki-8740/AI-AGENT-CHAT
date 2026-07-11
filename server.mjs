import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const MIME = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png'
};

function serveStatic(res, filePath) {
    const ext = path.extname(filePath);
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    // API route
    if (req.method === 'POST' && req.url === '/api/chat') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { model, messages, temperature, max_tokens } = JSON.parse(body);
                const apiKey = process.env.OPENROUTER_API_KEY;
                if (!apiKey) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: { message: 'OPENROUTER_API_KEY not set in environment variables' } }));
                    return;
                }
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'http://localhost:3000',
                        'X-Title': 'AI Support Hub (Local)'
                    },
                    body: JSON.stringify({
                        model: model || 'tencent/hy3:free',
                        messages,
                        temperature: temperature ?? 0.7,
                        max_tokens: max_tokens ?? 1024
                    })
                });
                const data = await response.json();
                if (!response.ok) {
                    const errMsg = data?.error?.message || `OpenRouter returned ${response.status}`;
                    res.writeHead(response.status, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: { message: errMsg } }));
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: { message: err.message } }));
            }
        });
        return;
    }

    // Static files
    if (req.url === '/' || req.url === '/index.html') {
        serveStatic(res, path.join(__dirname, 'index.html'));
    } else {
        serveStatic(res, path.join(__dirname, req.url));
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
