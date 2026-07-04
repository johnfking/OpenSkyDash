<template>
  <article class="instrument-panel lightning-card">
    <header class="panel-header">
      <div class="title-wrap">
        <span class="led lightning-led" :class="{ active: strikesActive }"></span>
        <div>
          <h2>LIGHTNING</h2>
          <p>PROXIMITY SCOPE</p>
        </div>
      </div>
      <div class="header-actions">
        <span class="freq-chip">{{ stg.lightning.currentStorm.frequency || 0 }}/MIN</span>
        <button type="button" @click="toggleMute">{{ stg.lightning.isMuted ? 'UNMUTE' : 'MUTE' }}</button>
        <button type="button" @click="resetBuffer">CLR</button>
      </div>
    </header>

    <div class="alert-banner" :class="bannerClass">{{ bannerText }}</div>

    <section class="scope-body">
      <div class="ppi-scope">
        <div class="crosshair vertical"></div>
        <div class="crosshair horizontal"></div>
        <div class="range-ring edge-ring"></div>
        <div class="range-ring area-ring" :style="ringStyle(stg.lightning.searchRadius)"></div>
        <div class="range-ring alert-ring" :style="ringStyle(stg.lightning.alertThreshold)"></div>
        <div class="sweep"></div>

        <div
          v-for="(strike, index) in plottedStrikes"
          :key="`${strike.time}-${index}`"
          class="strike-blip"
          :class="{ nearest: index === 0 }"
          :style="strikeStyle(strike, index)"
        ></div>

        <div v-if="nearestDistance > 0" class="bearing-needle" :style="needleStyle"></div>
        <div class="home-marker"><span></span></div>
        <span class="compass n">N</span>
        <span class="compass e">E</span>
        <span class="compass s">S</span>
        <span class="compass w">W</span>
        <div class="scanlines"></div>
      </div>

      <div class="readout-column">
        <div class="primary-readout">
          <span>NEAREST · DISTANCE</span>
          <strong>{{ nearestDistance > 0 ? formatDistance(nearestDistance, true) : '--' }} {{ unitLabel }}</strong>
        </div>

        <div class="mini-grid">
          <div class="readout-cell">
            <span>BEARING</span>
            <strong>{{ bearingReadout }}</strong>
          </div>
          <div class="readout-cell">
            <span>TREND</span>
            <strong>{{ trendReadout }}</strong>
          </div>
        </div>

        <div class="history-block">
          <span>STRIKE HISTORY</span>
          <div class="history-bars">
            <i
              v-for="(value, index) in sparklineValues"
              :key="index"
              :class="{ hot: value > 60 }"
              :style="{ height: `${Math.max(5, value)}%` }"
            ></i>
          </div>
        </div>
      </div>
    </section>

    <footer class="panel-footer">
      <span>AREA <strong>{{ formatDistance(stg.lightning.searchRadius) }} {{ unitLabel }}</strong></span>
      <span>LAST STRIKE <strong>{{ lastUpdated }}</strong></span>
      <span>ALERT <strong>{{ formatDistance(stg.lightning.alertThreshold) }} {{ unitLabel }}</strong></span>
    </footer>
  </article>
</template>

