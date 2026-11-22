const WEAVAX_PROXY_URL = 'https://weavax-ai-proxy.onrender.com/api/ai';
const WEAVAX_APP_SECRET = 'EL_MISMO_SECRETO_QUE_PUSISTE_EN_RENDER';

export async function callWeavaxAI({
    provider = 'groq',
    prompt,
    systemPrompt = 'Eres el asistente inteligente de WeaVax.',
    model = null,
    imageBase64 = null
}) {
    const response = await fetch(WEAVAX_PROXY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-weavax-key': WEAVAX_APP_SECRET
        },
        body: JSON.stringify({
            provider,
            prompt,
            systemPrompt,
            model,
            imageBase64
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Error al conectar con el servidor de IA de WeaVax');
    }
    return data.text;
}