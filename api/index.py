from http.server import BaseHTTPRequestHandler
import urllib.request
import json
import time
import os
from urllib.parse import urlparse, parse_qs

BASE_URL = "https://fantasy.premierleague.com/api"
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}

# In-memory cache with TTL (in seconds)
CACHE = {}

def fetch_json(url, ttl=300):
    now = time.time()
    if url in CACHE:
        data, ts = CACHE[url]
        if now - ts < ttl:
            return data
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=12) as response:
        data = json.loads(response.read().decode())
        CACHE[url] = (data, now)
        return data

def get_html_page():
    candidates = [
        os.path.join(os.getcwd(), "public", "index.html"),
        os.path.join(os.getcwd(), "index.html"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "index.html"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "index.html"),
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    return f.read()
            except Exception:
                pass
    return "<!DOCTYPE html><html><body><h1>Loading FPL Command Center...</h1><script>location.reload();</script></body></html>"

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urlparse(self.path)
        query = parse_qs(parsed_url.query)
        
        # Determine actual request path
        req_path = query.get("__route", [None])[0]
        if not req_path:
            req_path = self.headers.get("x-vercel-matched-path") or self.headers.get("x-forwarded-uri") or parsed_url.path
        if "?" in req_path:
            req_path = req_path.split("?")[0]
        if len(req_path) > 1 and req_path.endswith("/"):
            req_path = req_path[:-1]

        # 0. Serve HTML if root or index requested
        if req_path in ("/", "/index.html", ""):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Cache-Control", "public, max-age=0, must-revalidate")
            self.end_headers()
            self.wfile.write(get_html_page().encode())
            return
        
        # API 0: Image Proxy (CORS and Canvas Safe)
        elif req_path == "/api/image-proxy":
            try:
                target_url = query.get("url", [None])[0]
                if not target_url or not (
                    target_url.startswith("https://resources.premierleague.com/") or
                    target_url.startswith("https://fantasy.premierleague.com/")
                ):
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b"Invalid target URL")
                    return
                req = urllib.request.Request(target_url, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=10) as resp:
                    content_type = resp.headers.get("Content-Type", "image/png")
                    img_data = resp.read()
                    self.send_response(200)
                    self.send_header("Content-Type", content_type)
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.send_header("Cache-Control", "public, max-age=86400")
                    self.end_headers()
                    self.wfile.write(img_data)
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())
            return

        # API 1: User Team Profile, Picks, History, and Leagues
        elif req_path == "/api/user-team":
            try:
                static_data = fetch_json(f"{BASE_URL}/bootstrap-static/", ttl=600)
                teams_map = {t["id"]: t for t in static_data.get("teams", [])}
                elements_map = {e["id"]: e for e in static_data.get("elements", [])}

                # Determine current event
                curr_event = 5
                for ev in static_data.get("events", []):
                    if ev.get("is_current"):
                        curr_event = ev.get("id", 5)
                        break

                team_id = query.get("id", ["2805703"])[0]
                entry_data = fetch_json(f"{BASE_URL}/entry/{team_id}/", ttl=180)
                curr_event = entry_data.get("current_event", curr_event)
                hist_data = fetch_json(f"{BASE_URL}/entry/{team_id}/history/", ttl=180)
                picks_data = fetch_json(f"{BASE_URL}/entry/{team_id}/event/{curr_event}/picks/", ttl=180)

                # Fetch upcoming fixtures for next 3 gameweeks
                fixtures_by_team = {t["id"]: [] for t in static_data.get("teams", [])}
                for gw in range(curr_event + 1, min(curr_event + 4, 39)):
                    try:
                        fix_list = fetch_json(f"{BASE_URL}/fixtures/?event={gw}", ttl=600)
                        for f in fix_list:
                            h, a = f["team_h"], f["team_a"]
                            if h in fixtures_by_team:
                                fixtures_by_team[h].append({
                                    "gw": gw,
                                    "opp": teams_map.get(a, {}).get("short_name", "PL"),
                                    "is_home": True,
                                    "fdr": f.get("team_h_difficulty", 3)
                                })
                            if a in fixtures_by_team:
                                fixtures_by_team[a].append({
                                    "gw": gw,
                                    "opp": teams_map.get(h, {}).get("short_name", "PL"),
                                    "is_home": False,
                                    "fdr": f.get("team_a_difficulty", 3)
                                })
                    except Exception as e:
                        pass

                # Enrich picks
                picks_enriched = []
                for pick in picks_data.get("picks", []):
                    el_id = pick["element"]
                    el = elements_map.get(el_id, {})
                    t_info = teams_map.get(el.get("team"), {})
                    t_id = el.get("team")

                    picks_enriched.append({
                        "element_id": el_id,
                        "position": pick.get("position"),
                        "multiplier": pick.get("multiplier"),
                        "is_captain": pick.get("is_captain"),
                        "is_vice_captain": pick.get("is_vice_captain"),
                        "web_name": el.get("web_name", "Unknown"),
                        "code": el.get("code", 0),
                        "team_code": t_info.get("code", 0),
                        "team_short": t_info.get("short_name", "-"),
                        "team_name": t_info.get("name", "PL"),
                        "element_type": el.get("element_type", 1),
                        "now_cost": el.get("now_cost", 0),
                        "event_points": el.get("event_points", 0),
                        "total_points": el.get("total_points", 0),
                        "form": el.get("form", "0.0"),
                        "ep_next": el.get("ep_next", "0.0"),
                        "status": el.get("status", "a"),
                        "news": el.get("news", ""),
                        "chance_of_playing_next_round": el.get("chance_of_playing_next_round"),
                        "selected_by_percent": el.get("selected_by_percent", "0.0"),
                        "upcoming_fixtures": fixtures_by_team.get(t_id, [])
                    })

                # Determine Next Event for Deadline Timer
                next_event = None
                for ev in static_data.get("events", []):
                    if ev.get("is_next"):
                        next_event = {
                            "id": ev.get("id"),
                            "name": ev.get("name"),
                            "deadline_time": ev.get("deadline_time"),
                            "deadline_time_epoch": ev.get("deadline_time_epoch")
                        }
                        break
                if not next_event:
                    for ev in static_data.get("events", []):
                        if ev.get("id") == curr_event + 1:
                            next_event = {
                                "id": ev.get("id"),
                                "name": ev.get("name"),
                                "deadline_time": ev.get("deadline_time"),
                                "deadline_time_epoch": ev.get("deadline_time_epoch")
                            }
                            break

                # Market Trends & Price Alerts
                all_elements = static_data.get("elements", [])
                
                # Top 5 Transfers IN across league
                sorted_in = sorted(all_elements, key=lambda x: x.get("transfers_in_event", 0), reverse=True)[:5]
                top_in = []
                for el in sorted_in:
                    t_info = teams_map.get(el.get("team"), {})
                    top_in.append({
                        "id": el["id"],
                        "web_name": el["web_name"],
                        "code": el["code"],
                        "team_short": t_info.get("short_name", "PL"),
                        "element_type": el.get("element_type", 1),
                        "now_cost": el.get("now_cost", 0),
                        "transfers_in_event": el.get("transfers_in_event", 0),
                        "net_transfers": el.get("transfers_in_event", 0) - el.get("transfers_out_event", 0),
                        "form": el.get("form", "0.0"),
                        "selected_by_percent": el.get("selected_by_percent", "0.0")
                    })

                # Top 5 Transfers OUT across league
                sorted_out = sorted(all_elements, key=lambda x: x.get("transfers_out_event", 0), reverse=True)[:5]
                top_out = []
                for el in sorted_out:
                    t_info = teams_map.get(el.get("team"), {})
                    top_out.append({
                        "id": el["id"],
                        "web_name": el["web_name"],
                        "code": el["code"],
                        "team_short": t_info.get("short_name", "PL"),
                        "element_type": el.get("element_type", 1),
                        "now_cost": el.get("now_cost", 0),
                        "transfers_out_event": el.get("transfers_out_event", 0),
                        "net_transfers": el.get("transfers_in_event", 0) - el.get("transfers_out_event", 0),
                        "form": el.get("form", "0.0"),
                        "selected_by_percent": el.get("selected_by_percent", "0.0")
                    })

                # Squad Price Change & Market Pressure Alerts
                squad_alerts = []
                for pick in picks_data.get("picks", []):
                    el_id = pick["element"]
                    el = elements_map.get(el_id, {})
                    t_info = teams_map.get(el.get("team"), {})
                    tin = el.get("transfers_in_event", 0)
                    tout = el.get("transfers_out_event", 0)
                    net = tin - tout

                    if net < -35000 or (tout > 60000 and net < 0):
                        squad_alerts.append({
                            "id": el["id"],
                            "web_name": el["web_name"],
                            "code": el["code"],
                            "team_short": t_info.get("short_name", "PL"),
                            "element_type": el.get("element_type", 1),
                            "now_cost": el.get("now_cost", 0),
                            "trend": "fall",
                            "risk_label": "Risiko Turun Harga",
                            "net_transfers": net,
                            "transfers_in": tin,
                            "transfers_out": tout,
                            "form": el.get("form", "0.0"),
                            "news": el.get("news", "")
                        })
                    elif net > 35000 or (tin > 60000 and net > 0):
                        squad_alerts.append({
                            "id": el["id"],
                            "web_name": el["web_name"],
                            "code": el["code"],
                            "team_short": t_info.get("short_name", "PL"),
                            "element_type": el.get("element_type", 1),
                            "now_cost": el.get("now_cost", 0),
                            "trend": "rise",
                            "risk_label": "Potensi Naik Harga",
                            "net_transfers": net,
                            "transfers_in": tin,
                            "transfers_out": tout,
                            "form": el.get("form", "0.0"),
                            "news": el.get("news", "")
                        })

                squad_alerts.sort(key=lambda x: (0 if x["trend"] == "fall" else 1, abs(x["net_transfers"])), reverse=True)

                payload = {
                    "entry": entry_data,
                    "current_event": curr_event,
                    "next_event": next_event,
                    "market_trends": {
                        "top_in": top_in,
                        "top_out": top_out,
                        "squad_alerts": squad_alerts
                    },
                    "history": hist_data,
                    "leagues": entry_data.get("leagues", {}).get("classic", []),
                    "teams": [{"id": t["id"], "name": t["name"], "short_name": t["short_name"], "code": t["code"]} for t in static_data.get("teams", [])],
                    "picks": picks_enriched
                }

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps(payload).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())

        # API 2: Transfer Target Recommendations
        elif req_path == "/api/transfer-targets":
            try:
                el_type = int(query.get("type", [0])[0])
                max_cost = int(query.get("max_cost", [2000])[0])
                filter_team = int(query.get("team", [0])[0])
                sort_mode = query.get("sort", ["fdr"])[0]
                search_q = query.get("q", [""])[0].lower().strip()

                static_data = fetch_json(f"{BASE_URL}/bootstrap-static/", ttl=600)
                teams_map = {t["id"]: t for t in static_data.get("teams", [])}
                elements = static_data.get("elements", [])

                curr_event = 5
                for ev in static_data.get("events", []):
                    if ev.get("is_current"):
                        curr_event = ev.get("id", 5)
                        break

                fixtures_by_team = {t["id"]: [] for t in static_data.get("teams", [])}
                for gw in range(curr_event + 1, min(curr_event + 4, 39)):
                    try:
                        fix_list = fetch_json(f"{BASE_URL}/fixtures/?event={gw}", ttl=600)
                        for f in fix_list:
                            h, a = f["team_h"], f["team_a"]
                            if h in fixtures_by_team:
                                fixtures_by_team[h].append({
                                    "gw": gw,
                                    "opp": teams_map.get(a, {}).get("short_name", "PL"),
                                    "is_home": True,
                                    "fdr": f.get("team_h_difficulty", 3)
                                })
                            if a in fixtures_by_team:
                                fixtures_by_team[a].append({
                                    "gw": gw,
                                    "opp": teams_map.get(h, {}).get("short_name", "PL"),
                                    "is_home": False,
                                    "fdr": f.get("team_a_difficulty", 3)
                                })
                    except Exception as e:
                        pass

                pos_labels = {1: "GK", 2: "DEF", 3: "MID", 4: "FWD"}

                candidates = []
                for el in elements:
                    if el_type > 0 and el.get("element_type") != el_type:
                        continue
                    if el.get("now_cost", 0) > max_cost:
                        continue
                    if el.get("status") == "u":
                        continue
                    if filter_team > 0 and el.get("team") != filter_team:
                        continue
                    if search_q and (search_q not in el.get("web_name", "").lower() and search_q not in el.get("first_name", "").lower() and search_q not in el.get("second_name", "").lower()):
                        continue

                    t_id = el.get("team")
                    t_info = teams_map.get(t_id, {})
                    upcoming = fixtures_by_team.get(t_id, [])
                    avg_fdr = sum(f["fdr"] for f in upcoming) / len(upcoming) if upcoming else 3.0

                    candidates.append({
                        "id": el["id"],
                        "web_name": el["web_name"],
                        "code": el["code"],
                        "team_code": t_info.get("code", 0),
                        "team_name": t_info.get("short_name", "PL"),
                        "element_type": el["element_type"],
                        "position_label": pos_labels.get(el["element_type"], "PL"),
                        "now_cost": el["now_cost"],
                        "total_points": el["total_points"],
                        "form": el.get("form", "0.0"),
                        "ep_next": el.get("ep_next", "0.0"),
                        "selected_by_percent": el.get("selected_by_percent", "0.0"),
                        "ict_index": el.get("ict_index", "0.0"),
                        "status": el.get("status", "a"),
                        "news": el.get("news", ""),
                        "chance_of_playing_next_round": el.get("chance_of_playing_next_round"),
                        "upcoming_fixtures": upcoming,
                        "avg_fdr": avg_fdr
                    })

                # Sorting rules
                if sort_mode == "fdr":
                    candidates.sort(key=lambda x: (x["avg_fdr"], -float(x["form"]), -x["total_points"]))
                elif sort_mode == "form":
                    candidates.sort(key=lambda x: float(x["form"]), reverse=True)
                elif sort_mode == "points":
                    candidates.sort(key=lambda x: x["total_points"], reverse=True)
                elif sort_mode == "ep_next":
                    candidates.sort(key=lambda x: float(x["ep_next"] or 0), reverse=True)
                elif sort_mode == "value":
                    candidates.sort(key=lambda x: (x["total_points"] / (x["now_cost"] / 10 + 0.1)), reverse=True)
                elif sort_mode == "ict":
                    candidates.sort(key=lambda x: float(x["ict_index"] or 0), reverse=True)
                elif sort_mode == "cost_desc":
                    candidates.sort(key=lambda x: x["now_cost"], reverse=True)
                elif sort_mode == "cost_asc":
                    candidates.sort(key=lambda x: x["now_cost"])

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps(candidates[:40]).encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())

        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not Found")