<script>
export default {
  name: 'LightningCard',
  props: {
    stg: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      connection: null,
      reconnectTimer: null,
      freqTimer: null,
      trendTimer: null,
      authKey: null,
      isConnecting: false,
      scopeRangeMi: 60,
    };
  },
  mounted() {
    window.lightningCard = this;
    this.connect();
    this.thunderAudio = new Audio('/sounds/thunder.mp3');
    this.updateFrequency();
    this.trendTimer = setInterval(this.calculateTrend, 5000);
    this.freqTimer = setInterval(this.updateFrequency, 10000);
  },
  beforeUnmount() {
    if (this.stg.lightning.heartbeat) clearInterval(this.stg.lightning.heartbeat);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.freqTimer) clearInterval(this.freqTimer);
    if (this.trendTimer) clearInterval(this.trendTimer);
    if (this.connection) {
      this.connection.onclose = null;
      this.connection.close();
    }
  },
  watch: {
    'stg.lightning.resetTime'() {
      this.updateFrequency();
    },
  },
  computed: {
    strikesActive() {
      return (this.stg.lightning.currentStorm.frequency || 0) > 0 || this.stg.lightning.history.length > 0;
    },
    nearestDistance() {
      return Number(this.stg.lightning.currentStorm.distance || 0);
    },
    unitLabel() {
      return String(this.stg.units.distance || 'mi').toUpperCase();
    },
    bearingReadout() {
      const bearing = Number(this.stg.lightning.currentStorm.bearing || 0);
      return this.nearestDistance > 0 ? `${Math.round(bearing)}° ${this.getDir(bearing)}` : '--';
    },
    trendReadout() {
      const trend = this.stg.lightning.currentStorm.trend || 'Stationary';
      if (/approach/i.test(trend)) return '▲ APPR';
      if (/reced/i.test(trend)) return '▼ RCED';
      return 'STDY';
    },
    bannerClass() {
      if (this.nearestDistance > 0 && this.nearestDistance <= this.stg.lightning.alertThreshold) return 'danger';
      if (this.nearestDistance > 0 && this.nearestDistance <= this.stg.lightning.searchRadius) return 'caution';
      return 'quiet';
    },
    bannerText() {
      if (this.bannerClass === 'danger') return 'DANGER · STRIKE INSIDE ALERT RADIUS';
      if (this.bannerClass === 'caution') return 'CAUTION · STRIKE IN SEARCH AREA';
      return 'QUIET · NO STRIKES IN RANGE';
    },
    plottedStrikes() {
      const history = [...(this.stg.lightning.history || [])]
        .filter((strike) => Number(strike.distance) <= this.scopeRangeMi)
        .sort((a, b) => Number(a.distance) - Number(b.distance))
        .slice(0, 24);

      if (this.nearestDistance > 0 && !history.length) {
        return [{
          distance: this.nearestDistance,
          bearing: this.stg.lightning.currentStorm.bearing || 0,
          time: Date.now(),
        }];
      }

      return history;
    },
    sparklineValues() {
      const history = this.stg.lightning.history || [];
      const bucketCount = 24;
      const buckets = new Array(bucketCount).fill(0);
      const now = Date.now();
      const windowMs = (this.stg.lightning.resetTime || 5) * 60 * 1000;
      const maxDist = this.stg.lightning.searchRadius || 50;

      history.forEach((strike) => {
        const age = now - Number(strike.time || now);
        if (age < 0 || age > windowMs) return;
        const bucketIndex = Math.min(bucketCount - 1, Math.floor(((windowMs - age) / windowMs) * bucketCount));
        const intensity = Math.max(5, ((maxDist - Number(strike.distance || maxDist)) / maxDist) * 100);
        buckets[bucketIndex] = Math.max(buckets[bucketIndex], intensity);
      });

      return buckets;
    },
    needleStyle() {
      const frac = Math.min(1, this.nearestDistance / this.scopeRangeMi);
      const bearing = Number(this.stg.lightning.currentStorm.bearing || 0);
      return {
        width: `${frac * 46}%`,
        transform: `rotate(${bearing - 90}deg)`,
      };
    },
    lastUpdated() {
      const history = this.stg.lightning.history || [];
      if (!history.length) return '--:--:--';
      return this.formatTime(history[history.length - 1].time);
    },
  },
  methods: {
    ringStyle(distance) {
      const pct = Math.min(1, Number(distance || 0) / this.scopeRangeMi) * 92;
      return { width: `${pct}%`, height: `${pct}%` };
    },
    strikeStyle(strike, index) {
      const distance = Number(strike.distance || this.scopeRangeMi);
      const bearing = Number(strike.bearing || 0);
      const frac = Math.min(1, distance / this.scopeRangeMi);
      const rad = bearing * Math.PI / 180;
      const left = 50 + frac * Math.sin(rad) * 46;
      const top = 50 - frac * Math.cos(rad) * 46;
      const size = index === 0 ? 11 : Math.max(5, 8 - index * .15);

      return {
        left: `${left}%`,
        top: `${top}%`,
        width: `${size}px`,
        height: `${size}px`,
        opacity: `${Math.max(.55, 1 - index * .035)}`,
      };
    },
    lzw_decode(s) {
      const dict = {};
      const data = String(s).split('');
      let currChar = data[0];
      let oldPhrase = currChar;
      const out = [currChar];
      let code = 256;
      let phrase;

      for (let i = 1; i < data.length; i++) {
        const currCode = data[i].charCodeAt(0);
        phrase = currCode < 256 ? data[i] : (dict[currCode] || oldPhrase + currChar);
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
      }

      return out.join('');
    },
    async connect() {
      if (this.isConnecting) return;
      this.isConnecting = true;

      try {
        const response = await fetch('/api/blitz-js');
        const scriptText = await response.text();
        const keyMatch = scriptText.match(/var\s+key\s*=\s*(\d+)/);

        if (!keyMatch) {
          this.isConnecting = false;
          this.reconnectTimer = setTimeout(() => this.connect(), 10000);
          return;
        }

        this.authKey = Number(keyMatch[1]);
        this.isConnecting = false;
        this.establishConnection();
      } catch (err) {
        console.error('Connection failed:', err);
        this.isConnecting = false;
        this.reconnectTimer = setTimeout(() => this.connect(), 10000);
      }
    },
    establishConnection() {
      if (this.stg.lightning.heartbeat) clearInterval(this.stg.lightning.heartbeat);
      if (this.connection) {
        this.connection.onclose = null;
        this.connection.close();
      }

      const lightning = this.stg.lightning;
      lightning.currentServerIndex = (lightning.currentServerIndex + 1) % lightning.wssServers.length;
      const serverNum = lightning.wssServers[lightning.currentServerIndex];
      this.connection = new WebSocket(`wss://ws${serverNum}.blitzortung.org`);

      this.connection.onopen = () => {
        const authorize = () => {
          if (this.connection && this.connection.readyState === WebSocket.OPEN) {
            this.connection.send(JSON.stringify({ a: this.authKey }));
          }
        };
        setTimeout(authorize, 1000);
        this.stg.lightning.heartbeat = setInterval(authorize, 30000);
      };

      this.connection.onmessage = (event) => {
        try {
          const raw = JSON.parse(this.lzw_decode(event.data));
          const strike = {
            lat: raw[1] || raw.la || raw.lat,
            lon: raw[2] || raw.lo || raw.lon,
            time: Date.now(),
          };

          if (strike.lat !== undefined && strike.lon !== undefined) this.processIncomingStrike(strike);
        } catch (e) {
          // Blitzortung sends occasional frames that are not usable strike payloads.
        }
      };

      this.connection.onclose = () => {
        if (this.stg.lightning.heartbeat) clearInterval(this.stg.lightning.heartbeat);
        this.reconnectTimer = setTimeout(() => this.establishConnection(), 5000);
      };

      this.connection.onerror = () => {
        if (this.connection) this.connection.close();
      };
    },
    processIncomingStrike(data) {
      const home = this.stg.lightning?.homeLocation || { lat: 34.05, lon: -118.24 };
      const toRad = (v) => (v * Math.PI) / 180;
      const R = 3958.8;
      const dLat = toRad(data.lat - home.lat);
      const dLon = toRad(data.lon - home.lon);
      const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(home.lat)) * Math.cos(toRad(data.lat)) * Math.sin(dLon / 2) ** 2;
      const distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

      if (distance > this.stg.lightning.searchRadius) return;

      const y = Math.sin(toRad(data.lon - home.lon)) * Math.cos(toRad(data.lat));
      const x = Math.cos(toRad(home.lat)) * Math.sin(toRad(data.lat))
        - Math.sin(toRad(home.lat)) * Math.cos(toRad(data.lat)) * Math.cos(toRad(data.lon - home.lon));
      const bearing = Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360);
      const history = this.stg.lightning.history;

      const duplicate = history.slice(-5).some((past) => {
        const timeDelta = Math.abs(Number(data.time) - Number(past.time));
        const bearingDelta = Math.abs(bearing - Number(past.bearing));
        const trueBearingDelta = bearingDelta > 180 ? 360 - bearingDelta : bearingDelta;
        return timeDelta < 3000 && Math.abs(distance - Number(past.distance)) <= 25 && trueBearingDelta <= 15;
      });

      if (duplicate) return;

      history.push({
        time: data.time || Date.now(),
        distance,
        bearing,
        heading: this.getDir(bearing),
      });

      this.stg.lightning.currentStorm.distance = distance;
      this.stg.lightning.currentStorm.bearing = bearing;
      this.updateFrequency();
      this.calculateTrend();
      this.playThunder();
    },
    updateFrequency() {
      const now = Date.now();
      const cutoff = now - ((this.stg.lightning.resetTime || 5) * 60 * 1000);

      this.stg.lightning.history = (this.stg.lightning.history || []).filter((strike) => Number(strike.time) > cutoff);
      this.stg.lightning.currentStorm.frequency = this.stg.lightning.history.filter((strike) => Number(strike.time) > now - 60000).length;

      if (!this.stg.lightning.history.length) {
        this.stg.lightning.currentStorm = { distance: 0, bearing: 0, trend: 'Stationary', frequency: 0 };
      }
    },
    calculateTrend() {
      const history = this.stg.lightning.history || [];
      if (history.length < 4) {
        this.stg.lightning.currentStorm.trend = 'Stationary';
        return;
      }

      const recent = history.slice(-4);
      const firstAvg = recent.slice(0, 2).reduce((sum, s) => sum + Number(s.distance), 0) / 2;
      const lastAvg = recent.slice(2).reduce((sum, s) => sum + Number(s.distance), 0) / 2;
      const delta = firstAvg - lastAvg;

      if (delta > Number(this.stg.lightning.sensitivity || 5)) {
        this.stg.lightning.currentStorm.trend = `Approaching ${this.getDir(this.stg.lightning.currentStorm.bearing)}`;
      } else if (delta < -Number(this.stg.lightning.sensitivity || 5)) {
        this.stg.lightning.currentStorm.trend = `Receding ${this.getDir(this.stg.lightning.currentStorm.bearing)}`;
      } else {
        this.stg.lightning.currentStorm.trend = 'Stationary';
      }
    },
    toggleMute() {
      this.stg.lightning.isMuted = !this.stg.lightning.isMuted;
    },
    resetBuffer() {
      this.stg.lightning.history = [];
      this.stg.lightning.currentStorm = { distance: 0, bearing: 0, trend: 'Stationary', frequency: 0 };
    },
    playThunder() {
      if (this.stg.lightning.isMuted) return;
      if (!this.thunderAudio) this.thunderAudio = new Audio('/sounds/thunder.mp3');
      this.thunderAudio.currentTime = 0;
      this.thunderAudio.play().catch(() => {});
    },
    formatDistance(rawDistance, allowDecimal = false) {
      if (rawDistance === undefined || rawDistance === null) return '--';
      const value = this.stg.units.distance === 'km' ? Number(rawDistance) * 1.60934 : Number(rawDistance);
      if (allowDecimal && value < 20) return value.toFixed(1);
      return String(Math.round(value));
    },
    formatTime(ts) {
      if (!ts) return '--:--:--';
      return new Date(Number(ts)).toLocaleTimeString('en-US', {
        hour12: String(this.stg.units.timeFormat) === '12',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      });
    },
    getDir(bearing) {
      const sectors = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      return sectors[Math.round((Number(bearing) || 0) / 22.5) % 16];
    },
  },
};
</script>

