<template>

    <v-sheet class="mx-auto lightning-card station-card">
        <div class="d-flex justify-space-between align-center header-bg px-3 py-2"
            style="position: relative; z-index: 10; ">
            <div class="d-flex align-center">
                <v-icon icon="mdi-flash" color="amber" size="large"
                    :class="{ 'pulsing-icon': (stg.lightning.currentStorm.frequency > 0) }">
                </v-icon>
                <div class="d-flex flex-column align-start">
                    <span class="text-subtitle-1 font-weight-bold card-title-text"
                        style="line-height: 1.2rem;">Lightning</span>
                    <span class="card-source-text" style="font-size: 0.55rem;">Blitzortung.org</span>
                </div>
            </div>

            <div class="d-flex justify-space-between align-center">
                <v-chip size="x-small" :color="freqColor" variant="flat"
                    class="font-weight-bold d-flex justify-center mr-2"
                    style="font-size: 0.90rem; font-weight: bold; min-width: 70px;">
                    {{ stg.lightning.currentStorm.frequency || 0 }}/min

                </v-chip>

                <div class="d-flex align-center">
                    <v-btn v-tooltip:top="'Mute'" icon variant="plain" size="small" @click="toggleMute" class="ma-0"
                        width="28">
                        <v-icon :icon="stg?.lightning.isMuted ? 'mdi-volume-off' : 'mdi-volume-high'"
                            :color="stg?.lightning.isMuted ? 'red' : 'green'" size="small">
                        </v-icon>
                    </v-btn>
                    <v-btn v-tooltip:top="'Clear Buffer'" icon variant="plain" size="small" @click="resetBuffer"
                        class="ma-0" width="28">
                        <v-icon icon="mdi-trash-can-outline"
                            :color="(stg?.lightning.history?.length > 0) ? 'blue' : 'grey-darken-1'" size="small">
                        </v-icon>
                    </v-btn>
                </div>

            </div>
        </div>

        <template v-if="stg?.lightning">
            <div v-if="stg.lightning.currentStorm?.distance > 0 && stg.lightning.currentStorm?.distance <= stg.lightning.alertThreshold"
                class="text-center py-1 font-weight-bold text-white bg-red-darken-4">
                <v-icon icon="mdi-alert-octagon" size="x-small" class="mr-1"></v-icon>
                TAKE ACTION: Immediate Danger
            </div>
            <div v-else-if="stg.lightning.currentStorm?.distance > 0 && stg.lightning.currentStorm?.distance <= stg.lightning.searchRadius"
                class="text-center py-1 font-weight-bold text-white bg-orange-darken-3">
                <v-icon icon="mdi-eye-check" size="x-small" class="mr-1"></v-icon>
                CAUTION: Strikes In Area
            </div>
            <div v-else class="text-center py-1 font-weight-bold text-white bg-green-darken-3">
                <v-icon icon="mdi-shield-check" size="x-small" class="mr-1"></v-icon>
                STATUS: Clear / Monitoring
            </div>
        </template>
        <v-card-text class="pa-4">
            <div v-if="stg.lightning.history.length > 0">
            </div>

            <div v-else class="text-center text-grey-darken-1 py-6">
                <v-icon icon="mdi-shield-check-outline" size="48" class="mb-2"></v-icon>
                <div class="text-caption font-weight-bold text-uppercase" style="letter-spacing: 0.1rem;">
                    Quiet
                </div>
            </div>
            <div
                v-if="stg.lightning.currentStorm.distance > 0 && stg.lightning.currentStorm.distance <= stg.lightning.searchRadius">
                <div class="d-flex justify-space-between align-center mb-4 ml-6">
                    <div class="d-flex flex-column align-center">

                        <div class="d-flex align-baseline">
                            <div class="display-value card-title-text">{{
                                convertedDistance(this.stg?.lightning?.currentStorm?.distance) }}</div>
                            <div class="unit-text ml-1">{{ stg.units.distance }}</div>
                        </div>

                        <div :class="['trend-text font-weight-black text-capitalize', trendColor]"
                            style="font-size: 0.8rem;">
                            {{ stg.lightning.currentStorm?.trend }}
                        </div>
                    </div>
                    <div class="text-right d-flex flex-column align-center" style="min-width: 100px;">
                        <v-icon icon="mdi-navigation"
                            :style="{ transform: `rotate(${stg.lightning.currentStorm?.bearing || 0}deg)`, transition: 'transform 0.5s' }"
                            size="38" color="slate-lighten-2"></v-icon>
                        <div class="unit-text ml-1" style="font-size: 1.0rem;">
                            {{ getDir(stg.lightning.currentStorm?.bearing) }}
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="stg.lightning.history.length > 0" class="sparkline-container mt-2" style="position: relative;">
                <v-sparkline :model-value="sparklineValues" :gradient="['#4caf50', '#ffeb3b', '#f44336']" smooth="100"
                    line-width=" 2" height="100" fill padding="3" :min="0"></v-sparkline>
                <div style="
                    position: absolute; 
                    bottom: 5px; 
                    left: 10px; 
                    right: 10px; 
                    display: flex; 
                    justify-content: space-between; 
                    pointer-events: none;
                    z-index: 2;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.9);
                    transition: all 0.3s ease;
                " :style="{
                    color: sparklineValues.some(v => v > 0) ? '#FFFFFF' : '#757575',
                    opacity: sparklineValues.some(v => v > 0) ? '1.0' : '0.5'
                }" class="text-caption font-weight-bold">
                    <span>-{{ stg.lightning.resetTime }}m</span>
                    <span class="text-grey-darken-1 ml-2 mt-1" style="font-size: 0.65rem;">Closer strikes peak
                        higher
                    </span>
                    <span>NOW</span>
                </div>
            </div>
            <div>
                <v-expansion-panels v-if="stg.lightning.history.length > 0" v-model="stg.lightning.ui.panel" flat
                    class="mt-2">
                    <v-expansion-panel value="strikes" bg-color="transparent">
                        <v-expansion-panel-title :ripple="false"
                            class="text-capitalize text-caption font-weight-bold text-brown-lighten-4"
                            :class="[(stg?.lightning.history.length > 0) ? 'text-green-accent-2' : 'text-grey-darken-1']">
                            Recent Strikes
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <div v-for="(strike, index) in recentStrikes" :key="index">
                                <v-row no-gutters align="center"
                                    :class="strike.dist > stg.lightning.searchRadius ? 'text-disabled' : ''">
                                    <v-col cols="4" class="text-left text-grey-lighten-1 time-col"
                                        style="white-space: nowrap;">
                                        {{ formatTime(strike.time) }}
                                    </v-col>
                                    <v-col cols="4" class="text-center font-weight-bold text-orange-darken-1">
                                        {{ formatDistance(strike.distance) }}<span class="text-caption ml-1">{{
                                            stg.units.distance
                                            }}</span>
                                    </v-col>
                                    <v-col cols="4" class="text-right font-weight-bold text-white">
                                        {{ getDir(strike.bearing) }}
                                    </v-col>
                                </v-row>
                                <v-divider v-if="index < recentStrikes.length - 1"
                                    class="mt-1 border-bottom-dim"></v-divider>
                            </div>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </div>

        </v-card-text>

        <div class="px-5 py-1 footer-bg border-top-dim rounded-b-lg">
            <div class="d-flex justify-space-between align-center text-caption font-weight-bold">
                <span class="text-orange" style="font-size: 0.7rem;">Area: {{
                    convertedDistance(stg?.lightning.searchRadius) }}
                    {{
                        stg.units.distance }}</span>
                <div :class="[(stg?.lightning.history.length > 0) ? 'text-green-accent-2' : 'text-grey-darken-1',
                    'd-flex align-center align-center justify-center mr-3']" style="font-size: 0.65rem;">
                    <v-icon icon="mdi-pulse" size="10" class="pulse-icon"></v-icon>
                    {{ lastUpdated }}
                </div>
                <span class="text-orange" style="font-size: 0.7rem;">Alert: {{
                    convertedDistance(stg?.lightning.alertThreshold)
                }} {{
                        stg.units.distance }}</span>
            </div>
        </div>

    </v-sheet>
