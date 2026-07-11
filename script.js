// ===================== CONFIG =====================
// OpenRouter config — API key directly in frontend (personal project)
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = 'sk-or-v1-your-key-here';
const MODEL = 'tencent/hy3:free';
const SYSTEM_INSTRUCTIONS = `You are a helpful support assistant. Be polite, patient, and professional. Ask clarifying questions to understand the user's issue. Guide them step by step. Do not ask for sensitive information like passwords or OTPs. If you cannot resolve the issue, suggest they contact human support.`;

const PROBLEM_PROMPTS = {
    deposit: `The user has a DEPOSIT problem. Ask specific questions — deposit method, amount, transaction ID, whether amount was deducted, any error message, payment gateway used. Help them resolve step by step.`,
    withdrawal: `The user has a WITHDRAWAL problem. Ask specific questions — withdrawal method, amount, processing time elapsed, account verification status, any error shown. Help them resolve step by step.`,
    other: `The user has selected "Other Problem". Ask them to describe their issue in detail, then ask relevant follow-up questions. Help them resolve step by step.`
};

const TITLES = {
    deposit: 'Deposit Problem',
    withdrawal: 'Withdrawal Problem',
    other: 'Other Problem'
};

// ===================== STATE =====================
let currentProblem = '';
let messages = [];

// ===================== THEME =====================
function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

function loadTheme() {
    const t = localStorage.getItem('theme');
    if (t === 'dark') document.body.classList.add('dark');
}

// ===================== SCREEN NAV =====================
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function backToHome() {
    showScreen('select-screen');
}

// ===================== START CHAT =====================
function startChat(problem) {
    currentProblem = problem;
    messages = [];

    document.getElementById('chat-title').textContent = TITLES[problem] || 'Support';
    showScreen('chat-screen');

    const container = document.getElementById('chat-messages');
    container.innerHTML = '';

    const systemMsg = `${SYSTEM_INSTRUCTIONS}\n\n${PROBLEM_PROMPTS[problem] || ''}`;
    messages.push({ role: 'system', content: systemMsg });

    document.getElementById('send-btn').disabled = true;

    getAIResponse()
        .catch(() => {
            addMessage('ai', 'Hello! Please describe your issue in detail so I can help you.');
        })
        .finally(() => {
            document.getElementById('send-btn').disabled = false;
            document.getElementById('chat-input').focus();
        });
}

// ===================== SEND MESSAGE =====================
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    autoResize(input);
    addMessage('user', text);

    const btn = document.getElementById('send-btn');
    btn.disabled = true;

    await getAIResponse();

    btn.disabled = false;
    input.focus();
}

// ===================== MESSAGE RENDER =====================
function addMessage(role, content) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message ${role}`;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
        <div class="avatar">${role === 'ai' ? 'AI' : 'U'}</div>
        <div class="bubble">
            ${escapeHtml(content)}
            <span class="bubble-time">${time}</span>
        </div>
    `;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    messages.push({ role, content });
}

function addTypingIndicator() {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'message ai';
    div.id = 'typing-indicator';
    div.innerHTML = `<div class="avatar">AI</div><div class="bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

function clearChat() {
    if (!confirm('Clear all messages?')) return;
    messages = messages.slice(0, 1);
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    addMessage('ai', 'Chat cleared. How can I help you?');
}

// ===================== AI CALL =====================
async function getAIResponse() {
    addTypingIndicator();

    const body = {
        model: MODEL,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_tokens: 1024
    };

    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AI Support Hub'
            },
            body: JSON.stringify(body)
        });

        removeTypingIndicator();

        if (!res.ok) {
            const errData = await res.text();
            let msg = `Error ${res.status}`;
            try {
                const j = JSON.parse(errData);
                msg = j.error?.message || msg;
            } catch (_) {}
            throw new Error(msg);
        }

        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || 'No response from AI.';
        addMessage('ai', reply);
        return reply;

    } catch (err) {
        removeTypingIndicator();
        addMessage('ai', `⚠️ Error: ${err.message}`);
        throw err;
    }
}

// ===================== UTILS =====================
function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

// ===================== INIT =====================
loadTheme();
