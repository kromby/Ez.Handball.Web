const root = document.getElementById("root");
const apiBase = window.API_BASE_URL ?? "";

const params = new URLSearchParams(window.location.search);
const playerId = params.get("playerId");

if (!playerId) {
  render(`<p class="status">No player selected. Add <code>?playerId=…</code> to the URL.</p>`);
} else {
  loadPlayer(playerId).catch(err => {
    render(`<p class="error">Failed to load: ${escape(err.message)}</p>`);
  });
}

async function loadPlayer(id) {
  const [profileRes, historyRes] = await Promise.all([
    fetch(`${apiBase}/api/players/${encodeURIComponent(id)}`),
    fetch(`${apiBase}/api/players/${encodeURIComponent(id)}/history`)
  ]);

  if (profileRes.status === 404) {
    render(`<p class="error">Player not found.</p>`);
    return;
  }
  if (!profileRes.ok) throw new Error(`profile HTTP ${profileRes.status}`);

  const profile = await profileRes.json();

  let history = { history: [], totals: null };
  if (historyRes.ok) {
    history = await historyRes.json();
  }

  render(renderProfile(profile, history));
}

function renderProfile(profile, history) {
  const headerBits = [];
  if (profile.clubName) headerBits.push(escape(profile.clubName));
  if (profile.age !== null && profile.age !== undefined) headerBits.push(`Age ${profile.age}`);
  if (profile.dateOfBirth) headerBits.push(formatBirthday(profile.dateOfBirth));

  const titleHtml = `
    <h1 class="title">
      ${profile.jerseyNumber ? `<span class="jersey">#${escape(profile.jerseyNumber)}</span>` : ""}
      ${escape(profile.name)}
    </h1>
    <p class="subtitle">${headerBits.join(" · ")}</p>
  `;

  if (!history.history || history.history.length === 0) {
    return titleHtml + `<p class="status">No matches played yet.</p>`;
  }

  return titleHtml + renderStatsTable(history.history, history.totals);
}

function renderStatsTable(entries, totals) {
  const cell = (value) => value === null || value === undefined ? "—" : escape(String(value));
  const avg = (value) => value.toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });

  const bodyRows = entries.map(e => `
    <tr>
      <td>${cell(e.clubName)}</td>
      <td>${cell(e.tournamentName)}</td>
      <td class="num">${escape(e.season)}</td>
      <td class="num">${e.games}</td>
      <td class="num">${e.totalGoals}</td>
      <td class="num">${avg(e.avgGoals)}</td>
      <td class="num">${e.totalYellowCards}</td>
      <td class="num">${e.totalTwoMinuteSuspensions}</td>
      <td class="num">${e.totalRedCards}</td>
    </tr>
  `).join("\n");

  const totalRow = totals ? `
    <tr>
      <td></td>
      <td><strong>Total</strong></td>
      <td class="num"></td>
      <td class="num">${totals.games}</td>
      <td class="num">${totals.totalGoals}</td>
      <td class="num">${avg(totals.avgGoals)}</td>
      <td class="num">${totals.totalYellowCards}</td>
      <td class="num">${totals.totalTwoMinuteSuspensions}</td>
      <td class="num">${totals.totalRedCards}</td>
    </tr>
  ` : "";

  return `
    <table class="stats-table">
      <thead>
        <tr>
          <th>Club</th>
          <th>Tournament</th>
          <th class="num">Season</th>
          <th class="num">Games</th>
          <th class="num">Goals</th>
          <th class="num">Avg goals</th>
          <th class="num">Yellow</th>
          <th class="num">2-min</th>
          <th class="num">Red</th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
      <tfoot>${totalRow}</tfoot>
    </table>
  `;
}

function formatBirthday(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[c]));
}

function render(html) {
  root.innerHTML = html;
}
