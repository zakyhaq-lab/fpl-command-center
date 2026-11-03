import http.server
import socketserver
import urllib.request
import json
import sys
from urllib.parse import urlparse, parse_qs

PORT = 8080
BASE_URL = "https://fantasy.premierleague.com/api"
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}

def fetch_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=12) as response:
        return json.loads(response.read().decode())

HTML_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FPL Tactical Hub - Maulana Zaky's Team</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: #080c14;
      color: #f3f4f6;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    /* Stadium Grass Pitch Pattern */
    .stadium-pitch {
      background: #064e3b;
      background-image: 
        repeating-linear-gradient(0deg, rgba(6, 78, 59, 0.95), rgba(6, 78, 59, 0.95) 45px, rgba(4, 120, 87, 0.85) 45px, rgba(4, 120, 87, 0.85) 90px),
        radial-gradient(ellipse at 50% 30%, rgba(52, 211, 153, 0.15) 0%, transparent 70%);
      box-shadow: inset 0 0 80px rgba(0,0,0,0.6);
      position: relative;
    }
    .pitch-line {
      border: 1px solid rgba(255, 255, 255, 0.22);
    }
    /* Player Card Glass */
    .player-card {
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(8px);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .player-card:hover {
      transform: translateY(-3px) scale(1.03);
      box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.3);
    }
  </style>
