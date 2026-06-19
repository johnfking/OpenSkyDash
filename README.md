# OpenSkyDash

**A real-time dashboard for amateur radio.**

SkyDash brings local weather, lightning tracking, and solar indicies into a single browser-based interface. Run it locally on a Raspberry Pi or locally on a Windows (x64) device.

**📝 License:** MIT — See [LICENSE](LICENSE)

---

### Prerequisites

- **Node.js v20.19 or later** (v22.12+ also supported) — required by Vite and the Express
  backend. The version of Node.js shipped by default in most Linux distributions
  (including Ubuntu 24.04 via `apt install nodejs`) is too old and **will not work**.

  Install a current LTS release using one of these methods:

  **NodeSource (Ubuntu / Debian — system-wide):**

  ```bash
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

> ⚠️ **Ubuntu / Debian users:** Do **not** use `apt install nodejs` — the packaged version
> is v18 which is below the minimum required. Use NodeSource or nvm as shown above.

---

## Table of Contents

- [Deployment](#deployment)
  - [Raspberry Pi](#raspberry-pi)
  - [Windows](#windows)
- [Dashboard Cards](#dashboard-cards)
- [Header](#Header)
- [Dashboard Card Icons](#Dashboard-Card-Icons)
- [Settings](#Settings)
- [Weather](#Weather)
- [Lightning](#Lightning)
- [Solar](#Solar)

---

## Dashboard Cards

SkyDash is built on selectable cards, each focused on a specific data source or function. Every card fetches its own data, manages its own refresh cycle. Below is a detailed walkthrough of each one.

---

### Header

The persistent bar at the top of the dashboard.

- **App Name** - A configurable name to display for your station.
- **Local Time** - Time indicator in hour, minutes and seconds that displays the current time for your locale.

---

### Dashboard Card icons

The persistent icons that provides at-a-glance information and card selection.

**From left to right:**

- **Weather** — Icon to open the Weather Card. The icon will update showing the current condition.
- **Lightning** — Icon to open the Lightning Card. The icon will flash in 1 second intervals when strikes are within the area or alert range.
- **Solar** — Icon to open the Solar Card. The icon will flash in 10 second intervals when (R)(S)(G) is > 0.
- **Settings** — Icon to open the Settings Card. All user configurable information is defined in this card. SkyDash is reactive and updates the cards upon unit change.

---

### Settings

Configurable data for SkyDash.

### General

- **App Name** - Name displayed on header. SkyDash is default.
- **Distance** - Mi/Km - Default is Mi
- **Pressure** - mb/in - Default is in
- **Temperature** - F/C - Default is F

- **Lat** - Latitude of your locale
- **Lon** - Longitude of your local

### Lightning_config

- **Reset Time** - Lighting Strike Buffer reset Time. Default is 5 minutes. Longer reset time utilizes additional memory recources.

- **Area Radius** - The radius where strikes within will display along with a warning banner. The default is 50.
- **Alert Radius** - The radius where strikes within will display aloing with the Danger banner. The default is 25.

- **Calculation** - Method used to trend the strike path. Options are Closest, Average, or Percentile algorithms.

- **Sensitivity** - Value used to determine strike distance sensitivity. Higher values reduce trend flip-floping.

- **Sample Size** - Value used to determine the amount of strikes that are used in the trend calculations.

### Backup/Restore

- **Backup** - Creates a backup json file with the current settings in the $HOME/download directory (i.e.= SkyDash_station_settings.json)
- **Restore** - Load settings file from $/HOME/download directory (i.e= SkyDash_station_settings.json)

---

### Weather

Current weather conditions at your station location.

**In the header:**

- Weather description icon and temperature in both °F and °C
- Last update time
- Feels like temperature in both °F and °C

**Current conditions icons**

- Wind speed in both mph/km
- Humidity
- Gusts in both mph/km
- Dew point in both °F and °C
- Air pressure in in/mb
- Cloud cover
- Visability in mph/km
- UV exposure

- **_Hover over the icon to show the label_**

**3 Day forecast**

- Day
- High/Low temperature
- Chance of rain

**How to use it:** The weather is shown automatically based on your configured station coordinates.

**Data sources:**

- **Open-Meteo** — Free weather API, no API key required. Fetched directly by each user's browser (rate limits are per-user, not per-server).

No configuration needed — weather works automatically based on your station coordinates.

**Refresh interval:** Every 15 minutes (weather data is cached server-side).

---

### Lightning

**Header from left to right:**

- Lightning Icon - Flashes when strikes occur in search area/alert radius.
- Strikes/minute Chip - Dynamic update of strikes per minute every 30 seconds.
- Mute Icon - Toggle audio off/on lightning strike.
- Trash Icon - Clear strike buffer on click.

**Banner**

- Visual coded alerts. Caution (Yellow), Warning (Red), or Quiet (Green)

**Distance / Direction / Trend**

- Distance from your locale to the strike. Values dynamically update to selected unit (Mi/Km).
- Brearing Indicator pointing to strike location.
- Compass heading. Headings are grouped into 16 bins(N, NNE, ENE)
- Trend - Approaching, Stationary, or Receding by compass heading.

**Sparkline**

- Visual representation of strike history. Strike amplitude is inversely proportional to distance. Closer strikes peak higher

**Recent Strikes**

- Expansion panel that shows the last 5 strikes
  - Time
  - Distance
  - Heading

**Footer**

- Area - Radius distance value. Any strikes <= this value will result in the Warning banner
- Strike Buffer Status - Last strike seen time when strikes in in the buffer. No Data when no strikes are in the area/alert radius
- Alert - Radius distance value. Any strikes <= to this value will result in the Danger banner. Trend calculation prioritized for strikes in the alert radius.

**How it works:** Lightning strikes within the search area/alert radius render on the card.

---

### Solar

Displays the three key solar indices that affect HF radio propagation. If you operate HF, these numbers directly determine what bands will be open.

**What it shows:**

- **SFI (Solar Flux Index)** — The 10.7 cm solar radio flux, measured daily at the Dominion Radio Astrophysical Observatory. This is the single most important number for HF propagation:
  - SFI < 70: Poor conditions, only lower bands (40m–160m) reliably open
  - SFI 70–100: Fair conditions, mid-bands (20m–30m) open
  - SFI 100–150: Good conditions, higher bands (15m–17m) opening
  - SFI > 150: Excellent conditions, 10m and 12m wide open

- **A-Index (Ap)** - Historical Ap Index
  - Ap 0-10 (green): Quiet
  - Ap 11 - 20 (yellow): Moderate
  - Ap 21 - 30 (orange): Storm
  - Ap 31 - 50 (red): Severe

- **K-Index (Kp)** — Planetary geomagnetic disturbance level on a 0–9 scale. Lower is better for HF:
  - Kp 0–3 (green): Quiet — excellent HF conditions
  - Kp 4–5 (yellow): Moderate — noticeable degradation, especially on polar paths
  - Kp 6-7 (orange): Storm — significant HF disruption, possible blackouts on higher bands
  - Kp 8-9 (red): Extreme - Severe HF disruption

- **FOF2** - F2 Layer Critical Frequency
- **MUF** - Maximum Useable Frequency
- **HMF2** - F2 Layer Max Altitude

- **R** - Radio - Blackout (x-ray flux)
- **S** - Solar - Storm (proton-flux)
- **G** - GeoMagnetic - Activity (Solar Wind / CME)
- **Flare/Storm Probabilities** - R1-R2, R3-R5, S1+

**Data source:** NOAA Space Weather Prediction Center (SWPC) and KC2G.com JSON feeds. Updates every 15 minutes.

---

## Health Dashboard

- **API** - `http://<localhost/ip>:5050/api/health` - The API will return the status, version, uptime, and fetch timestamp

