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
  const blocks = grouped.map(g => renderTournamentBlock(g));
  const total = renderTotalsBlock(stats);

  return titleHtml + blocks.join("") + total;
}

function groupByTournament(stats) {
  const map = new Map();
  for (const s of stats) {
    const key = `${s.tournamentId}|${s.season}`;
    if (!map.has(key)) {
      map.set(key, {
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
    return a.tournamentName.localeCompare(b.tournamentName);
  });
}

function renderTournamentBlock(g) {
  return renderBlock(`${escape(g.tournamentName)} — ${escape(g.season)}`, g.rows);
}

function renderTotalsBlock(stats) {
  return renderBlock("Total", stats, /* total */ true);
}

function renderBlock(title, rows, total = false) {
  const games = rows.length;
  const totalGoals = sum(rows, "goals");
  const totalYellow = sum(rows, "yellowCards");
  const total2Min = sum(rows, "twoMinuteSuspensions");
  const totalRed = sum(rows, "redCards");

  const avg = n => games === 0 ? "0.00" : (n / games).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });

  const cls = total ? "tournament tournament-total" : "tournament";

  return `
    <section class="${cls}">
      <h2 class="tournament-title">${title}</h2>
      <table>
        <tr><td class="label">Games</td>            <td class="value">${games}</td></tr>
        <tr><td class="label">Total goals</td>       <td class="value">${totalGoals}</td></tr>
        <tr><td class="label">Avg goals / game</td>  <td class="value">${avg(totalGoals)}</td></tr>
        <tr><td class="label">Avg yellow / game</td> <td class="value">${avg(totalYellow)}</td></tr>
        <tr><td class="label">Avg 2-min / game</td>  <td class="value">${avg(total2Min)}</td></tr>
        <tr><td class="label">Total red cards</td>   <td class="value">${totalRed}</td></tr>
      </table>
    </section>
  `;
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
