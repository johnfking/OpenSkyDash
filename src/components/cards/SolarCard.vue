<template>
  <article class="instrument-panel solar-card">
    <header class="panel-header">
      <div class="title-wrap">
        <span class="led solar-led" :class="{ active: hasScaleActivity }"></span>
        <div>
          <h2>SOLAR</h2>
          <p>HF PROPAGATION</p>
        </div>
      </div>
      <span class="status-chip">BANDS: {{ bandStatus }}</span>
    </header>

    <section class="gauges">
      <div v-for="gauge in gauges" :key="gauge.label" class="gauge-cell">
        <svg viewBox="0 0 200 112" aria-hidden="true">
          <path :d="arc(0, 1, 82)" class="track" />
          <path
            v-for="zone in gauge.zones"
            :key="`${gauge.label}-${zone.from}`"
            :d="arc(zone.from, zone.to, 82)"
            class="zone"
            :stroke="zone.color"
          />
          <line
            v-for="tick in ticks"
            :key="tick.i"
            :x1="point(tick.f, 90).x"
            :y1="point(tick.f, 90).y"
            :x2="point(tick.f, tick.major ? 72 : 79).x"
            :y2="point(tick.f, tick.major ? 72 : 79).y"
            :stroke-width="tick.major ? 2 : 1"
            class="tick"
          />
          <line
            x1="100"
            y1="100"
            :x2="point(gauge.fraction, 60).x"
            :y2="point(gauge.fraction, 60).y"
            :stroke="gauge.color"
            stroke-width="3.5"
            stroke-linecap="round"
            :style="{ filter: `drop-shadow(0 0 4px ${gauge.color})` }"
          />
          <circle cx="100" cy="100" r="6.5" fill="#1b1813" :stroke="gauge.color" stroke-width="2" />
        </svg>
        <strong :style="{ color: gauge.color }">{{ gauge.display }}</strong>
        <span>{{ gauge.label }}</span>
      </div>
    </section>

    <section class="iono-grid">
      <div>
        <span>FOF2</span>
        <strong>{{ ionosphere.fof2 ?? '--' }} <em>MHZ</em></strong>
      </div>
      <div>
        <span>MUF</span>
        <strong>{{ ionosphere.mufd ?? '--' }} <em>MHZ</em></strong>
      </div>
      <div>
        <span>HMF2</span>
        <strong>{{ convertedHmf2 }} <em>{{ distanceUnitLabel }}</em></strong>
      </div>
    </section>

    <section class="scale-stack">
      <div v-for="scale in scales" :key="scale.key" class="scale-row">
        <strong :class="{ dim: scale.value === 0 }">{{ scale.key }}{{ scale.value || '' }}</strong>
        <span>{{ scale.name }}</span>
        <div class="segments">
          <i v-for="n in 5" :key="n" :class="{ lit: n <= scale.value }"></i>
        </div>
        <em>{{ getScaleCondition(scale.value) }}</em>
      </div>
    </section>

    <footer class="prob-footer">
      <h3>24H FLARE / STORM PROBABILITY</h3>
      <div v-for="prob in probabilities" :key="prob.label" class="prob-row">
        <span>{{ prob.label }}</span>
        <div><i :style="{ width: `${prob.value}%` }"></i></div>
        <strong>{{ prob.value }}%</strong>
      </div>
    </footer>
  </article>
</template>

