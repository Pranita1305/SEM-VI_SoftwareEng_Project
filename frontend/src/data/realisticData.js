/* ══════════════════════════════════════════════════════════════
   Realistic Bangalore Ride Data
   Central source-of-truth used by Dashboard, SearchResults,
   Heatmap, and Chatbot offline fallback.
   ══════════════════════════════════════════════════════════════ */

/* ── 15 Bangalore Zones ─────────────────────────────────────── */
export const BANGALORE_ZONES = [
  { id: 1,  name: "Koramangala",       lat: 12.9352, lng: 77.6245, baseDemand: 185, baseSurge: 2.0, cluster: 1, pop: "High-density tech hub" },
  { id: 2,  name: "Indiranagar",       lat: 12.9784, lng: 77.6408, baseDemand: 160, baseSurge: 1.7, cluster: 1, pop: "Nightlife & restaurant corridor" },
  { id: 3,  name: "Whitefield",        lat: 12.9698, lng: 77.7500, baseDemand: 210, baseSurge: 2.4, cluster: 2, pop: "IT park belt — ITPL hub" },
  { id: 4,  name: "Electronic City",   lat: 12.8440, lng: 77.6602, baseDemand: 195, baseSurge: 2.2, cluster: 2, pop: "Infosys & Wipro campus zone" },
  { id: 5,  name: "HSR Layout",        lat: 12.9116, lng: 77.6389, baseDemand: 145, baseSurge: 1.5, cluster: 1, pop: "Startup ecosystem hub" },
  { id: 6,  name: "Marathahalli",      lat: 12.9562, lng: 77.7019, baseDemand: 170, baseSurge: 1.9, cluster: 2, pop: "ORR tech corridor" },
  { id: 7,  name: "MG Road",           lat: 12.9756, lng: 77.6070, baseDemand: 130, baseSurge: 1.4, cluster: 3, pop: "CBD & metro commercial strip" },
  { id: 8,  name: "Jayanagar",         lat: 12.9308, lng: 77.5838, baseDemand: 120, baseSurge: 1.2, cluster: 3, pop: "Residential — shopping district" },
  { id: 9,  name: "Hebbal",            lat: 13.0358, lng: 77.5970, baseDemand: 155, baseSurge: 1.6, cluster: 4, pop: "Airport flyover junction" },
  { id: 10, name: "Yeshwanthpur",      lat: 13.0220, lng: 77.5433, baseDemand: 110, baseSurge: 1.3, cluster: 4, pop: "Railway & industrial zone" },
  { id: 11, name: "Rajajinagar",       lat: 12.9910, lng: 77.5520, baseDemand: 95,  baseSurge: 1.1, cluster: 3, pop: "Heritage residential area" },
  { id: 12, name: "Bannerghatta Road", lat: 12.8877, lng: 77.5970, baseDemand: 140, baseSurge: 1.5, cluster: 1, pop: "South tech corridor" },
  { id: 13, name: "JP Nagar",          lat: 12.9063, lng: 77.5857, baseDemand: 115, baseSurge: 1.2, cluster: 3, pop: "South Bangalore residential" },
  { id: 14, name: "Malleshwaram",      lat: 13.0035, lng: 77.5710, baseDemand: 100, baseSurge: 1.1, cluster: 3, pop: "Traditional market district" },
  { id: 15, name: "Sadashivanagar",    lat: 13.0070, lng: 77.5820, baseDemand: 80,  baseSurge: 1.0, cluster: 4, pop: "Government & cantonment area" },
];

export const ZONE_NAMES = BANGALORE_ZONES.map(z => z.name);

/* ── 24-Hour Demand Multiplier Curve ─────────────────────────
   Multiplied against baseDemand to get time-aware demand
   Minimum 0.35 so even night hours show meaningful data     */
