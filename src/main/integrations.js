// BYOK (bring-your-own-key) integrations: push AI-extracted tasks straight to
// the user's own Notion database or Linear team. Nothing routes through any
// server we control - these are direct calls to Notion/Linear using tokens
// the user pastes into Settings -> Integrations.

function extractTaskLines(text) {
  return String(text || '')
    .split('\n')
    .map(line => line.trim())
    .map(line => line
      .replace(/^-\s*\[[ xX]\]\s*/, '') // "- [ ] task" / "- [x] task"
      .replace(/^\*\*[^*]+:\*\*\s*/, '') // "**Speaker 1:** task" (from meeting transcripts)
      .replace(/^[-*]\s*/, '')) // plain "- task" / "* task"
    .filter(line => line && !/^#/.test(line));
}

async function sendTasksToNotion({ token, database, text }) {
  const tasks = extractTaskLines(text);
  if (tasks.length === 0) return { count: 0 };

  let count = 0;
  for (const task of tasks) {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: database },
        // Assumes the database's title property is named "Name" (Notion's default
        // when a database is created). If it was renamed, update this key to match.
        properties: {
          Name: { title: [{ text: { content: task.slice(0, 200) } }] }
        }
      })
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.message || `Notion API error (HTTP ${res.status})`);
    }
    count += 1;
  }
  return { count };
}

async function sendTasksToLinear({ token, team, text }) {
  const tasks = extractTaskLines(text);
  if (tasks.length === 0) return { count: 0 };

  let count = 0;
  for (const task of tasks) {
    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      },
      body: JSON.stringify({
        query: 'mutation IssueCreate($input: IssueCreateInput!) { issueCreate(input: $input) { success } }',
        variables: { input: { teamId: team, title: task.slice(0, 255) } }
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.errors) {
      throw new Error(data.errors?.[0]?.message || `Linear API error (HTTP ${res.status})`);
    }
    count += 1;
  }
  return { count };
}

module.exports = { sendTasksToNotion, sendTasksToLinear, extractTaskLines };