<style scoped>
.instrument-panel {
  display: flex;
  width: 100%;
  min-height: 100%;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #3c4a37;
  border-radius: 14px;
  background: linear-gradient(180deg, #20271f, #141a13);
  box-shadow: inset 0 1px 0 rgba(255, 220, 160, .06), 0 18px 40px rgba(0, 0, 0, .5);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #33402e;
  background: linear-gradient(180deg, #232c1c, #1a2116);
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.led {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.lightning-led {
  background: #ff5a3c;
  box-shadow: 0 0 10px rgba(255, 90, 60, .75);
}

.lightning-led.active {
  animation: blink 1s steps(1) infinite;
}

h2 {
  margin: 0;
  color: #f1e7d3;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: .22em;
}

.panel-header p {
  margin: 2px 0 0;
  color: #7f8f74;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .16em;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
}

.freq-chip,
.header-actions button {
  border: 1px solid #35472e;
  border-radius: 7px;
  background: #0e150c;
  color: #9cd67f;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
}

.freq-chip {
  padding: 6px 9px;
}

.header-actions button {
  padding: 5px 8px;
  color: #8a9a79;
  cursor: pointer;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  letter-spacing: .12em;
}

.header-actions button:hover {
  border-color: #ffb64d;
  color: #ffce9a;
}

.alert-banner {
  padding: 9px 12px;
  text-align: center;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .18em;
}

.alert-banner.danger {
  background: linear-gradient(90deg, #3a1109, #521a0d);
  color: #ff8a5c;
}

.alert-banner.caution {
  background: linear-gradient(90deg, #3a3009, #4d3f0c);
  color: #f0c04a;
}

.alert-banner.quiet {
  background: linear-gradient(90deg, #12220f, #173015);
  color: #9cd67f;
}

.scope-body {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 18px;
}

.ppi-scope {
  position: relative;
  width: min(288px, 80vw);
  aspect-ratio: 1;
  overflow: hidden;
  border: 2px solid #2f4a38;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 45%, #10241a 0%, #08160e 62%, #040b07 100%);
  box-shadow:
    inset 0 0 46px rgba(0, 0, 0, .85),
    inset 0 0 70px rgba(80, 255, 150, .05),
    0 0 0 7px #1a2116,
    0 0 0 8px #10160d;
}

.crosshair {
  position: absolute;
  background: rgba(140, 255, 180, .12);
  inset: 6%;
}

.crosshair.vertical {
  left: 50%;
  width: 1px;
}

.crosshair.horizontal {
  top: 50%;
  height: 1px;
}

.range-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.edge-ring {
  width: 92%;
  height: 92%;
  border: 1px solid rgba(140, 255, 180, .28);
}

.area-ring {
  border: 1px dashed rgba(140, 255, 180, .4);
}

.alert-ring {
  border: 1px dashed rgba(255, 120, 80, .5);
}

.sweep {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 98%;
  height: 98%;
  border-radius: 50%;
  background: conic-gradient(from 0deg, rgba(120, 255, 170, .32), rgba(120, 255, 170, .04) 34deg, transparent 60deg);
  transform: translate(-50%, -50%);
  transform-origin: center;
  animation: sweep 4.5s linear infinite;
}

.strike-blip {
  position: absolute;
  z-index: 4;
  border-radius: 50%;
  background: #7dffb0;
  box-shadow: 0 0 9px rgba(125, 255, 176, .75);
  transform: translate(-50%, -50%);
}

.strike-blip.nearest {
  background: #ff7a3c;
  box-shadow: 0 0 13px rgba(255, 122, 60, .9);
}

.bearing-needle {
  position: absolute;
  z-index: 3;
  top: 50%;
  left: 50%;
  height: 2px;
  background: linear-gradient(90deg, rgba(255, 120, 60, .08), #ff7a3c);
  box-shadow: 0 0 8px rgba(255, 122, 60, .8);
  transform-origin: left center;
}

.home-marker {
  position: absolute;
  z-index: 5;
  top: 50%;
  left: 50%;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #c9f5d6;
  box-shadow: 0 0 10px rgba(201, 245, 214, .8);
  transform: translate(-50%, -50%);
}

.home-marker span {
  position: absolute;
  inset: 0;
  border: 1px solid #7dffb0;
  border-radius: 50%;
  animation: ping 2.4s ease-out infinite;
}

.compass {
  position: absolute;
  z-index: 6;
  color: #537a63;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 700;
}

.compass.n {
  top: 7px;
  left: 50%;
  color: #79a889;
  transform: translateX(-50%);
}

.compass.s {
  bottom: 7px;
  left: 50%;
  transform: translateX(-50%);
}

.compass.e {
  top: 50%;
  right: 9px;
  transform: translateY(-50%);
}

.compass.w {
  top: 50%;
  left: 9px;
  transform: translateY(-50%);
}

.scanlines {
  position: absolute;
  inset: 0;
  z-index: 8;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, .28) 0 1px, transparent 1px 3px);
  opacity: .5;
  pointer-events: none;
}

.readout-column {
  flex: 1 1 190px;
  min-width: 180px;
}

.primary-readout,
.readout-cell,
.history-block {
  border: 1px solid #2d3828;
  border-radius: 9px;
  background: rgba(8, 14, 8, .6);
}

.primary-readout {
  padding: 12px;
}

.primary-readout span,
.readout-cell span,
.history-block > span,
.panel-footer {
  color: #7f8f74;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .18em;
}

.primary-readout strong {
  display: block;
  margin-top: 4px;
  color: #ff8a4d;
  font-family: 'Share Tech Mono', monospace;
  font-size: 28px;
  font-weight: 400;
  text-shadow: 0 0 8px rgba(255, 150, 40, .35);
}

.mini-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}

.readout-cell {
  padding: 10px;
}

.readout-cell strong {
  display: block;
  margin-top: 4px;
  color: #ffb64d;
  font-family: 'Share Tech Mono', monospace;
  font-size: 16px;
  font-weight: 400;
  text-shadow: 0 0 8px rgba(255, 150, 40, .35);
}

.history-block {
  margin-top: 8px;
  padding: 10px;
}

.history-bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 44px;
  margin-top: 8px;
}

.history-bars i {
  flex: 1;
  min-width: 3px;
  border-radius: 2px;
  background: linear-gradient(180deg, #7dffb0, #3fae6e);
}

.history-bars i.hot {
  background: linear-gradient(180deg, #ff8a4d, #e8631f);
  box-shadow: 0 0 8px rgba(255, 122, 60, .45);
}

.panel-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  padding: 11px 16px;
  border-top: 1px solid #33402e;
  background: rgba(8, 12, 7, .5);
}

.panel-footer strong {
  color: #9cd67f;
  font-family: 'Share Tech Mono', monospace;
  font-weight: 400;
}

@keyframes sweep {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes blink {
  0%, 48% { opacity: 1; }
  52%, 100% { opacity: .18; }
}

@keyframes ping {
  0% { transform: translate(-50%, -50%) scale(.5); opacity: .85; }
  100% { transform: translate(-50%, -50%) scale(2.6); opacity: 0; }
}
</style>
