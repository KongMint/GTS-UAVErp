const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 4000;
const DB_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DB_DIR, "flights.json");
const JWT_SECRET = process.env.JWT_SECRET || "uav-erp-dev-secret";
const TOKEN_EXPIRES_IN = "8h";

const users = [
  { username: "admin", password: "admin123", role: "admin", name: "System Admin" },
  { username: "dispatcher", password: "dispatcher123", role: "dispatcher", name: "Điều phối" },
  { username: "viewer", password: "viewer123", role: "viewer", name: "Người xem" },
];

app.use(cors());
app.use(express.json());

function ensureDb() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]), "utf-8");
}

function readFlights() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (error) {
    return [];
  }
}

function saveFlights(flights) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(flights, null, 2), "utf-8");
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function toMinutes(timeStr) {
  if (!timeStr || !timeStr.includes(":")) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function getFlightTimeMin(takeoffTime, landingTime) {
  const start = toMinutes(takeoffTime);
  const end = toMinutes(landingTime);
  return end >= start ? end - start : 24 * 60 - start + end;
}

function applyFilters(flights, query) {
  const fromDate = query.fromDate || "";
  const toDate = query.toDate || "";
  const uavId = (query.uavId || "").trim().toLowerCase();
  const pilot = (query.pilot || "").trim().toLowerCase();
  const flightResult = query.flightResult || "";
  const incident = query.incident || "";

  return flights.filter((item) => {
    if (fromDate && item.date < fromDate) return false;
    if (toDate && item.date > toDate) return false;
    if (uavId && !String(item.uavId || "").toLowerCase().includes(uavId)) return false;
    if (pilot && !String(item.pilot || "").toLowerCase().includes(pilot)) return false;
    if (flightResult && item.flightResult !== flightResult) return false;
    if (incident === "true" && !item.incident) return false;
    if (incident === "false" && item.incident) return false;
    return true;
  });
}

function escapeCsvValue(value) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function toCsv(rows) {
  const headers = [
    "Flight ID",
    "Ngày",
    "UAV ID",
    "Pilot",
    "Payload (kg)",
    "Takeoff time",
    "Landing time",
    "Flight time (min)",
    "Distance (km)",
    "Pin trước (%)",
    "Pin sau (%)",
    "GNSS",
    "Link",
    "Flight result",
    "Landing accuracy (m)",
    "Có sự cố",
    "Mô tả sự cố",
    "Ghi chú",
  ];

  const lines = [headers.join(",")];
  rows.forEach((f) => {
    const line = [
      f.flightId,
      f.date,
      f.uavId,
      f.pilot,
      f.payloadKg,
      f.takeoffTime,
      f.landingTime,
      f.flightTimeMin,
      f.distanceKm,
      f.batteryBefore,
      f.batteryAfter,
      f.gnss,
      f.link,
      f.flightResult,
      f.landingAccuracy,
      f.incident ? "Có" : "Không",
      f.incidentDescription || "",
      f.notes,
    ]
      .map(escapeCsvValue)
      .join(",");
    lines.push(line);
  });
  return lines.join("\n");
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập." });
  }
  const token = header.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
}

function roleRequired(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này." });
    }
    return next();
  };
}