const DEMAND_CURVE = [
  0.40, 0.36, 0.35, 0.35, 0.38, 0.45,   //  0–5am  (night low but still active)
  0.55, 0.78, 0.95, 1.00, 0.82, 0.68,   //  6–11am (morning rush peak at 9am)
  0.62, 0.58, 0.55, 0.60, 0.72, 0.85,   // 12–5pm  (lunch dip, afternoon build)
  1.00, 0.98, 0.88, 0.75, 0.60, 0.48,   // 6–11pm  (evening rush peak at 6-7pm)
];

/* ── Surge Curve (higher during rush) ────────────────────── */
const SURGE_CURVE = [
  0.95, 0.95, 0.90, 0.90, 0.92, 0.95,  // Night: still meaningful
  1.00, 1.20, 1.50, 1.60, 1.30, 1.05,  // Morning rush
  1.00, 0.95, 0.95, 1.05, 1.15, 1.40,  // Afternoon
  1.60, 1.55, 1.35, 1.15, 1.05, 1.00,  // Evening rush + late night
];

/* ── Time-Aware Helpers ──────────────────────────────────── */
export function getDemandForZone(zone, hour = new Date().getHours()) {
  const base = zone.baseDemand;
  const mult = DEMAND_CURVE[hour] || 0.5;
  // Add ±15% jitter so numbers don't look identical
  const jitter = 0.85 + Math.random() * 0.30;
  // Hard floor: never show less than 25 rides
  return Math.max(25, Math.round(base * mult * jitter));
}

export function getSurgeForZone(zone, hour = new Date().getHours()) {
  const base = zone.baseSurge;
  const mult = SURGE_CURVE[hour] || 1.0;
  const raw = base * mult;
  // Clamp between 1.0 and 3.0 — round to 1 decimal
  return Math.round(Math.max(1.0, Math.min(3.0, raw)) * 10) / 10;
}

export function getTrendLabel(surge) {
  if (surge >= 2.0) return "critical";
  if (surge >= 1.5) return "high";
  if (surge >= 1.2) return "moderate";
  return "normal";
}

/* Generate a full snapshot of all zones at the current hour */
export function getZoneSnapshot(hour = new Date().getHours()) {
  return BANGALORE_ZONES.map(z => ({
    id:     z.id,
    name:   z.name,
    demand: getDemandForZone(z, hour),
    surge:  getSurgeForZone(z, hour),
    trend:  getTrendLabel(getSurgeForZone(z, hour)),
    lat:    z.lat,
    lng:    z.lng,
    cluster: z.cluster,
    pop:    z.pop,
  }));
}

/* ── Hourly Demand Data for Charts ───────────────────────── */
export function getHourlyDemandData(zone) {
  const labels = [
    "12am","1am","2am","3am","4am","5am",
    "6am","7am","8am","9am","10am","11am",
    "12pm","1pm","2pm","3pm","4pm","5pm",
    "6pm","7pm","8pm","9pm","10pm","11pm",
  ];
  return labels.map((time, h) => ({
    time,
    demand: Math.round(zone.baseDemand * DEMAND_CURVE[h] * (0.9 + Math.random() * 0.2)),
  }));
}

