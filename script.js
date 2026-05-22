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
  const [profileRes, statsRes] = await Promise.all([
    fetch(`${apiBase}/api/players/${encodeURIComponent(id)}`),
    fetch(`${apiBase}/api/players/${encodeURIComponent(id)}/stats`)
  ]);

  if (profileRes.status === 404) {
    render(`<p class="error">Player not found.</p>`);
    return;
  }
  if (!profileRes.ok) throw new Error(`profile HTTP ${profileRes.status}`);

  const profile = await profileRes.json();
  const stats = statsRes.ok ? (await statsRes.json()).stats : [];

  render(renderProfile(profile, stats));
}

function renderProfile(profile, stats) {
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

  if (stats.length === 0) {
    return titleHtml + `<p class="status">No matches played yet.</p>`;
  }

  const grouped = groupByTournament(stats);

  return titleHtml + renderStatsTable(grouped, stats);
}

function renderStatsTable(grouped, allStats) {
  const avg = (total, games) => games === 0 ? "—" : (total / games).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });

  const bodyRows = grouped.map(g => {
    const games = g.rows.length;
    const goals = sum(g.rows, "goals");
    return `<tr>
      <td>${escape(g.clubName)}</td>
      <td>${escape(g.tournamentName)}</td>
      <td class="num">${escape(g.season)}</td>
      <td class="num">${games}</td>
      <td class="num">${goals}</td>
      <td class="num">${avg(goals, games)}</td>
      <td class="num">${sum(g.rows, "yellowCards")}</td>
      <td class="num">${sum(g.rows, "twoMinuteSuspensions")}</td>
      <td class="num">${sum(g.rows, "redCards")}</td>
    </tr>`;
  }).join("\n");

  const tg = allStats.length;
  const tGoals = sum(allStats, "goals");
  const totalRow = `<tr>
    <td></td>
    <td><strong>Total</strong></td>
    <td class="num"></td>
    <td class="num">${tg}</td>
    <td class="num">${tGoals}</td>
    <td class="num">${avg(tGoals, tg)}</td>
    <td class="num">${sum(allStats, "yellowCards")}</td>
    <td class="num">${sum(allStats, "twoMinuteSuspensions")}</td>
    <td class="num">${sum(allStats, "redCards")}</td>
  </tr>`;

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

function groupByTournament(stats) {
  const map = new Map();
  for (const s of stats) {
    const key = `${s.teamId}|${s.tournamentId}|${s.season}`;
    if (!map.has(key)) {
      map.set(key, {
        teamId: s.teamId,
        clubName: s.clubName ?? s.teamId,
        tournamentId: s.tournamentId,
        tournamentName: s.tournamentName ?? `Tournament ${s.tournamentId}`,
        season: s.season,
        rows: []
      });
    }
    map.get(key).rows.push(s);
  }
  return [...map.values()].sort((a, b) => {
    if (b.season !== a.season) return b.season.localeCompare(a.season);
    if (a.clubName !== b.clubName) return a.clubName.localeCompare(b.clubName);
    return a.tournamentName.localeCompare(b.tournamentName);
  });
}

function sum(rows, key) {
  return rows.reduce((acc, r) => acc + (r[key] ?? 0), 0);
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