app.get("/api/health", (_, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find((item) => item.username === username && item.password === password);
  if (!user) {
    return res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu." });
  }
  const token = jwt.sign(
    { sub: user.username, role: user.role, name: user.name, username: user.username },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
  return res.json({
    token,
    user: { username: user.username, role: user.role, name: user.name },
  });
});

app.get("/api/flights", authRequired, (req, res) => {
  const flights = readFlights();
  const filtered = applyFilters(flights, req.query).sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json(filtered);
});

app.post("/api/flights", authRequired, roleRequired(["admin", "dispatcher"]), (req, res) => {
  const body = req.body || {};
  const required = ["flightId", "date", "uavId", "pilot", "takeoffTime", "landingTime", "flightResult"];
  const missing = required.find((field) => !body[field]);

  if (missing) {
    return res.status(400).json({ message: `Thiếu trường bắt buộc: ${missing}` });
  }

  const flight = {
    id: crypto.randomUUID(),
    flightId: String(body.flightId).trim(),
    date: body.date,
    uavId: String(body.uavId).trim(),
    pilot: String(body.pilot).trim(),
    payloadKg: toNumber(body.payloadKg),
    takeoffTime: body.takeoffTime,
    landingTime: body.landingTime,
    flightTimeMin: getFlightTimeMin(body.takeoffTime, body.landingTime),
    distanceKm: toNumber(body.distanceKm),
    batteryBefore: toNumber(body.batteryBefore),
    batteryAfter: toNumber(body.batteryAfter),
    gnss: body.gnss || "",
    link: body.link || "",
    flightResult: body.flightResult,
    landingAccuracy: toNumber(body.landingAccuracy),
    incident: Boolean(body.incident),
    incidentDescription: body.incident ? String(body.incidentDescription || "").trim() : "",
    notes: body.notes ? String(body.notes).trim() : "",
    createdAt: new Date().toISOString(),
  };

  const flights = readFlights();
  flights.push(flight);
  saveFlights(flights);
  return res.status(201).json(flight);
});

app.put("/api/flights/:id", authRequired, roleRequired(["admin", "dispatcher"]), (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const required = ["flightId", "date", "uavId", "pilot", "takeoffTime", "landingTime", "flightResult"];
  const missing = required.find((field) => !body[field]);
  if (missing) {
    return res.status(400).json({ message: `Thiếu trường bắt buộc: ${missing}` });
  }

  const flights = readFlights();
  const index = flights.findIndex((f) => f.id === id);
  if (index === -1) return res.status(404).json({ message: "Không tìm thấy chuyến bay." });

  const updated = {
    ...flights[index],
    flightId: String(body.flightId).trim(),
    date: body.date,
    uavId: String(body.uavId).trim(),
    pilot: String(body.pilot).trim(),
    payloadKg: toNumber(body.payloadKg),
    takeoffTime: body.takeoffTime,
    landingTime: body.landingTime,
    flightTimeMin: getFlightTimeMin(body.takeoffTime, body.landingTime),
    distanceKm: toNumber(body.distanceKm),
    batteryBefore: toNumber(body.batteryBefore),
    batteryAfter: toNumber(body.batteryAfter),
    gnss: body.gnss || "",
    link: body.link || "",
    flightResult: body.flightResult,
    landingAccuracy: toNumber(body.landingAccuracy),
    incident: Boolean(body.incident),
    incidentDescription: body.incident ? String(body.incidentDescription || "").trim() : "",
    notes: body.notes ? String(body.notes).trim() : "",
    updatedAt: new Date().toISOString(),
  };

  flights[index] = updated;
  saveFlights(flights);
  return res.json(updated);
});

app.delete("/api/flights/:id", authRequired, roleRequired(["admin"]), (req, res) => {
  const { id } = req.params;
  const flights = readFlights();
  const filtered = flights.filter((f) => f.id !== id);
  if (filtered.length === flights.length) {
    return res.status(404).json({ message: "Không tìm thấy chuyến bay." });
  }
  saveFlights(filtered);
  return res.status(204).send();
});

app.delete("/api/flights", authRequired, roleRequired(["admin"]), (_, res) => {
  saveFlights([]);
  res.status(204).send();
});

app.get("/api/kpis", authRequired, (req, res) => {
  const flights = applyFilters(readFlights(), req.query);
  const totalFlights = flights.length;
  const successFlights = flights.filter((f) => f.flightResult === "Success").length;
  const incidentFlights = flights.filter((f) => f.incident).length;
  const totalDistance = flights.reduce((sum, f) => sum + toNumber(f.distanceKm), 0);
  const validAccuracy = flights.filter((f) => toNumber(f.landingAccuracy) > 0);
  const avgLandingAccuracy = validAccuracy.length
    ? validAccuracy.reduce((sum, f) => sum + toNumber(f.landingAccuracy), 0) / validAccuracy.length
    : 0;

  res.json({
    totalFlights,
    successRate: totalFlights ? (successFlights / totalFlights) * 100 : 0,
    totalDistance,
    incidentRate: totalFlights ? (incidentFlights / totalFlights) * 100 : 0,
    avgLandingAccuracy,
  });
});

app.get("/api/export.csv", authRequired, (req, res) => {
  const flights = applyFilters(readFlights(), req.query).sort((a, b) => (a.date < b.date ? 1 : -1));
  const csv = toCsv(flights);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=flight-logs.csv");
  res.send(csv);
});

app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});