/* ── Driver Pool (20 Drivers) ────────────────────────────── */
export const DRIVER_POOL = [
  { name: "Ramesh Kumar",     rating: 4.8, trips: 12450, vehicle: "Maruti Swift Dzire",   plate: "KA 01 MH 4521", photo: "🧑" },
  { name: "Suresh Gowda",     rating: 4.6, trips: 8930,  vehicle: "Hyundai i20",          plate: "KA 03 AB 7762", photo: "👨" },
  { name: "Priya Sharma",     rating: 4.9, trips: 15200, vehicle: "Toyota Innova Crysta", plate: "KA 05 CD 1234", photo: "👩" },
  { name: "Mohammed Farhan",  rating: 4.7, trips: 10800, vehicle: "Maruti WagonR",        plate: "KA 02 EF 5678", photo: "🧔" },
  { name: "Lakshmi Devi",     rating: 4.5, trips: 6700,  vehicle: "Tata Nexon",           plate: "KA 04 GH 9012", photo: "👩" },
  { name: "Venkatesh Reddy",  rating: 4.8, trips: 18600, vehicle: "Honda City",           plate: "KA 01 JK 3456", photo: "👨" },
  { name: "Anita Rao",        rating: 4.7, trips: 9300,  vehicle: "Hyundai Verna",        plate: "KA 03 LM 7890", photo: "👩" },
  { name: "Kiran Patil",      rating: 4.4, trips: 5200,  vehicle: "Maruti Ertiga",        plate: "KA 05 NP 2345", photo: "🧑" },
  { name: "Deepak Nair",      rating: 4.6, trips: 7800,  vehicle: "Tata Tiago",           plate: "KA 02 QR 6789", photo: "👨" },
  { name: "Sunita Hegde",     rating: 4.9, trips: 21000, vehicle: "Toyota Etios",         plate: "KA 01 ST 1230", photo: "👩" },
  { name: "Ravi Shankar",     rating: 4.3, trips: 4100,  vehicle: "Bajaj RE Auto",        plate: "KA 04 UV 4567", photo: "🧑" },
  { name: "Meena Kumari",     rating: 4.7, trips: 11400, vehicle: "Hyundai Aura",         plate: "KA 03 WX 8901", photo: "👩" },
  { name: "Ashok Bhat",       rating: 4.5, trips: 8200,  vehicle: "Maruti Ciaz",          plate: "KA 05 YZ 2340", photo: "👨" },
  { name: "Ganesh Prasad",    rating: 4.8, trips: 14700, vehicle: "Kia Carens",           plate: "KA 01 AB 5670", photo: "🧑" },
  { name: "Kavitha Murthy",   rating: 4.6, trips: 9900,  vehicle: "Maruti Baleno",        plate: "KA 02 CD 8900", photo: "👩" },
  { name: "Srinivas Iyengar", rating: 4.4, trips: 6300,  vehicle: "Tata Punch",           plate: "KA 04 EF 1230", photo: "👨" },
  { name: "Naveen Joshi",     rating: 4.7, trips: 13200, vehicle: "Hyundai Creta",        plate: "KA 03 GH 4560", photo: "🧑" },
  { name: "Rekha Kamath",     rating: 4.8, trips: 16800, vehicle: "Honda Amaze",          plate: "KA 05 JK 7890", photo: "👩" },
  { name: "Harish Shetty",    rating: 4.5, trips: 7600,  vehicle: "Maruti Alto K10",      plate: "KA 01 LM 1230", photo: "👨" },
  { name: "Pooja Naik",       rating: 4.9, trips: 19500, vehicle: "Toyota Glanza",        plate: "KA 02 NP 4560", photo: "👩" },
];

/* Returns a deterministic-ish driver based on route + ride type */
export function getDriverForRoute(source, destination, rideType) {
  const seed = (source.length * 7 + destination.length * 13 + rideType.length * 3) % DRIVER_POOL.length;
  return DRIVER_POOL[seed];
}

/* ── Vehicle Models Per Ride Type ────────────────────────── */
export const RIDE_VEHICLES = {
  "UberGo":      ["Maruti Swift Dzire", "Hyundai Aura", "Tata Tiago", "Maruti WagonR"],
  "Uber Premier": ["Honda City", "Hyundai Verna", "Hyundai Creta", "Kia Seltos"],
  "Uber XL":     ["Toyota Innova Crysta", "Kia Carens", "Maruti Ertiga", "Mahindra XUV700"],
  "Uber Auto":   ["Bajaj RE Auto", "TVS King", "Piaggio Ape"],
};

