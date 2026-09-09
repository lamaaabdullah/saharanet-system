
const AI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

// Persists for the lifetime of the tab, so a conversation keeps its context
const aiChatSessionId = crypto.randomUUID();

async function sendAIChatMessage() {
    const input = document.getElementById('ai-chat-input');
    const message = input.value.trim();
    if (!message) return;

    const log = document.getElementById('ai-chat-log');
    appendChatBubble(log, message, 'customer');
    input.value = '';

    const typingBubble = appendChatBubble(log, 'Typing...', 'admin');

    let customerId = null;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: customer } = await supabase.from('customer').select('customer_id').eq('user_id', user.id).single();
        customerId = customer?.customer_id ?? null;
    }

    try {
        const res = await fetch(AI_CHAT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, session_id: aiChatSessionId, customer_id: customerId })
        });
        const data = await res.json();
        typingBubble.remove();

        if (data.reply) {
            appendChatBubble(log, data.reply, 'admin');
        } else {
            appendChatBubble(log, 'Sorry, something went wrong. Please try the Customer Support option instead.', 'admin');
        }
    } catch (err) {
        typingBubble.remove();
        appendChatBubble(log, 'Could not reach the assistant right now. Please try the Customer Support option instead.', 'admin');
    }

    log.scrollTop = log.scrollHeight;
}

function appendChatBubble(container, text, senderType) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + senderType;
    bubble.innerText = text;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return bubble;
}
