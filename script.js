const STORAGE_KEY = "uav_flight_logs_v1";

const flightForm = document.getElementById("flightForm");
const clearFormBtn = document.getElementById("clearFormBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const flightTableBody = document.getElementById("flightTableBody");

const filterFromDate = document.getElementById("filterFromDate");
const filterToDate = document.getElementById("filterToDate");
const filterUavId = document.getElementById("filterUavId");
const filterPilot = document.getElementById("filterPilot");
const filterResult = document.getElementById("filterResult");
const filterIncident = document.getElementById("filterIncident");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");

const kpiTotalFlights = document.getElementById("kpiTotalFlights");
const kpiSuccessRate = document.getElementById("kpiSuccessRate");
const kpiDistance = document.getElementById("kpiDistance");
const kpiIncidentRate = document.getElementById("kpiIncidentRate");
const kpiLandingAccuracy = document.getElementById("kpiLandingAccuracy");

let flights = loadFlights();
let filteredFlights = [...flights];

function loadFlights() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function saveFlights() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flights));
}

function toMinutes(timeStr) {
  if (!timeStr || !timeStr.includes(":")) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function getFlightTimeMin(takeoffTime, landingTime) {
  const start = toMinutes(takeoffTime);
  const end = toMinutes(landingTime);
  if (end >= start) return end - start;
  return 24 * 60 - start + end;
}

function parseNumber(val) {
  if (val === null || val === undefined || val === "") return 0;
  const num = Number(val);
  return Number.isFinite(num) ? num : 0;
}

function normalizeText(val) {
  return (val || "").toString().trim().toLowerCase();
}

function createFlightFromForm(formData) {
  const takeoffTime = formData.get("takeoffTime");
  const landingTime = formData.get("landingTime");

  return {
    id: crypto.randomUUID(),
    flightId: formData.get("flightId").trim(),
    date: formData.get("date"),
    uavId: formData.get("uavId").trim(),
    pilot: formData.get("pilot").trim(),
    payloadKg: parseNumber(formData.get("payloadKg")),
    takeoffTime,
    landingTime,
    flightTimeMin: getFlightTimeMin(takeoffTime, landingTime),
    distanceKm: parseNumber(formData.get("distanceKm")),
    batteryBefore: parseNumber(formData.get("batteryBefore")),
    batteryAfter: parseNumber(formData.get("batteryAfter")),
    gnss: formData.get("gnss"),
    link: formData.get("link"),
    flightResult: formData.get("flightResult"),
    landingAccuracy: parseNumber(formData.get("landingAccuracy")),
    incident: formData.get("incident") === "on",
    notes: formData.get("notes").trim(),
    createdAt: new Date().toISOString(),
  };
}

function applyFilters() {
  const fromDate = filterFromDate.value;
  const toDate = filterToDate.value;
  const uavId = normalizeText(filterUavId.value);
  const pilot = normalizeText(filterPilot.value);
  const result = filterResult.value;
  const incident = filterIncident.value;

  filteredFlights = flights.filter((item) => {
    if (fromDate && item.date < fromDate) return false;
    if (toDate && item.date > toDate) return false;
    if (uavId && !normalizeText(item.uavId).includes(uavId)) return false;
    if (pilot && !normalizeText(item.pilot).includes(pilot)) return false;
    if (result && item.flightResult !== result) return false;
    if (incident === "true" && !item.incident) return false;
    if (incident === "false" && item.incident) return false;
    return true;
  });

  renderTable();
  renderKpis();
}

function resetFilters() {
  filterFromDate.value = "";
  filterToDate.value = "";
  filterUavId.value = "";
  filterPilot.value = "";
  filterResult.value = "";
  filterIncident.value = "";
  filteredFlights = [...flights];
  renderTable();
  renderKpis();
}

function renderKpis() {
  const total = filteredFlights.length;
  const successCount = filteredFlights.filter((f) => f.flightResult === "Success").length;
  const incidentCount = filteredFlights.filter((f) => f.incident).length;
  const totalDistance = filteredFlights.reduce((sum, f) => sum + parseNumber(f.distanceKm), 0);
  const accuracyFlights = filteredFlights.filter((f) => parseNumber(f.landingAccuracy) > 0);
  const avgAccuracy = accuracyFlights.length
    ? accuracyFlights.reduce((sum, f) => sum + parseNumber(f.landingAccuracy), 0) / accuracyFlights.length
    : 0;

  kpiTotalFlights.textContent = total.toString();
  kpiSuccessRate.textContent = total ? `${((successCount / total) * 100).toFixed(1)}%` : "0%";
  kpiDistance.textContent = totalDistance.toFixed(2);
  kpiIncidentRate.textContent = total ? `${((incidentCount / total) * 100).toFixed(1)}%` : "0%";
  kpiLandingAccuracy.textContent = avgAccuracy.toFixed(2);
}

function renderTable() {
  if (!filteredFlights.length) {
    flightTableBody.innerHTML = `
      <tr>
        <td colspan="17">Chua co du lieu. Hay tao chuyen bay dau tien.</td>
      </tr>
    `;
    return;
  }

  const rows = [...filteredFlights]
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .map(
      (f) => `
      <tr>
        <td>${f.flightId}</td>
        <td>${f.date}</td>
        <td>${f.uavId}</td>
        <td>${f.pilot}</td>
        <td>${f.payloadKg}</td>
        <td>${f.takeoffTime}</td>
        <td>${f.landingTime}</td>
        <td>${f.flightTimeMin}</td>
        <td>${f.distanceKm}</td>
        <td>${f.batteryBefore}</td>
        <td>${f.batteryAfter}</td>
        <td>${f.gnss || "-"}</td>
        <td>${f.link || "-"}</td>
        <td>${f.flightResult}</td>
        <td>${f.landingAccuracy}</td>
        <td>${f.incident ? "Co" : "Khong"}</td>
        <td>${f.notes || "-"}</td>
      </tr>
    `
    )
    .join("");

  flightTableBody.innerHTML = rows;
}

flightForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(flightForm);
  const flight = createFlightFromForm(formData);

  flights.push(flight);
  saveFlights();
  applyFilters();
  flightForm.reset();
});

clearFormBtn.addEventListener("click", () => {
  flightForm.reset();
});

clearAllBtn.addEventListener("click", () => {
  if (!window.confirm("Ban chac chan muon xoa toan bo du lieu?")) return;
  flights = [];
  saveFlights();
  resetFilters();
});

applyFiltersBtn.addEventListener("click", applyFilters);
resetFiltersBtn.addEventListener("click", resetFilters);

renderTable();
renderKpis();
