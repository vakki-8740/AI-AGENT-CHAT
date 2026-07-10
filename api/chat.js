export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'OPENROUTER_API_KEY not set in Vercel environment variables' });
    }

    const { model, messages, temperature, max_tokens } = req.body;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'qwen/qwen3-next-80b-a3b-instruct:free',
                messages,
                temperature: temperature ?? 0.7,
                max_tokens: max_tokens ?? 1024
            })
        });

        const data = await response.json();
        res.status(response.status).json(data);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
