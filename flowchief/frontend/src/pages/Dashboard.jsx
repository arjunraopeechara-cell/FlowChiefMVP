import React, { useEffect, useState } from 'react';
import { api } from '../api';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const data = await api('/api/me');
      setMe(data);
      setSettings(data.settings);
    } catch (err) {
      setMessage('Please log in again.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!me || !settings) {
    return <div className="page"><div className="card">Loading...</div></div>;
  }

  function toggleDay(day) {
    const set = new Set(settings.workDays.split(','));
    if (set.has(day)) set.delete(day);
    else set.add(day);
    setSettings({ ...settings, workDays: Array.from(set).join(',') });
  }

  async function saveSettings() {
    setMessage('');
    try {
      const updated = await api('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      setSettings(updated);
      setMessage('Saved.');
    } catch (err) {
      setMessage('Save failed.');
    }
  }

  async function sendTest() {
    setMessage('');
    try {
      await api('/api/briefing/test', { method: 'POST' });
      setMessage('Test briefing sent.');
    } catch (err) {
      setMessage('Test failed.');
    }
  }

  return (
    <div className="page">
      <div className="card wide">
        <h1>Welcome, {me.email}</h1>
        <div className="row">
          <div>
            <div className="label">Calendar connected</div>
            <div>{me.integrations.google ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <div className="label">Email connected</div>
            <div>{me.integrations.google ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <a className="button" href="/api/integrations/google/start">Connect Google</a>
          </div>
        </div>

        <h2>Settings</h2>
        <div className="grid">
          <div>
            <label>Time zone</label>
            <input value={settings.timeZone} onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })} />
          </div>
          <div>
            <label>Briefing time</label>
            <input type="time" value={settings.briefingTime} onChange={(e) => setSettings({ ...settings, briefingTime: e.target.value })} />
          </div>
          <div>
            <label>Tone</label>
            <select value={settings.tone} onChange={(e) => setSettings({ ...settings, tone: e.target.value })}>
              <option value="casual">Casual</option>
              <option value="neutral professional">Neutral</option>
              <option value="formal">Formal</option>
            </select>
          </div>
        </div>

        <div className="section">
          <div className="label">Work days</div>
          <div className="row">
            {days.map((d) => (
              <label key={d} className="checkbox">
                <input type="checkbox" checked={settings.workDays.split(',').includes(d)} onChange={() => toggleDay(d)} />
                {d}
              </label>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="label">Include sections</div>
          <div className="row">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={settings.includeCalendar}
                onChange={(e) => setSettings({ ...settings, includeCalendar: e.target.checked })}
              />
              Calendar
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={settings.includeEmails}
                onChange={(e) => setSettings({ ...settings, includeEmails: e.target.checked })}
              />
              Emails
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={settings.includeReplies}
                onChange={(e) => setSettings({ ...settings, includeReplies: e.target.checked })}
              />
              Suggested replies
            </label>
          </div>
        </div>

        <div className="section">
          <div className="label">Tasks (one per line)</div>
          <textarea
            rows="6"
            value={settings.tasksText || ''}
            onChange={(e) => setSettings({ ...settings, tasksText: e.target.value })}
          />
        </div>

        <div className="row">
          <button onClick={saveSettings}>Save settings</button>
          <button className="secondary" onClick={sendTest}>Send test briefing now</button>
        </div>
        {message && <div className="muted">{message}</div>}
      </div>
    </div>
  );
}