---

## Deployment

### Azure Static Web Apps

This fork can run as a hosted phone-friendly web app without a Raspberry Pi. The Vue app is deployed as static files, and the small proxy endpoints run as managed Azure Functions under `/api`.

Azure Static Web Apps Free is a good fit for personal SkyDash use:

- Static hosting, GitHub deployment, custom domains, and SSL certificates are included on the Free plan.
- Managed Azure Functions on the Consumption plan include a monthly free grant that is far above normal personal dashboard traffic.
- Settings still live in the browser, so each phone or browser keeps its own station configuration.

#### One-time Azure setup

1. Fork this repository.
2. In the Azure portal, create a **Static Web App**.
3. Choose the fork as the GitHub source.
4. Use these build settings:
   - App location: `/`
   - API location: `api`
   - Output location: `dist`
5. Add the generated deployment token as the GitHub secret `AZURE_STATIC_WEB_APPS_API_TOKEN` if Azure does not create it automatically.
6. Push to `main` and let GitHub Actions deploy.

#### Local Azure-style preview

```bash
npm install
npm --prefix api install
npm run build
npm run azure:dev
```

The hosted app uses these API routes:

- `/api/health`
- `/api/blitz-js`
- `/api/kc2g/point-prediction?grid=<lat>,<lon>`

### Raspberry Pi

One-line install for Raspberry Pi (3B, 3B+, 4, 5). Supports both graphical and headless operation.

**Supported operating systems:**