<script>
export default {
  name: 'SolarCard',
  props: {
    stg: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      solarTimer: null,
    };
  },
  mounted() {
    this.fetchSolarFlux();
    this.fetchGeomagneticIndices();
    this.fetchIonosphere();
    this.fetchScales();

    this.solarTimer = setInterval(() => {
      this.fetchSolarFlux();
      this.fetchGeomagneticIndices();
      this.fetchIonosphere();
      this.fetchScales();
    }, 900000);
  },
  beforeUnmount() {
    if (this.solarTimer) clearInterval(this.solarTimer);
  },
  watch: {
    'stg.units.distance'() {
      this.fetchIonosphere();
    },
  },
  computed: {
    geo() {
      return this.stg.solar.current.geoMagnetic || {};
    },
    ionosphere() {
      return this.stg.solar.current.ionosphere || {};
    },
    currentScales() {
      return this.stg.solar.current.scales?.current || { r: 0, s: 0, g: 0 };
    },
    hasScaleActivity() {
      return Object.values(this.currentScales).some((value) => Number(value) > 0);
    },
    bandStatus() {
      const k = Number(this.geo.kIndex || 0);
      const a = Number(this.geo.aIndex || 0);
      if (k >= 6 || a >= 30) return 'POOR';
      if (k >= 4 || a >= 15) return 'FAIR';
      return 'GOOD';
    },
    ticks() {
      return Array.from({ length: 11 }, (_, i) => ({
        i,
        f: i / 10,
        major: i % 5 === 0,
      }));
    },
    gauges() {
      return [
        {
          label: 'SFI',
          value: Number(this.geo.flux || 0),
          min: 60,
          max: 200,
          color: '#ffb64d',
          zones: [
            { from: 0, to: .071, color: '#ec5a3c' },
            { from: .071, to: .286, color: '#f0c04a' },
            { from: .286, to: .643, color: '#9cd67f' },
            { from: .643, to: 1, color: '#5fd15f' },
          ],
        },
        {
          label: 'A-INDEX',
          value: Number(this.geo.aIndex || 0),
          min: 0,
          max: 50,
          color: this.geoColor(Number(this.geo.aIndex || 0), [10, 20, 30]),
          zones: [
            { from: 0, to: .2, color: '#9cd67f' },
            { from: .2, to: .4, color: '#f0c04a' },
            { from: .4, to: .6, color: '#f0913f' },
            { from: .6, to: 1, color: '#ec5a3c' },
          ],
        },
        {
          label: 'K-INDEX',
          value: Number(this.geo.kIndex || 0),
          min: 0,
          max: 9,
          color: this.geoColor(Number(this.geo.kIndex || 0), [3, 5, 7]),
          zones: [
            { from: 0, to: .333, color: '#9cd67f' },
            { from: .333, to: .556, color: '#f0c04a' },
            { from: .556, to: .778, color: '#f0913f' },
            { from: .778, to: 1, color: '#ec5a3c' },
          ],
        },
      ].map((gauge) => ({
        ...gauge,
        display: gauge.label === 'A-INDEX' ? String(Math.round(gauge.value)).padStart(2, '0') : Math.round(gauge.value),
        fraction: this.clamp((gauge.value - gauge.min) / (gauge.max - gauge.min), 0, 1),
      }));
    },
    scales() {
      return [
        { key: 'R', name: 'RADIO BLACKOUT', value: Number(this.currentScales.r || 0) },
        { key: 'S', name: 'SOLAR RADIATION', value: Number(this.currentScales.s || 0) },
        { key: 'G', name: 'GEOMAGNETIC', value: Number(this.currentScales.g || 0) },
      ];
    },
    probabilities() {
      const probs = this.stg.solar.current.scales?.probabilities || {};
      return [
        { label: 'R1-R2 MINOR', value: Number(probs.rMinor || 0) },
        { label: 'R3-R5 MAJOR', value: Number(probs.rMajor || 0) },
        { label: 'S1+ STORM', value: Number(probs.sStorm || 0) },
      ];
    },
    convertedHmf2() {
      const raw = Number(this.ionosphere.hmf2);
      if (!Number.isFinite(raw)) return '--';
      return this.stg.units.distance === 'mi' ? Math.round(raw * 0.621371) : Math.round(raw);
    },
    distanceUnitLabel() {
      return this.stg.units.distance === 'mi' ? 'MI' : 'KM';
    },
  },
  methods: {
    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    },
    point(f, r) {
      const angle = (180 - 180 * f) * Math.PI / 180;
      return {
        x: 100 + r * Math.cos(angle),
        y: 100 - r * Math.sin(angle),
      };
    },
    arc(f0, f1, r) {
      const p0 = this.point(f0, r);
      const p1 = this.point(f1, r);
      return `M ${p0.x} ${p0.y} A ${r} ${r} 0 0 1 ${p1.x} ${p1.y}`;
    },
    geoColor(value, stops) {
      if (value <= stops[0]) return '#9cd67f';
      if (value <= stops[1]) return '#f0c04a';
      if (value <= stops[2]) return '#f0913f';
      return '#ec5a3c';
    },
    getScaleCondition(value) {
      const val = parseInt(value) || 0;
      if (val === 5) return 'EXTREME';
      if (val === 4) return 'SEVERE';
      if (val === 3) return 'STRONG';
      if (val === 2) return 'MODERATE';
      if (val === 1) return 'MINOR';
      return 'QUIET';
    },
    async fetchGeomagneticIndices() {
      try {
        const response = await fetch('https://services.swpc.noaa.gov/text/daily-geomagnetic-indices.txt');
        const payload = await response.text();
        let aIndex = -1;
        let kIndex = -1;
        const lines = payload.split('\n');
        let i = 0;

        for (i = lines.length - 1; i >= 0; i--) {
          if (lines[i].startsWith(':') || lines[i].startsWith('#') || !lines[i].trim()) continue;
          aIndex = parseInt(lines[i].substring(59).trim().split(/\s+/)[0]);
          if (aIndex >= 0) break;
        }

        if (i >= 0) {
          const values = lines[i].substring(65).trim().split(/\s+/);
          for (let j = values.length - 1; j >= 0; j--) {
            kIndex = parseFloat(values[j]);
            if (kIndex >= 0) break;
          }
        }

        this.stg.solar.current.geoMagnetic.aIndex = aIndex;
        this.stg.solar.current.geoMagnetic.kIndex = kIndex;
      } catch (error) {
        console.error('Geomagnetic fetch failed:', error);
      }
    },
    async fetchSolarFlux() {
      try {
        const response = await fetch('https://services.swpc.noaa.gov/json/f107_cm_flux.json');
        const data = await response.json();
        if (data && data.length > 0) {
          this.stg.solar.current.geoMagnetic.flux = parseFloat(data[0].flux);
        }
      } catch (error) {
        console.error('Solar flux fetch failed:', error);
      }
    },
    async fetchIonosphere() {
      const home = this.stg?.lightning?.homeLocation;
      if (!home || !home.lat || !home.lon) return;

      try {
        const response = await fetch(`/api/kc2g/point-prediction?grid=${home.lat},${home.lon}`);
        const data = await response.json();
        const { fof2, hmf2, mufd } = data;

        this.stg.solar.current.ionosphere = {
          fof2: Number(fof2).toFixed(2),
          hmf2: Number(hmf2).toFixed(1),
          mufd: Number(mufd).toFixed(2),
          ts: new Date().toLocaleString('en-US', {
            hour12: String(this.stg.units.timeFormat) === '12',
            hour: 'numeric',
            minute: 'numeric',
          }),
        };
      } catch (error) {
        console.error('Ionosphere fetch failed:', error);
      }
    },
    async fetchScales() {
      try {
        const response = await fetch('https://services.swpc.noaa.gov/products/noaa-scales.json');
        const data = await response.json();
        const observed = data['0'];
        const forecast = data['1'];

        this.stg.solar.current.scales = {
          current: {
            r: parseInt(observed.R.Scale) || 0,
            s: parseInt(observed.S.Scale) || 0,
            g: parseInt(observed.G.Scale) || 0,
          },
          probabilities: {
            rMinor: parseInt(forecast.R.MinorProb) || 0,
            rMajor: parseInt(forecast.R.MajorProb) || 0,
            sStorm: parseInt(forecast.S.Prob) || 0,
          },
        };
      } catch (error) {
        console.error('NOAA scales fetch failed:', error);
      }
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
  border: 1px solid #4a3f2c;
  border-radius: 14px;
  background: linear-gradient(180deg, #231e15, #181309);
  box-shadow: inset 0 1px 0 rgba(255, 220, 160, .06), 0 18px 40px rgba(0, 0, 0, .5);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #33291a;
  background: linear-gradient(180deg, #2a2418, #1c1710);
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

.solar-led {
  background: #ffb64d;
  box-shadow: 0 0 10px rgba(255, 182, 77, .7);
}

.solar-led.active {
  animation: pulse 2s ease-in-out infinite;
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
  color: #6f654e;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .16em;
}

.status-chip {
  padding: 6px 9px;
  border: 1px solid #35472e;
  border-radius: 7px;
  background: #0e150c;
  color: #9cd67f;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  white-space: nowrap;
}

.gauges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 17px 14px 12px;
}

.gauge-cell {
  flex: 1 1 120px;
  text-align: center;
}

.gauge-cell svg {
  width: min(170px, 100%);
  height: auto;
  overflow: visible;
}

.track,
.zone {
  fill: none;
  stroke-linecap: round;
}

.track {
  stroke: #2b271f;
  stroke-width: 9;
}

.zone {
  stroke-width: 7;
  opacity: .9;
}

.tick {
  stroke: #6d6350;
}

.gauge-cell strong {
  display: block;
  margin-top: -5px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 26px;
  font-weight: 400;
  text-shadow: 0 0 8px rgba(255, 150, 40, .35);
}

.gauge-cell span,
.iono-grid span,
.scale-row span,
.prob-footer h3,
.prob-row span {
  color: #877c68;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 600;
  letter-spacing: .18em;
}

.gauge-cell span {
  font-size: 12px;
  font-weight: 700;
}

.iono-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0 14px 14px;
}

.iono-grid div {
  padding: 10px 6px;
  border: 1px solid #352d20;
  border-radius: 9px;
  background: rgba(12, 9, 5, .5);
  text-align: center;
}

.iono-grid span {
  display: block;
  font-size: 10px;
}

.iono-grid strong {
  color: #ffb64d;
  font-family: 'Share Tech Mono', monospace;
  font-size: 18px;
  font-weight: 400;
  text-shadow: 0 0 8px rgba(255, 150, 40, .35);
}

.iono-grid em {
  color: #6f654e;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 9px;
  font-style: normal;
  font-weight: 600;
}

.scale-stack {
  padding: 12px 14px;
  border-top: 1px solid #33291a;
}

.scale-row {
  display: grid;
  grid-template-columns: 36px minmax(112px, 130px) 1fr 72px;
  align-items: center;
  gap: 9px;
  margin: 8px 0;
}

.scale-row > strong {
  color: #ffb64d;
  font-family: 'Share Tech Mono', monospace;
  font-size: 20px;
  font-weight: 400;
  text-shadow: 0 0 8px rgba(255, 150, 40, .35);
}

.scale-row > strong.dim {
  color: #7a715a;
  text-shadow: none;
}

.scale-row span {
  font-size: 10px;
}

.segments {
  display: flex;
  gap: 4px;
}

.segments i {
  flex: 1;
  height: 9px;
  border-radius: 2px;
  background: #241f17;
}

.segments i.lit {
  background: linear-gradient(180deg, #ffb64d, #e8902f);
  box-shadow: 0 0 8px rgba(255, 150, 40, .35);
}

.scale-row em {
  color: #cdbf9f;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  font-style: normal;
  text-align: right;
}

.prob-footer {
  margin-top: auto;
  padding: 13px 14px 14px;
  border-top: 1px solid #33291a;
  background: rgba(10, 8, 4, .45);
}

.prob-footer h3 {
  margin: 0 0 9px;
  font-size: 11px;
}

.prob-row {
  display: grid;
  grid-template-columns: 96px 1fr 38px;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.prob-row span {
  color: #a99b7e;
  font-size: 11px;
}

.prob-row div {
  height: 9px;
  overflow: hidden;
  border-radius: 3px;
  background: #1a1610;
}

.prob-row i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #e8902f, #ffb64d);
  box-shadow: 0 0 8px rgba(255, 150, 40, .35);
}

.prob-row strong {
  color: #ffb64d;
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  font-weight: 400;
  text-align: right;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .35; }
}

@media (max-width: 520px) {
  .scale-row {
    grid-template-columns: 34px 1fr;
  }

  .segments,
  .scale-row em {
    grid-column: 2;
  }
}
</style>