</template>

<script>
import { settings } from './dashboardSettings.js';
export default {
    name: 'LightningCard',
    inheritAttrs: false,
    props: {
        stg: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            shared: window.G_STATE,
            settings: settings,
            currentServerIndex: 0,
            connection: null,
            reconnectTimer: null,
            heartbeat: null,
            panel: null,
            instanceId: null,
            isConnecting: false,
        };
    },
    created() {
        this.instanceId = Math.floor(Math.random() * 1000);

        if (this.stg.lightning.heartbeat) {
            clearInterval(this.stg.lightning.heartbeat);
            this.stg.lightning.heartbeat = null;
        }
    },

    beforeUnmount() {
        if (this.stg.lightning.heartbeat) clearInterval(this.stg.lightning.heartbeat);
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.connection.onclose = null;
        if (this.connection) this.connection.close();
        if (this.trendTimer) {
            clearInterval(this.trendTimer);
        }
    },

    mounted() {
        window.dashboard = this.stg;
        window.lightningCard = this;


        if (this.freqTimer) clearInterval(this.freqTimer);

        const saved = localStorage.getItem('station_config_v1');
        if (saved && saved !== "undefined") {
            try {
                const config = JSON.parse(saved);

            } catch (e) {
                console.error("Config Sysgen Failure: Malformed JSON in localStorage", e);


            }
        } else {

        }


        this.connect();
        this.thunderPlayer = new Audio('/sounds/thunder.mp3');
        this.thunderPlayer.load();
        this.updateFrequency();
        this.trendTimer = setInterval(() => {
            this.calculateTrend();
        }, 5000);


        this.establishConnection();


        this.freqTimer = setInterval(() => {
            this.updateFrequency();
        }, 10000);
    },
    unmounted() {

        if (this.connection) this.connection.close();
    },
    watch: {

        'stg.lightning.resetTime'(newVal) {

            const cutoff = Date.now() - (newVal * 60 * 1000);
            this.stg.lightning.history = this.stg.lightning.history.filter(s => s.time > cutoff);
            this.stg.lightning.currentStorm.frequency = this.stg.lightning.history.length;
        },
    },
    methods: {
        lzw_decode(s) {
            let dict = {};
            let data = (s + "").split("");
            let currChar = data[0];
            let oldPhrase = currChar;
            let out = [currChar];
            let code = 256;
            let phrase;
            for (let i = 1; i < data.length; i++) {
                let currCode = data[i].charCodeAt(0);
                if (currCode < 256) {
                    phrase = data[i];
                } else {
                    phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
                }
                out.push(phrase);
                currChar = phrase.charAt(0);
                dict[code] = oldPhrase + currChar;
                code++;
                oldPhrase = phrase;
            }
            return out.join("");
        },

        async connect() {
            if (this.isConnecting) return;

            this.isConnecting = true;

            try {

                const response = await fetch('/api/blitz-js');
                const scriptText = await response.text();
                const keyMatch = scriptText.match(/var\s+key\s*=\s*(\d+)/);

                if (!keyMatch) {
                    console.error("Could not find authorization key.");

                    setTimeout(() => this.connect(), 10000);
                    return;
                }

                this.authKey = Number(keyMatch[1]);

                this.establishConnection();
            } catch (err) {
                console.error("Connection failed:", err);
                setTimeout(() => this.connect(), 10000);
            }
        },

        establishConnection() {

            if (this.stg.lightning.heartbeat) clearInterval(this.stg.lightning.heartbeat);

            if (this.connection) {
                this.connection.onclose = null;
                this.connection.close();
            }
            const { lightning } = this.stg;

            this.stg.lightning.currentServerIndex = (this.stg.lightning.currentServerIndex + 1) % lightning.wssServers.length;
            const serverNum = lightning.wssServers[this.stg.lightning.currentServerIndex];
            const wssUrl = `wss://ws${serverNum}.blitzortung.org`;

            this.connection = new WebSocket(wssUrl);

            this.connection.onopen = () => {

                setTimeout(() => {
                    if (this.connection.readyState === WebSocket.OPEN) {
                        const payload = JSON.stringify({ a: this.authKey });
                        this.connection.send(payload);
                    }
                }, 1000);

                this.stg.lightning.heartbeat = setInterval(() => {
                    if (this.connection && this.connection.readyState === 1) {
                        const payload = JSON.stringify({ a: this.authKey });
                        this.connection.send(payload);
                    }
                }, 30000);
            };

            this.connection.onmessage = (event) => {
                try {
                    const decodedString = this.lzw_decode(event.data);
                    const raw = JSON.parse(decodedString);

                    const strike = {
                        lat: raw[1] || raw.la || raw.lat,
                        lon: raw[2] || raw.lo || raw.lon,

                        time: Date.now()
                    };

                    if (strike.lat !== undefined && strike.lon !== undefined) {
                        this.processIncomingStrike(strike);
                    }
                } catch (e) {

                }
            };

            this.connection.onclose = (event) => {
                if (this.stg.lightning.heartbeat) clearInterval(this.stg.lightning.heartbeat);

                const { lightning } = this.stg;
                this.stg.lightning.currentServerIndex = (this.stg.lightning.currentServerIndex + 1) % lightning.wssServers.length;

                const currentServer = lightning.wssServers[this.stg.lightning.currentServerIndex];

                setTimeout(() => this.establishConnection(), 5000);
            };

            this.connection.onerror = (err) => {

                console.error("WebSocket Error detected. Closing for rotation.");
                this.connection.close();
            };
        },

        formatDistance(rawDistance) {
            if (rawDistance === undefined || rawDistance === null) return '--';

            const unit = String(this.stg?.units?.distance || 'mi').trim().toLowerCase();
            return unit === 'km'
                ? Math.round(rawDistance * 1.60934)
                : Math.round(rawDistance);
        },

        processIncomingStrike(data) {
            if (!data || data.lat === undefined || data.lon === undefined) return;

            const now = Date.now();
            const home = this.stg.lightning?.homeLocation || { lat: 34.05, lon: -118.24 };

            const toRad = (v) => (v * Math.PI) / 180;
            const isMi = this.stg.units.distance.toLowerCase() === 'mi';

            const R = 3958.8;

            const dLat = toRad(data.lat - home.lat);
            const dLon = toRad(data.lon - home.lon);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(home.lat)) * Math.cos(toRad(data.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

            const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

            if (dist <= this.stg.lightning.searchRadius) {

                const y = Math.sin(toRad(data.lon - home.lon)) * Math.cos(toRad(data.lat));
                const x = Math.cos(toRad(home.lat)) * Math.sin(toRad(data.lat)) -
                    Math.sin(toRad(home.lat)) * Math.cos(toRad(data.lat)) * Math.cos(toRad(data.lon - home.lon));
                const bearing = Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360);
                const heading = this.getDir(bearing); //added for trending 5/19/26

                const history = this.stg.lightning.history;
                if (history.length > 0) {
                    const currentStrikeTime = Number(data.time) || now;

                    const isDuplicate = history.slice(-5).some(pastStrike => {
                        const timeDelta = Math.abs(currentStrikeTime - pastStrike.time);

                        if (timeDelta < 3000) {
                            const distDelta = Math.abs(dist - pastStrike.distance);
                            const bearingDelta = Math.abs(bearing - pastStrike.bearing);
                            const trueBearingDelta = bearingDelta > 180 ? 360 - bearingDelta : bearingDelta;

                            if (distDelta <= 25 && trueBearingDelta <= 15) {
                                return true;
                            }
                        }
                        return false;
                    });

                    if (isDuplicate) {

                        return;
                    }
                }
                this.stg.lightning.history.push({
                    time: data.time || now,
                    distance: dist,
                    bearing: bearing,
                    heading: heading
                });

                this.stg.lightning.currentStorm.distance = dist;
                this.stg.lightning.currentStorm.bearing = bearing;

                this.updateFrequency();
                this.playThunder();
                this.calculateTrend();
            }
        },


        startExpiryTimer() {
            if (this.expiryTimer) clearInterval(this.expiryTimer);

            this.expiryTimer = setInterval(() => {
                const history = this.stg.lightning.history;
                if (!history.length) return;

                const now = Date.now();

                const windowMs = (this.stg.lightning.resetTime || 30) * 60 * 1000;
                const cutoff = now - windowMs;


                this.stg.lightning.history = history.filter(s => s.time > cutoff);

                if (this.stg.lightning.history.length === 0) {
                    this.stg.lightning.currentStorm = { distance: 0, bearing: 0, trend: 'Stationary', frequency: 0 };

                }
            }, 10000);
        },

        toggleMute() {
            const newValue = !this.stg.lightning.isMuted;

            this.stg.lightning = {
                ...this.stg.lightning,
                isMuted: newValue
            };
        },

        openSettings() {

            this.lightning = JSON.parse(JSON.stringify(this.stg.lightning));
            this.showModal = true;
        },

        formatTime(ts) {
            if (!ts) return "--:--:--";
            const date = new Date(ts);
            return date.toLocaleTimeString('en-US', {
                hour12: true,
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit'
            });
        },

        getDir(b) {
            const sectors = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
            return sectors[Math.round((b || 0) / 22.5) % 16];
        },

        getTimeAgo(ts) {
            const seconds = Math.floor((Date.now() - ts) / 1000);
            if (seconds < 60) return "Just now";
            const minutes = Math.floor(seconds / 60);
            return minutes < 60 ? minutes + "m ago" : Math.floor(minutes / 60) + "h ago";
        },



        calculateTrend() {

            if (!this.stg || !this.stg.lightning || !Array.isArray(this.stg.lightning.history)) {
                return;
            }

            const lightning = this.stg.lightning;
            const h = this.stg.lightning.history;
            const config = this.stg.config || {};
            const sampleSize = Number(lightning.sampleSize) || 20;
            const sensitivity = Number(lightning.sensitivity) || 5;


            const headings16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
            const directionalTrends = {};

            headings16.forEach(dir => {
                directionalTrends[dir] = { trend: 'Stationary', activityCount: 0, diff: 0 };
            });


            h.forEach(strike => {
                if (directionalTrends[strike.heading]) {
                    directionalTrends[strike.heading].activityCount++;
                }
            });


            headings16.forEach(dir => {

                const directionalWindow = h.filter(strike => strike.heading === dir).slice(-sampleSize);


                if (directionalWindow.length < sampleSize) {
                    directionalTrends[dir].trend = 'Stationary';
                    return;
                }

                const mid = Math.floor(directionalWindow.length / 2);
                let diff = 0;


                if (config.algorithm === 'Percentile (Balanced)') {
                    const oldSorted = directionalWindow.slice(0, mid)
                        .map(strike => ({ ...strike }))
                        .sort((a, b) => a.distance - b.distance);

                    const newSorted = directionalWindow.slice(-mid)
                        .map(strike => ({ ...strike }))
                        .sort((a, b) => a.distance - b.distance);

                    const percentileWeight = 0.5;
                    const oldIdx = Math.floor(percentileWeight * (oldSorted.length - 1));
                    const newIdx = Math.floor(percentileWeight * (newSorted.length - 1));

                    diff = oldSorted[oldIdx].distance - newSorted[newIdx].distance;

                } else if (config.algorithm === 'Closest Strike (Fastest)') {
                    diff = directionalWindow[0].distance - directionalWindow[directionalWindow.length - 1].distance;
                } else {

                    const oldAvg = directionalWindow.slice(0, mid).reduce((a, b) => a + b.distance, 0) / mid;
                    const newAvg = directionalWindow.slice(-mid).reduce((a, b) => a + b.distance, 0) / mid;
                    diff = oldAvg - newAvg;
                }

                directionalTrends[dir].diff = diff;


                if (diff > sensitivity) {
                    directionalTrends[dir].trend = 'Approaching';
                } else if (diff < -sensitivity) {
                    directionalTrends[dir].trend = 'Receding';
                } else {
                    directionalTrends[dir].trend = 'Stationary';
                }
            });


            this.directionalTrends = directionalTrends;


            let highestThreatSector = 'None';
            let recedingSector = 'None';

            let closestApproachingDist = Infinity;
            let closestRecedingDist = Infinity;
            const alertRadiusThreshold = Number(config.alertRadius) || 25;

            headings16.forEach(dir => {
                const sectorStrikes = h.filter(strike => strike.heading === dir);
                if (sectorStrikes.length === 0) return;

                const closestSectorDist = Math.min(...sectorStrikes.map(s => s.distance));
                const currentTrend = directionalTrends[dir].trend;


                if (currentTrend === 'Approaching') {
                    if (closestSectorDist < closestApproachingDist) {
                        closestApproachingDist = closestSectorDist;
                        highestThreatSector = dir;
                    }
                } else if (currentTrend === 'Receding') {
                    if (closestSectorDist < closestRecedingDist) {
                        closestRecedingDist = closestSectorDist;
                        recedingSector = dir;
                    }
                }
            });


            if (closestRecedingDist <= alertRadiusThreshold && closestRecedingDist < closestApproachingDist) {

                lightning.currentStorm.trend = `Receding ${recedingSector}`;
            } else if (highestThreatSector !== 'None') {

                lightning.currentStorm.trend = `Approaching ${highestThreatSector}`;
            } else if (recedingSector !== 'None') {

                lightning.currentStorm.trend = `Receding ${recedingSector}`;
            } else {
                lightning.currentStorm.trend = 'Stationary';
            }
        },


        updateFrequency() {
            if (!this.stg || !this.stg.lightning) {
                console.warn("LightningCard waiting for state hydration...");
                return;
            }

            const now = Date.now();
            const radius = Number(this.stg.lightning?.searchRadius || 50);



            const resetMinutes = this.stg.lightning.resetTime || 10;
            const cutoff = now - (resetMinutes * 60 * 1000);


            this.stg.lightning.history = this.stg.lightning.history.filter(s => s.time > cutoff);


            const oneMinuteAgo = now - 60000;
            const localStrikes = this.stg.lightning.history.filter(s => {
                const isRecent = s.time > oneMinuteAgo;
                const d = typeof s.distance === 'number' ? s.distance : parseFloat(s.distance);
                const isClose = Number(s.distance) <= radius;

                return s.time > oneMinuteAgo && Number(s.distance) <= radius;
            });




            const freq = localStrikes.length;
            this.stg.lightning.currentStorm.frequency = freq;


            if (this.stg.lightning.history.length === 0) {
                this.stg.lightning.currentStorm = {
                    distance: 0,
                    bearing: 0,
                    trend: 'Stationary',
                    frequency: 0
                };
            }
        },

        playThunder() {

            if (this.stg.lightning.isMuted) {
                return;
            }

            if (!this.thunderAudio) {
                this.thunderAudio = new Audio('/sounds/thunder.mp3');
            }

            this.thunderAudio.currentTime = 0;
            this.thunderAudio.play().catch(e => console.warn(e));
        },

        resetBuffer() {
            if (this.stg?.lightning.history) {
                this.stg.lightning.history = [];

                this.stg.lightning.currentStorm = {
                    distance: 0,
                    bearing: 0,
                    trend: 'Stationary',
                    frequency: 0
                };
            }
        },
        exportToDisk() {
            const dataStr = JSON.stringify(this.stg.config, null, 4);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `lightning-config-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            URL.revokeObjectURL(url);

        },
        importFromDisk(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedConfig = JSON.parse(e.target.result);

                    this.stg.lightning = { ...this.stg.lightning, ...importedConfig };

                    this.localConfig = JSON.parse(JSON.stringify(this.stg.lightning));

                    localStorage.setItem('lightning_config_v1', JSON.stringify(this.stg.lightning));

                    alert("Settings Restored Successfully!");
                } catch (err) {
                    console.error("Invalid JSON file:", err);
                    alert("Error: Failed to read the backup file.");
                }
            };
            reader.readAsText(file);
        },

        simulateStormCell(direction, startingDistance, simType = 'approaching') {

            const headingToDegrees = {
                'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
                'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
                'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
                'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
            };

            const bearing = headingToDegrees[direction.toUpperCase()] || 0;
            const home = this.stg.lightning?.homeLocation || { lat: 34.05, lon: -118.24 };
            const R_EARTH = 3958.8;

            let currentDistance = startingDistance;
            let pulseCount = 0;


            const interval = setInterval(() => {
                if (pulseCount >= 25) {
                    clearInterval(interval);
                    return;
                }

                if (simType.toLowerCase() === 'receding') {
                    currentDistance += 1.5;
                    if (currentDistance > 100) currentDistance = 100;
                } else {
                    currentDistance -= 1.5;
                    if (currentDistance < 2) currentDistance = 2;
                }






                const bearingRad = (bearing * Math.PI) / 180;
                const centerLatRad = (home.lat * Math.PI) / 180;
                const centerLonRad = (home.lon * Math.PI) / 180;
                const distRad = currentDistance / R_EARTH;

                const strikeLatRad = Math.asin(
                    Math.sin(centerLatRad) * Math.cos(distRad) +
                    Math.cos(centerLatRad) * Math.sin(distRad) * Math.cos(bearingRad)
                );
                const strikeLonRad = centerLonRad + Math.atan2(
                    Math.sin(bearingRad) * Math.sin(distRad) * Math.cos(centerLatRad),
                    Math.cos(distRad) - Math.sin(centerLatRad) * Math.sin(strikeLatRad)
                );

                const fakeStrike = {
                    lat: (strikeLatRad * 180) / Math.PI,
                    lon: (strikeLonRad * 180) / Math.PI,
                    time: Date.now()
                };


                this.processIncomingStrike(fakeStrike);
                pulseCount++;
            }, 2000);
        },
        simulateFullStormCycle(direction) {

            this.simulateStormCell(direction, 45, 'approaching');


            setTimeout(() => {
                this.simulateStormCell(direction, 5, 'receding');
            }, 51000);
        }
    },
    computed: {

        lightning() {
            return this.stg?.lightning || {};
        },


        sparklineValues() {
            const resetMinutes = this.stg.lightning.resetTime || 10;
            const now = Date.now();
            const windowMs = resetMinutes * 60 * 1000;
            const bucketCount = 120;
            const buckets = new Array(bucketCount).fill(0);
            const maxDist = this.stg.lightning.searchRadius || 100;


            if (this.stg.lightning.history && this.stg.lightning.history.length > 0) {
                this.stg.lightning.history.forEach(strike => {

                    let strikeTime = Number(strike.time);
                    if (strikeTime < 10000000000) strikeTime *= 1000;

                    const ageMs = now - strikeTime;


                    if (ageMs <= windowMs && ageMs >= -5000) {
                        const bucketIndex = Math.floor(((windowMs - ageMs) / windowMs) * (bucketCount - 1));

                        if (bucketIndex >= 0 && bucketIndex < bucketCount) {


                            let intensity = Math.max(5, ((maxDist - strike.distance) / maxDist) * 100);

                            intensity = Math.max(5, intensity);

                            if (intensity > buckets[bucketIndex]) {
                                buckets[bucketIndex] = intensity;
                            }
                        }
                    }
                });
            }
            return buckets;
        },

        recentStrikes() {
            const history = this.lightning.history || [];
            const radius = this.stg.lightning.searchRadius || 100;
            return [...history]
                .reverse()
                .slice(0, 5);
        },

        lastUpdated() {
            if (!this.lightning.history.length) return 'No Data';
            return this.getTimeAgo(this.lightning.history[this.lightning.history.length - 1].time);
        },

        convertedDistance() {
            return (rawDistance) => {
                return this.formatDistance(rawDistance);
            };
        },

        trendColor() {
            const t = this.lightning.currentStorm?.trend;
            return t === 'Approaching' ? 'text-red-lighten-2' : (t === 'Receding' ? 'text-green-accent-2' : 'text-blue-lighten-3');
        },

        freqColor() {
            const f = this.lightning.currentStorm?.frequency || 0;
            if (f === 0) return 'grey-darken-3';
            return f < 10 ? 'blue-lighten-1' : (f < 20 ? 'orange-darken-1' : 'red-darken-2');
        },

        isMuted() {
            return this.stg.lightning.isMuted;
        },

        nearestActiveStrike() {
            if (!this.stg?.lightning?.history?.length) return null;
            return this.stg.lightning.history.reduce((prev, curr) =>
                prev.dist < curr.dist ? prev : curr
            );
        },
    }
};
</script>

<style scoped>
.lightning-card {
    border: 0;
}

.station-card {
    width: 100%;
    padding-top: 4px;
    overflow: hidden;
    background:
        linear-gradient(180deg, rgba(245, 158, 11, 0.12), transparent 34%),
        rgba(15, 23, 42, 0.78);
    color: #e5eefb;
}

.header-bg {
    margin: 0 14px 10px;
    padding: 12px !important;
    border: 1px solid rgba(148, 163, 184, 0.12);
    border-radius: 16px;
    background: rgba(2, 6, 23, 0.32);
}

.card-title-text {
    color: #f8fafc !important;
}

.card-source-text {
    color: #8fa3b8;
}

.footer-bg {
    background: rgba(2, 6, 23, 0.38);
}

.border-top-dim {
    border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.border-bottom-dim {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.display-value {
    font-size: 3.5rem;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -2px;
}

.unit-text {
    font-size: 1.2rem;
    color: #94a3b8;
}

.danger-banner {
    animation: danger-pulse 2s infinite;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
}

.pulse-icon {
    animation: pulse-animation 2s infinite;
}

.pulsing-icon {
    animation: pulse-lightning 1.5s infinite ease-in-out;
}

@keyframes danger-pulse {

    0%,
    100% {
        background-color: #d32f2f;
    }

    50% {
        background-color: #b71c1c;
    }
}

@keyframes pulse-animation {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.3;
    }
}

@keyframes pulse-lightning {

    0%,
    100% {
        transform: scale(1);
        filter: drop-shadow(0 0 0px #FFD54F);
    }

    50% {
        transform: scale(1.2);
        filter: drop-shadow(0 0 8px #FFD54F);
    }
}

.pulse-animation {
    animation: flash 2s infinite;
}

@keyframes flash {
    0% {
        opacity: 1;
    }

    50% {
        opacity: 0.4;
    }

    100% {
        opacity: 1;
    }
}

.time-col {
    white-space: nowrap;
    font-family: monospace;
    font-size: 0.85rem;
}


:deep(.v-expansion-panel-title) {
    min-height: 32px !important;

    padding: 0 8px !important;

}


:deep(.v-expansion-panel-title__icon) {
    margin-inline-start: 4px !important;
    user-select: none;
}


:deep(.v-expansion-panel-text__wrapper) {
    padding: 8px 12px 12px 12px !important;
}
</style>