| OS                       | Debian | Status                 | Display              |
| ------------------------ | ------ | ---------------------- | -------------------- |
| Raspberry Pi OS Bookworm | 12     | ✅ Recommended         | X11 (openbox / LXDE) |
| Raspberry Pi OS Trixie   | 13     | ✅ Supported           | Wayland (labwc)      |
| Raspberry Pi OS Bullseye | 11     | ⚠️ Legacy, best-effort | X11                  |

**Kiosk install (kiosk mode — auto-starts fullscreen on boot):**

```bash

 curl -sSL https://raw.githubusercontent.com/w8be/OpenSkyDash/refs/heads/main/setup-pi.sh | bash -s -- --kiosk
```

The Pi boots directly into a fullscreen Chromium browser showing SkyDash. The kiosk launcher automatically detects Wayland (Trixie/labwc) or X11 (Bookworm/LXDE) and adjusts accordingly — no manual configuration needed. Only use this if you want a dedicated device for SkyDash.

**Server-only install (headless, no GUI):**

```bash

 curl -sSL https://raw.githubusercontent.com/w8be/OpenSkyDash/refs/heads/main/setup-pi.sh | bash -s -- --server
```

- This will clone the SkyDash repository and run the install script for a headless server that can be accessed with a web browser.

---

## Windows

### Install Node.js

#### Skip this step if you have Node.js loaded. Verify that your version meets the [Prerequisites](#Prerequisites).

- For Windows x64 download the [msi_installer](https://nodejs.org/dist/v24.16.0/node-v24.16.0-x64.msi). This will install node.js and npm on your device. If you already have node.js loaded you can skip this step.

### Install PM2

- Open a DOS shell and run:
  ```bash
  npm install -g pm2 pm2-windows-startup serve
  ```

### Install Git - Skip this step if Git is already installed

- Download Git for [Windows](https://github.com/git-for-windows/git/releases/download/v2.54.0.windows.1/Git-2.54.0-64-bit.exe)
- Run the executable file and follow the install wizard. Use default settings during the install.

### Clone SkyDash github repository

- In the DOS shell change directory to where you want the SkyDash directory to be installed (i.e.="C:\Users\<accountName>").
- Run the git clone command to download the repository

  ```bash
  git clone https://github.com/w8be/SkyDash.git
  ```

- CD to the SkyDash directory and verify that the repository has downloaded.

### Build SkyDash for Production

- In the DOS shell in the SkyDash directory, run:

```bash
 npm run build
```

### Configure Windows Startup Service

- In the DOS shell in the SkyDash directory, run:

```bash
pm2-startup install
```

(Note: If prompted during this step to verify environment paths, simply follow the on-screen instructions to confirm).

### Launch SkyDash

- In the DOS shell in the SkyDash directory, run:

```bash
pm2 start serve --name"skydash-app" -- dist -s -p 5050
```

### Save the Service Configuration

- In the DOS shell in the SkyDash directory, run :

```bash
pm2 save
```

### PM2 Management Commands

- Check status - **pm2 status**
- View live console logs - **pm2 logs skydash-app**
- Restart the service - **pm2 restart skydash-app**
- Stop the service - **pm2 stop skydash-app**

---

## Frequently Asked Questions

**Q: How much bandwidth does SkyDash use?**
A: Very little. All external API calls are cached server-side, and the backend serves compressed (gzip) responses. Typical usage is under 1 MB/minute. Most data sources update every 5–30 minutes.

**Q: Can I run this on a Raspberry Pi 3?**
A: Yes. The Pi 3B/3B+ works fine, though initial build time is slower (~5 minutes). A Pi 4 or 5 is recommended for the best experience. The server uses about 100–150 MB of RAM.

**Q: Can multiple people use the same server?**
A: Yes. The web interface is stateless — each browser session gets its own filter settings, theme preferences, and DX target. The server caches all API responses, so additional users add zero extra load on upstream services. For shared stations where operators want different layouts and configurations, use the **Profiles** feature (Settings → Profiles tab) to save and switch between named profiles.

**Q: Chromium shows a "keyring" unlock prompt on every boot in kiosk mode — how do I prevent it?**
A: This happens when Chromium tries to use the system keyring (gnome-keyring / kwallet) to protect its internal credential store, but the desktop session manager hasn't unlocked it yet. The Pi setup script already passes `--password-store=basic` to Chromium, which tells it to use a plain local store instead and avoids the prompt entirely. If you installed SkyDash before this fix was included, update your `kiosk.sh` by re-running the setup script, or add `--password-store=basic` manually to the Chromium launch line in `~/openhamclock/kiosk.sh`.

---

## License

MIT License — See [LICENSE](LICENSE) file.

---
