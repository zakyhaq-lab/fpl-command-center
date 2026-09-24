# FPL Tactical Command Center & Transfer Lab

A high-tech, live broadcast dashboard and tactical transfer planner for Fantasy Premier League (FPL). Built with official Premier League broadcast aesthetics (Deep Navy, Electric Neon Purple `#38003C`, Mint/Cyan `#00FF87`, and glassmorphic panels).

## ✨ Key Features & Upgrades

- **Live Official FPL API Sync:** Direct real-time connection with FPL for team squad picks, current gameweek live points, overall rank, percentile, and bank balance.
- **Live Theme Switcher & Visual Palettes:**
  - Instantly switch between 6 curated high-end visual themes:
    - ❄️ **Titanium Slate (Minimalist Default):** Deep Slate `#0B0F19` & Ice Blue `#38BDF8`.
    - 💜 **Premier League Broadcast:** Electric Purple `#38003C` & Mint Cyan `#00FF87`.
    - 🌲 **Midnight Emerald Tactical:** Pitch Black `#060B0E` & Emerald Green `#10B981`.
    - ⚡ **Cyber Neon:** Deep Tech Navy `#050814`, Electric Cyan `#00F0FF`, and Hot Pink.
    - 👑 **Royal Blue & Gold:** Deep Sapphire `#050C1F` & Metallic Gold `#FFC72C`.
    - 🔴 **Crimson Stadium:** Deep Onyx `#0E0709` & Vivid Red `#FF4D6D`.
  - Automatically saves choice in `localStorage` for persistent sessions.
- **Realistic Stadium Pitch View (2D/3D):**
  - Mowing grass stripes, floodlight illumination, and authentic pitch markings.
  - Dynamic formation badge (e.g. `3-5-2`, `4-3-3`) calculated automatically from Starting XI.
  - Rich player cards with official headshot photos (fallback to official club kit webp), captain/vice-captain gold crown badges, FDR fixture tags, injury/doubt status flags, and live gameweek points.
  - Dedicated dugout bench tray with automatic substitution priority order.
- **Smart Transfer Lab:**
  - Multi-position filter (`Semua`, `🧤 GK`, `🛡️ DEF`, `⚡ MID`, `🎯 FWD`).
  - Club filter across all 20 Premier League teams & instant name search.
  - Dynamic budget slider synced with outgoing player value and bank budget.
  - Multi-metric sorting: Easiest 3-GW Fixtures (FDR), Recent Form, Total Points, Expected Points (`xP`), Threat & ICT Index, Value for Money, and Price.
  - **Upcoming 3-Gameweek Fixture Ticker:** Visual pill badges indicating next opponents, Home/Away, and FDR difficulty colors.
- **Live Squad Simulation & Pitch Swap:**
  - Real-time squad impact preview (Bank budget balance, form delta, points delta).
  - One-click "Terapkan ke Formasi Pitch" to view simulated lineup directly on the pitch without altering official FPL team state.
- **Head-to-Head (H2H) Player Comparison Modal:**
  - Side-by-side dual player comparison with visual bar metrics (Form, Total Points, Expected Points, xG, xA, ICT Index, Ownership %).
- **Manager Insights & Leagues Hub:**
  - **Chips Tracker:** Status for Triple Captain (3xC), Wildcard, Free Hit, and Bench Boost.
  - **Gameweek Progression History:** Gameweek-by-gameweek table of points, ranks, transfers, and bench points.
  - **Classic Mini-Leagues Standings:** Real-time leaderboard tracking with rank movements (▲ / ▼).
- **Gameweek Deadline Countdown Timer (Live Ticking):**
  - Ticking live countdown in the broadcast header towards the official FPL transfer deadline.
  - Dynamic urgency states: changes color to amber as deadline nears, and pulsing red under 2 hours.
  - Localized deadline date and time format in WIB.
- **Market Trends & Price Change Alert Radar:**
  - **Squad Alerts:** Analyzes your 15-player squad for price rise candidates and price fall risks based on net event transfers.
  - **Top 5 League Transfers IN & OUT:** Real-time radar of the most bought and sold players across millions of FPL managers.
  - One-click "Cari Pengganti" to seamlessly route at-risk players into the Smart Transfer Lab.
- **Share Squad Card & Export Studio (HD PNG & WhatsApp):**
  - Renders a stadium matchday card with Starting XI layout, captaincy badges, dugout bench subs, and manager stats.
  - **Download HD PNG:** High-definition image export via `html2canvas` with built-in CORS image proxying.
  - **Copy Image:** One-click copy directly to system clipboard for instant pasting into WhatsApp Web, Telegram, Discord, or Twitter.
  - **Copy Text:** Generates structured matchday lineup summary with emojis ready for group chat sharing.

## 🚀 How to Run

```bash
python3 server.py
```

Open `http://localhost:8080` in your web browser.