</head>
<body class="p-4 md:p-6 min-h-screen">
  <div class="max-w-7xl mx-auto space-y-6">
    
    <!-- Topbar Header -->
    <header class="flex flex-wrap items-center justify-between gap-4 bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-xl backdrop-blur">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-black text-black text-lg shadow-lg">
          PL
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30 uppercase tracking-wider" id="gw-badge">GW5 LIVE</span>
            <h1 class="text-xl font-black tracking-tight" id="team-name">Maulana Zaky's Team</h1>
          </div>
          <p class="text-xs text-gray-400 mt-0.5">Manager: <span class="text-gray-200 font-semibold" id="manager-name">Maulana Zaky Haq</span> • ID: <span class="font-mono text-emerald-400">2805703</span></p>
        </div>
      </div>

      <!-- Live Stat Cards -->
      <div class="flex flex-wrap items-center gap-2.5 text-xs">
        <div class="bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-2 text-center min-w-[95px]">
          <div class="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Pts</div>
          <div class="text-lg font-black text-emerald-400 font-mono mt-0.5" id="stat-points">321</div>
        </div>
        <div class="bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-2 text-center min-w-[105px]">
          <div class="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Overall Rank</div>
          <div class="text-lg font-black text-gray-100 font-mono mt-0.5" id="stat-rank">#2,622,015</div>
        </div>
        <div class="bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-2 text-center min-w-[95px]">
          <div class="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Bank Saldo</div>
          <div class="text-lg font-black text-yellow-400 font-mono mt-0.5" id="stat-bank">£0.0m</div>
        </div>
      </div>
    </header>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left: Stadium Pitch View (7 cols) -->
      <section class="lg:col-span-7 space-y-4">
        <div class="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 shadow-xl">
          <div class="flex justify-between items-center mb-3">
            <div>
              <h2 class="text-xs font-black uppercase tracking-wider text-emerald-400">Starting XI (Formasi 3-5-2)</h2>
              <p class="text-[11px] text-gray-400">Klik pemain untuk simulasi Transfer Out</p>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
              Stadium View
            </span>
          </div>

          <!-- Stadium Grass Pitch -->
          <div class="stadium-pitch rounded-xl p-5 flex flex-col justify-between min-h-[500px] border border-emerald-700/40 overflow-hidden relative shadow-2xl">
            <!-- Stadium Markings -->
            <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0 border-t pitch-line"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full pitch-line"></div>
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-b border-l border-r pitch-line"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-t border-l border-r pitch-line"></div>

            <!-- FWD Row -->
            <div class="flex justify-center gap-4 z-10 pt-2" id="pitch-fwd"></div>
            <!-- MID Row -->
            <div class="flex justify-center gap-2 flex-wrap z-10" id="pitch-mid"></div>
            <!-- DEF Row -->
            <div class="flex justify-center gap-3 flex-wrap z-10" id="pitch-def"></div>
            <!-- GK Row -->
            <div class="flex justify-center z-10 pb-2" id="pitch-gk"></div>
          </div>

          <!-- Bench Tray -->
          <div class="mt-4 pt-3 border-t border-gray-800">
            <h3 class="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Cadangan (Bench Substitutes)</h3>
            <div class="grid grid-cols-4 gap-2" id="pitch-bench"></div>
          </div>
        </div>
      </section>

      <!-- Right: Transfer Planner Lab (5 cols) -->
      <section class="lg:col-span-5 space-y-4">
        
        <!-- Planner Card -->
        <div class="bg-gray-900/80 border border-emerald-500/30 rounded-2xl p-4 shadow-xl">
          <div class="flex justify-between items-start mb-3">
            <div>
              <span class="text-[10px] tracking-wider font-extrabold uppercase text-emerald-400">Smart Transfer Lab</span>
              <h2 class="text-sm font-bold text-gray-100" id="planner-title">Pilih Pemain di Lapangan</h2>
            </div>
            <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-950 border border-gray-800 text-yellow-400" id="budget-calc">
              Budget: £0.0m
            </span>
          </div>

          <!-- Filter & Sorting Controls -->
          <div id="planner-controls" class="hidden grid grid-cols-2 gap-2 mb-3 pt-2 border-t border-gray-800">
            <div>
              <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1">Filter Klub</label>
              <select id="filter-team" onchange="fetchTargets()" class="w-full bg-gray-950 border border-gray-800 text-gray-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500">
                <option value="0">Semua Klub PL</option>
              </select>
            </div>
            <div>
              <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1">Urutan Prioritas</label>
              <select id="sort-by" onchange="fetchTargets()" class="w-full bg-gray-950 border border-gray-800 text-gray-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500">
                <option value="fdr">Jadwal Termudah (FDR)</option>
                <option value="form">Form Terpanas</option>
                <option value="points">Total Poin</option>
                <option value="cost_desc">Harga Tertinggi</option>
              </select>
            </div>
          </div>

          <div id="planner-instructions" class="text-xs text-gray-400 py-4 text-center border-t border-gray-800">
            👈 Klik kartu pemain di formasi lapangan untuk memunculkan target pengganti yang sesuai budget.
          </div>

          <!-- Recommendations Box -->
          <div id="planner-recs" class="hidden space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-gray-300">Rekomendasi Transfer In</span>
              <span class="text-emerald-400 font-mono text-[10px]" id="recs-count">0 opsi</span>
            </div>
            
            <div class="overflow-y-auto max-h-[340px] divide-y divide-gray-800/80 pr-1 text-xs" id="recs-list"></div>
          </div>
        </div>

        <!-- Simulation Impact Preview -->
        <div class="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 shadow-xl">
          <h3 class="text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Simulasi Dampak Skuad</h3>
          <div class="text-xs text-gray-400" id="impact-preview">
            <p>Pilih pemain transfer in untuk preview sisa budget & jadwal lawan.</p>
          </div>
        </div>

      </section>

    </div>
  </div>

  <script>
    let appData = null;
    let selectedPlayer = null;

    // Club Jersey Color Map
    const clubColors = {
      'MCI': '#6CABDD', 'ARS': '#EF0107', 'LIV': '#C8102E', 'CHE': '#034694',
      'MUN': '#DA291C', 'NEW': '#241F20', 'TOT': '#132257', 'AVL': '#95BFE5',
      'BHA': '#0057B8', 'BRE': '#E30613', 'EVE': '#003399', 'NFO': '#DD0000',
      'FUL': '#CC0000', 'WOL': '#FDB913', 'BOU': '#DA291C', 'CRY': '#1B458F',
      'WHU': '#7A263A', 'IPS': '#0053A0', 'LEI': '#003090', 'SOU': '#D71920'
    };

    function getJerseyIcon(teamShort) {
      const color = clubColors[teamShort] || '#10B981';
      return `
        <svg class="w-6 h-6 mx-auto drop-shadow" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 3L2 8L5 11L7 9V21H17V9L19 11L22 8L17 3H14C14 4.1 13.1 5 12 5C10.9 5 10 4.1 10 3H7Z" stroke="#000" stroke-width="1.2"/>
        </svg>
      `;
    }

    function renderCard(p) {
      const isSelected = selectedPlayer && selectedPlayer.element_id === p.element_id;
      const capBadge = p.is_captain ? '<span class="bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-[9px] px-1.5 py-0.2 rounded shadow">C</span>' : 
                       p.is_vice_captain ? '<span class="bg-gray-300 text-black font-bold text-[9px] px-1 rounded">V</span>' : '';
      
      const borderClass = isSelected ? 'border-2 border-emerald-400 ring-4 ring-emerald-500/30' : 
                          p.is_captain ? 'border border-yellow-500 shadow-yellow-500/20 shadow-md' : 'border border-gray-700/60';

      return `
        <div onclick="selectTransferOut(${p.element_id})" class="player-card cursor-pointer rounded-xl p-2 text-center w-[92px] shadow-lg ${borderClass}">
          ${getJerseyIcon(p.team_short)}
          <div class="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5">${p.team_short}</div>
          <div class="text-[11px] font-bold text-gray-100 truncate mt-0.5 flex items-center justify-center gap-1">
            ${p.web_name} ${capBadge}
          </div>
          <div class="text-[11px] font-mono font-black text-yellow-400 mt-1">${p.event_points} Pts</div>
          <div class="text-[9px] text-gray-400 mt-0.5">£${(p.now_cost / 10).toFixed(1)}m</div>
        </div>
      `;
    }

    function renderPitch() {
      if (!appData) return;
      const starters = appData.picks.filter(p => p.position <= 11);
      const bench = appData.picks.filter(p => p.position > 11);

      document.getElementById('pitch-gk').innerHTML = starters.filter(p => p.element_type === 1).map(p => renderCard(p)).join('');
      document.getElementById('pitch-def').innerHTML = starters.filter(p => p.element_type === 2).map(p => renderCard(p)).join('');
      document.getElementById('pitch-mid').innerHTML = starters.filter(p => p.element_type === 3).map(p => renderCard(p)).join('');
      document.getElementById('pitch-fwd').innerHTML = starters.filter(p => p.element_type === 4).map(p => renderCard(p)).join('');
      document.getElementById('pitch-bench').innerHTML = bench.map(p => renderCard(p)).join('');
    }

    async function selectTransferOut(elementId) {
      selectedPlayer = appData.picks.find(p => p.element_id === elementId);
      renderPitch();

      const bank = appData.entry.last_deadline_bank || 0;
      const totalBudget = selectedPlayer.now_cost + bank;

      document.getElementById('planner-title').innerText = `Ganti: ${selectedPlayer.web_name} (£${(selectedPlayer.now_cost/10).toFixed(1)}m)`;
      document.getElementById('budget-calc').innerText = `Budget: £${(totalBudget/10).toFixed(1)}m`;
      document.getElementById('planner-instructions').classList.add('hidden');
      document.getElementById('planner-controls').classList.remove('hidden');
      document.getElementById('planner-recs').classList.remove('hidden');

      fetchTargets();
    }

    async function fetchTargets() {
      if (!selectedPlayer) return;
      const bank = appData.entry.last_deadline_bank || 0;
      const totalBudget = selectedPlayer.now_cost + bank;
      const teamFilter = document.getElementById('filter-team').value;
      const sortBy = document.getElementById('sort-by').value;

      try {
        const res = await fetch(`/api/transfer-targets?type=${selectedPlayer.element_type}&max_cost=${totalBudget}&team=${teamFilter}&sort=${sortBy}`);
        const targets = await res.json();

        const filtered = targets.filter(t => t.id !== selectedPlayer.element_id);
        document.getElementById('recs-count').innerText = `${filtered.length} opsi`;

        document.getElementById('recs-list').innerHTML = filtered.map(t => {
          const fdrColor = t.next_fixture_fdr <= 2 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 
                           t.next_fixture_fdr === 3 ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-rose-500/20 text-rose-400 border-rose-500/40';

          return `
            <div class="py-2.5 flex items-center justify-between hover:bg-gray-800/60 px-2 rounded-lg cursor-pointer transition" onclick="simulateSwap(${t.id})">
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-bold text-gray-100 text-xs">${t.web_name}</span>
                  <span class="text-[9px] text-gray-400 uppercase font-semibold">${t.team_name}</span>
                  <span class="text-[9px] font-mono px-1.5 py-0.2 rounded border ${fdrColor}">
                    ${t.next_fixture_opp} FDR ${t.next_fixture_fdr}
                  </span>
                </div>
                <div class="text-[10px] text-gray-400 mt-0.5">Form: ${t.form} • Total: ${t.total_points} pts</div>
              </div>
              <div class="text-right">
                <div class="font-mono font-bold text-emerald-400">£${(t.now_cost / 10).toFixed(1)}m</div>
                <button class="mt-0.5 px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black font-bold">
                  Pilih
                </button>
              </div>
            </div>
          `;
        }).join('');

      } catch (err) {
        console.error(err);
      }
    }

    function simulateSwap(targetId) {
      const bank = appData.entry.last_deadline_bank || 0;
      fetch(`/api/transfer-targets?type=${selectedPlayer.element_type}&max_cost=2000`)
        .then(r => r.json())
        .then(targets => {
          const target = targets.find(t => t.id === targetId);
          if (!target) return;
          const remainingBank = bank + selectedPlayer.now_cost - target.now_cost;
          const formDiff = (parseFloat(target.form) - parseFloat(selectedPlayer.form || 0)).toFixed(1);

          document.getElementById('impact-preview').innerHTML = `
            <div class="bg-gray-950 p-3 rounded-xl border border-gray-800 space-y-2">
              <div class="flex justify-between font-bold text-xs text-gray-200">
                <span>OUT: <span class="text-rose-400">${selectedPlayer.web_name}</span></span>
                <span>IN: <span class="text-emerald-400">${target.web_name}</span></span>
              </div>
              <div class="text-[11px] text-gray-300 flex justify-between pt-1 border-t border-gray-800/80">
                <span>Sisa Budget Bank:</span>
                <span class="font-mono font-bold ${remainingBank >= 0 ? 'text-emerald-400' : 'text-rose-400'}">£${(remainingBank/10).toFixed(1)}m</span>
              </div>
              <div class="text-[11px] text-gray-300 flex justify-between">
                <span>Perubahan Form (Performa):</span>
                <span class="font-mono font-bold ${formDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${formDiff >= 0 ? '+' + formDiff : formDiff} pts/match</span>
              </div>
              <div class="text-[11px] text-gray-300 flex justify-between">
                <span>Lawan Berikutnya:</span>
                <span class="font-mono font-bold text-emerald-300">${target.next_fixture_opp} (FDR ${target.next_fixture_fdr})</span>
              </div>
            </div>
          `;
        });
    }

    async function loadData() {
      try {
        const res = await fetch('/api/user-team?id=2805703');
        appData = await res.json();

        // Populate Teams Dropdown
        const teamSelect = document.getElementById('filter-team');
        (appData.teams || []).forEach(t => {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.innerText = t.name;
          teamSelect.appendChild(opt);
        });

        // Fill Profile
        document.getElementById('team-name').innerText = appData.entry.name;
        document.getElementById('manager-name').innerText = appData.entry.player_first_name + ' ' + appData.entry.player_last_name;
        document.getElementById('gw-badge').innerText = 'GAMEWEEK ' + appData.current_event + ' LIVE';
        document.getElementById('stat-points').innerText = (appData.entry.summary_overall_points || 0).toLocaleString();
        document.getElementById('stat-rank').innerText = '#' + (appData.entry.summary_overall_rank || 0).toLocaleString();
        document.getElementById('stat-bank').innerText = '£' + ((appData.entry.last_deadline_bank || 0) / 10).toFixed(1) + 'm';

        renderPitch();
      } catch (err) {
        console.error(err);
      }
    }

    loadData();
  </script>