/* ── Pricing Constants ───────────────────────────────────── */
export const PRICING = {
  "UberGo":       { baseKm: 9,  perKm: 12, minFare: 80,  platformFee: 15, gstPct: 5 },
  "Uber Premier": { baseKm: 14, perKm: 18, minFare: 150, platformFee: 20, gstPct: 5 },
  "Uber XL":      { baseKm: 18, perKm: 22, minFare: 200, platformFee: 25, gstPct: 5 },
  "Uber Auto":    { baseKm: 5,  perKm: 8,  minFare: 35,  platformFee: 5,  gstPct: 5 },
};

export function getFareBreakdown(rideType, distanceKm, surge) {
  const p = PRICING[rideType] || PRICING["UberGo"];
  const baseFare  = p.baseKm;
  const distFare  = Math.round(p.perKm * distanceKm);
  const subTotal  = baseFare + distFare;
  const surgeAmt  = Math.round(subTotal * (surge - 1));
  const gst       = Math.round((subTotal + surgeAmt) * p.gstPct / 100);
  const total     = Math.max(p.minFare, subTotal + surgeAmt + gst + p.platformFee);
  return { baseFare, distFare, surgeAmt, gst, platformFee: p.platformFee, total, minFare: p.minFare };
}

/* ── Weather Conditions ──────────────────────────────────── */
export function getWeather(hour = new Date().getHours()) {
  if (hour >= 6 && hour < 10)  return { icon: "☀️", label: "Sunny",         temp: "26°C", impact: "Clear roads — normal ETAs" };
  if (hour >= 10 && hour < 14) return { icon: "🌤️", label: "Partly Cloudy", temp: "31°C", impact: "Good visibility, slight heat" };
  if (hour >= 14 && hour < 17) return { icon: "⛅", label: "Overcast",       temp: "29°C", impact: "Possible afternoon drizzle" };
  if (hour >= 17 && hour < 20) return { icon: "🌧️", label: "Light Rain",    temp: "24°C", impact: "Wet roads — ETAs may increase 15%" };
  if (hour >= 20 && hour < 23) return { icon: "🌙", label: "Clear Night",   temp: "22°C", impact: "Low traffic, fast pickups" };
  return                              { icon: "🌃", label: "Late Night",    temp: "20°C", impact: "Minimal traffic, surge unlikely" };
}

/* ── Traffic Conditions ──────────────────────────────────── */
export function getTraffic(hour = new Date().getHours()) {
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20))
    return { level: "Heavy", color: "#f97454", etaMultiplier: 1.4, desc: "Rush hour — expect 30–40% longer ETAs" };
  if ((hour >= 11 && hour <= 16) || (hour >= 7 && hour < 8))
    return { level: "Moderate", color: "#fbbf24", etaMultiplier: 1.15, desc: "Normal flow with occasional slowdowns" };
  return   { level: "Light", color: "#34d399", etaMultiplier: 1.0, desc: "Smooth traffic — fastest travel times" };
}

/* ── Realistic Distance Calculator ───────────────────────── */
const ZONE_MAP = {};
BANGALORE_ZONES.forEach(z => { ZONE_MAP[z.name] = z; });

export function estimateRealisticDistance(source, destination) {
  const s = ZONE_MAP[source];
  const d = ZONE_MAP[destination];
  if (s && d) {
    // Haversine-like estimate * road factor 1.4
    const dLat = (d.lat - s.lat) * 111;
    const dLng = (d.lng - s.lng) * 111 * Math.cos(s.lat * Math.PI / 180);
    const straight = Math.sqrt(dLat * dLat + dLng * dLng);
    return Math.max(3, Math.round(straight * 1.4 * 10) / 10);
  }
  // Fallback
  const seed = (source.length * 7 + destination.length * 13) % 25;
  return Math.max(5, seed + 5);
}

/* ── Toll Estimate ───────────────────────────────────────── */
export function getTollEstimate(distanceKm) {
  if (distanceKm > 25) return 45;
  if (distanceKm > 15) return 25;
  return 0;
}
