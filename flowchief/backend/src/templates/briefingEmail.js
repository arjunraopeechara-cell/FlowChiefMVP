function renderBriefingEmailHtml(data) {
  const schedule = data.schedule_summary || '';
  const priorities = data.top_priorities || [];
  const emails = data.emails || [];

  const prioritiesHtml = priorities
    .map((p) => `<li><strong>${p.title}</strong>: ${p.description}</li>`)
    .join('');

  const emailsHtml = emails
    .map(
      (e) => `
      <div style="border:1px solid #e5e5e5; padding:12px; margin-bottom:12px;">
        <div><strong>From:</strong> ${e.sender}</div>
        <div><strong>Subject:</strong> ${e.subject}</div>
        <div style="margin-top:8px;"><strong>Summary:</strong> ${e.summary}</div>
        <div style="margin-top:8px;"><strong>Suggested reply:</strong><br/>${(e.suggested_reply || '').replace(/\n/g, '<br/>')}</div>
      </div>
    `
    )
    .join('');

  return `
  <div style="font-family:Arial, sans-serif; color:#111;">
    <h2>Your Daily Briefing</h2>
    <h3>Today's Schedule</h3>
    <p>${schedule}</p>

    <h3>Top Priorities</h3>
    <ol>
      ${prioritiesHtml}
    </ol>

    <h3>Important Emails</h3>
    ${emailsHtml || '<p>No important emails today.</p>'}
  </div>
  `;
}

module.exports = { renderBriefingEmailHtml };
