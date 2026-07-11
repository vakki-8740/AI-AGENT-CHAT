export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: { message: 'OPENROUTER_API_KEY not set in Vercel environment variables' } });
    }

    const { model, messages, temperature, max_tokens } = req.body;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://ai-agent-chat.vercel.app',
                'X-Title': 'AI Support Hub'
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
            return res.status(response.status).json({ error: { message: errMsg } });
        }

        return res.status(200).json(data);

    } catch (err) {
        return res.status(500).json({ error: { message: err.message } });
    }
}
