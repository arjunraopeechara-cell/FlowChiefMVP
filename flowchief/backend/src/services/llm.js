const SYSTEM_PROMPT = `You are an expert executive assistant that helps a busy founder organize their day. You write concise, clear summaries and priorities, and you draft polite, effective email replies in the user's preferred tone.`;

const USER_PROMPT_TEMPLATE = ({ user_profile, tone, current_date, local_time, payload_json }) => `You are preparing a daily briefing for a single user.\n\nUser profile: ${user_profile}\nTone: ${tone}\nCurrent date: ${current_date}\nLocal time: ${local_time}\n\nInputs (JSON):\n${payload_json}\n\nInstructions:\n- Return only valid JSON. No markdown.\n- Follow this exact output schema:\n{\n  "schedule_summary": "short paragraph",\n  "top_priorities": [\n    {"title": "...", "description": "..."}\n  ],\n  "emails": [\n    {\n      "id": "...",\n      "sender": "...",\n      "subject": "...",\n      "summary": "...",\n      "suggested_reply": "..."\n    }\n  ]\n}\n- Make top_priorities actionable and specific.\n- Use the user's tone.\n- Use tasks input if provided to inform priorities.\n- If there are no emails, return an empty emails array.\n- If there are no events, still provide a brief schedule_summary.\n`;

async function generateBriefingWithLLM({ userProfile, settings, events, importantEmails, tone, tasks }) {
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const payload = {
    events,
    emails: importantEmails,
    tasks: tasks || []
  };

  const userPrompt = USER_PROMPT_TEMPLATE({
    user_profile: userProfile || 'solo SaaS founder',
    tone: tone || settings.tone || 'neutral professional',
    current_date: new Date().toISOString().slice(0, 10),
    local_time: new Date().toISOString(),
    payload_json: JSON.stringify(payload, null, 2)
  });

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM error: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(content);
}

module.exports = { generateBriefingWithLLM, SYSTEM_PROMPT, USER_PROMPT_TEMPLATE };