</body>
</html>
"""

class FplProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api/user-team"):
            try:
                static_data = fetch_json(f"{BASE_URL}/bootstrap-static/")
                teams_map = {t["id"]: t["short_name"] for t in static_data.get("teams", [])}
                elements_map = {e["id"]: e for e in static_data.get("elements", [])}
                
                entry_data = fetch_json(f"{BASE_URL}/entry/2805703/")
                curr_event = entry_data.get("current_event", 5)

                picks_data = fetch_json(f"{BASE_URL}/entry/2805703/event/{curr_event}/picks/")
                
                picks_enriched = []
                for pick in picks_data.get("picks", []):
                    el_id = pick["element"]
                    el_info = elements_map.get(el_id, {})
                    picks_enriched.append({
                        "element_id": el_id,
                        "position": pick.get("position"),
                        "multiplier": pick.get("multiplier"),
                        "is_captain": pick.get("is_captain"),
                        "is_vice_captain": pick.get("is_vice_captain"),
                        "web_name": el_info.get("web_name", "Unknown"),
                        "team_short": teams_map.get(el_info.get("team"), "-"),
                        "element_type": el_info.get("element_type", 1),
                        "now_cost": el_info.get("now_cost", 0),
                        "event_points": el_info.get("event_points", 0),
                        "total_points": el_info.get("total_points", 0),
                        "form": el_info.get("form", "0.0")
                    })

                payload = {
                    "entry": entry_data,
                    "current_event": curr_event,
                    "teams": [{"id": t["id"], "name": t["name"]} for t in static_data.get("teams", [])],
                    "picks": picks_enriched
                }

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps(payload).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())

        elif self.path.startswith("/api/transfer-targets"):
            try:
                query = parse_qs(urlparse(self.path).query)
                el_type = int(query.get("type", [1])[0])
                max_cost = int(query.get("max_cost", [2000])[0])
                filter_team = int(query.get("team", [0])[0])
                sort_mode = query.get("sort", ["fdr"])[0]

                static_data = fetch_json(f"{BASE_URL}/bootstrap-static/")
                teams_map = {t["id"]: t["short_name"] for t in static_data.get("teams", [])}
                elements = static_data.get("elements", [])
                
                curr_event = 5
                for ev in static_data.get("events", []):
                    if ev.get("is_current"):
                        curr_event = ev.get("id", 5)
                        break
                next_event = curr_event + 1

                fixtures_data = fetch_json(f"{BASE_URL}/fixtures/?event={next_event}")
                team_fdr_map = {}
                for fix in fixtures_data:
                    h = fix["team_h"]
                    a = fix["team_a"]
                    team_fdr_map[h] = {
                        "fdr": fix["team_h_difficulty"],
                        "opp": f"{teams_map.get(a, 'PL')} (H)"
                    }
                    team_fdr_map[a] = {
                        "fdr": fix["team_a_difficulty"],
                        "opp": f"{teams_map.get(h, 'PL')} (A)"
                    }

                candidates = []
                for el in elements:
                    if el.get("element_type") != el_type:
                        continue
                    if el.get("now_cost", 0) > max_cost:
                        continue
                    if el.get("status") == "u":
                        continue
                    if filter_team > 0 and el.get("team") != filter_team:
                        continue

                    t_id = el.get("team")
                    fdr_info = team_fdr_map.get(t_id, {"fdr": 3, "opp": "TBD"})

                    candidates.append({
                        "id": el["id"],
                        "web_name": el["web_name"],
                        "team_name": teams_map.get(t_id, "PL"),
                        "now_cost": el["now_cost"],
                        "total_points": el["total_points"],
                        "form": el.get("form", "0.0"),
                        "next_fixture_fdr": fdr_info["fdr"],
                        "next_fixture_opp": fdr_info["opp"],
                        "selected_by_percent": el.get("selected_by_percent", "0.0")
                    })

                if sort_mode == "fdr":
                    candidates.sort(key=lambda x: (x["next_fixture_fdr"], -float(x["form"])))
                elif sort_mode == "form":
                    candidates.sort(key=lambda x: float(x["form"]), reverse=True)
                elif sort_mode == "points":
                    candidates.sort(key=lambda x: x["total_points"], reverse=True)
                elif sort_mode == "cost_desc":
                    candidates.sort(key=lambda x: x["now_cost"], reverse=True)

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps(candidates[:20]).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())

        else:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(HTML_PAGE.encode())

def run():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), FplProxyHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    run()
