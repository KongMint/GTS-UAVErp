import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
const AUTH_KEY = "uav_auth_v1";
const LANG_KEY = "uav_lang_v1";

const I18N = {
  vi: {
    sessionExpired: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    cannotLoadServerData: "Không thể tải dữ liệu từ máy chủ.",
    genericError: "Đã xảy ra lỗi.",
    loginFailed: "Đăng nhập thất bại.",
    cannotSaveFlight: "Không thể lưu chuyến bay.",
    confirmDeleteAll: "Bạn chắc chắn muốn xóa tất cả dữ liệu?",
    cannotDeleteData: "Không thể xóa dữ liệu.",
    confirmDeleteRecord: "Bạn chắc chắn muốn xóa bản ghi này?",
    cannotDeleteRecord: "Không thể xóa bản ghi.",
    cannotExportCsv: "Không thể xuất CSV.",
    loginTitle: "Đăng nhập UAV ERP",
    sampleAccounts:
      "Tài khoản mẫu: admin/admin123, dispatcher/dispatcher123, viewer/viewer123",
    username: "Tên đăng nhập",
    password: "Mật khẩu",
    login: "Đăng nhập",
    dashboardTitle: "UAV ERP Dashboard",
    dashboardSubtitle: "Theo dõi tuyến giao hàng và nhật ký chuyến bay",
    logout: "Đăng xuất",
    filterTitle: "Bộ lọc",
    fromDate: "Từ ngày",
    toDate: "Đến ngày",
    all: "Tất cả",
    incident: "Có sự cố",
    incidentDescription: "Mô tả sự cố",
    resetFilter: "Xóa bộ lọc",
    exportCsv: "Xuất CSV",
    kpiTitle: "KPI",
    totalFlights: "Tổng chuyến",
    successRate: "Tỉ lệ thành công",
    totalDistance: "Tổng quãng đường (km)",
    incidentRate: "Tỉ lệ có sự cố",
    avgLandingAccuracy: "Hạ cánh chính xác TB (m)",
    formTitle: "Nhập chuyến bay",
    date: "Ngày",
    batteryBefore: "Pin trước (%)",
    batteryAfter: "Pin sau (%)",
    choose: "-- Chọn --",
    notes: "Ghi chú",
    saveFlight: "Lưu chuyến bay",
    updateFlight: "Cập nhật chuyến bay",
    clearForm: "Hủy / Xóa form",
    listTitle: "Danh sách chuyến bay",
    deleteAllData: "Xóa tất cả dữ liệu",
    loadingData: "Đang tải dữ liệu...",
    noData: "Chưa có dữ liệu.",
    takeoff: "Cất cánh",
    landing: "Hạ cánh",
    flightTime: "Thời gian bay",
    distance: "Khoảng cách",
    result: "Kết quả",
    landingAccuracy: "Độ chính xác hạ cánh",
    action: "Thao tác",
    edit: "Sửa",
    delete: "Xóa",
    reportedBy: "Người báo cáo",
    yes: "Có",
    no: "Không",
  },
  en: {
    sessionExpired: "Your session has expired. Please sign in again.",
    cannotLoadServerData: "Cannot load data from server.",
    genericError: "Something went wrong.",
    loginFailed: "Login failed.",
    cannotSaveFlight: "Cannot save flight log.",
    confirmDeleteAll: "Are you sure you want to delete all data?",
    cannotDeleteData: "Cannot delete data.",
    confirmDeleteRecord: "Are you sure you want to delete this record?",
    cannotDeleteRecord: "Cannot delete record.",
    cannotExportCsv: "Cannot export CSV.",
    loginTitle: "UAV ERP Login",
    sampleAccounts:
      "Sample accounts: admin/admin123, dispatcher/dispatcher123, viewer/viewer123",
    username: "Username",
    password: "Password",
    login: "Login",
    dashboardTitle: "UAV ERP Dashboard",
    dashboardSubtitle: "Track delivery routes and flight logs",
    logout: "Logout",
    filterTitle: "Filters",
    fromDate: "From date",
    toDate: "To date",
    all: "All",
    incident: "Incident",
    incidentDescription: "Incident description",
    resetFilter: "Reset filters",
    exportCsv: "Export CSV",
    kpiTitle: "KPI",
    totalFlights: "Total flights",
    successRate: "Success rate",
    totalDistance: "Total distance (km)",
    incidentRate: "Incident rate",
    avgLandingAccuracy: "Avg landing accuracy (m)",
    formTitle: "Flight form",
    date: "Date",
    batteryBefore: "Battery before (%)",
    batteryAfter: "Battery after (%)",
    choose: "-- Select --",
    notes: "Notes",
    saveFlight: "Save flight",
    updateFlight: "Update flight",
    clearForm: "Clear form",
    listTitle: "Flight list",
    deleteAllData: "Delete all data",
    loadingData: "Loading data...",
    noData: "No data yet.",
    takeoff: "Takeoff",
    landing: "Landing",
    flightTime: "Flight time",
    distance: "Distance",
    result: "Result",
    landingAccuracy: "Landing accuracy",
    action: "Actions",
    edit: "Edit",
    delete: "Delete",
    reportedBy: "Reported by",
    yes: "Yes",
    no: "No",
  },
};

const initialForm = {
  reportedBy: "",
  flightId: "",
  date: "",
  uavId: "",
  pilot: "",
  payloadKg: "",
  takeoffTime: "",
  landingTime: "",
  distanceKm: "",
  batteryBefore: "",
  batteryAfter: "",
  gnss: "",
  link: "",
  flightResult: "",
  landingAccuracy: "",
  incident: false,
  incidentDescription: "",
  notes: "",
};

const initialFilters = {
  fromDate: "",
  toDate: "",
  uavId: "",
  pilot: "",
  flightResult: "",
  incident: "",
};

function App() {
  const [lang, setLang] = useState(
    () => localStorage.getItem(LANG_KEY) || "vi",
  );
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  });
  const [loginForm, setLoginForm] = useState({
    username: "admin",
    password: "admin123",
  });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [flights, setFlights] = useState([]);
  const [kpis, setKpis] = useState({
    totalFlights: 0,
    successRate: 0,
    totalDistance: 0,
    incidentRate: 0,
    avgLandingAccuracy: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canWrite =
    auth?.user?.role === "admin" || auth?.user?.role === "dispatcher";
  const canDelete = auth?.user?.role === "admin";
  const t = (key) => I18N[lang]?.[key] || I18N.vi[key] || key;

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "") params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      },
    });
    return response;
  }

  async function loadData() {
    if (!auth?.token) return;
    try {
      setLoading(true);
      setError("");
      const [flightsRes, kpisRes] = await Promise.all([
        apiFetch(`/flights?${queryString}`),
        apiFetch(`/kpis?${queryString}`),
      ]);
      if (!flightsRes.ok || !kpisRes.ok) {
        if (flightsRes.status === 401 || kpisRes.status === 401) {
          doLogout();
          throw new Error(t("sessionExpired"));
        }
        throw new Error(t("cannotLoadServerData"));
      }
      const flightsData = await flightsRes.json();
      const kpisData = await kpisRes.json();
      setFlights(flightsData);
      setKpis(kpisData);
    } catch (err) {
      setError(err.message || t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [queryString, auth?.token, lang]);

  // Prefill "reportedBy" từ người đang đăng nhập.
  // Khi user xóa/clear form thì field này sẽ được tự điền lại nếu đang rỗng.
  useEffect(() => {
    if (!auth?.user?.name) return;
    setForm((prev) =>
      prev.reportedBy ? prev : { ...prev, reportedBy: auth.user.name },
    );
  }, [auth?.user?.name]);

  function persistAuth(value) {
    if (value) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
    setAuth(value);
  }

  function changeLanguage(nextLang) {
    setLang(nextLang);
    localStorage.setItem(LANG_KEY, nextLang);
    setLangMenuOpen(false);
  }

  function LanguageSwitcher() {
    return (
      <div className="lang-switcher">
        <button
          type="button"
          className="secondary globe-btn"
          onClick={() => setLangMenuOpen((prev) => !prev)}
          aria-label="Language menu"
          title="Language"
        >
          🌐
        </button>
        {langMenuOpen && (
          <div className="lang-menu">
            <button
              type="button"
              className={`lang-option ${lang === "vi" ? "active" : ""}`}
              onClick={() => changeLanguage("vi")}
            >
              Tiếng Việt
            </button>
            <button
              type="button"
              className={`lang-option ${lang === "en" ? "active" : ""}`}
              onClick={() => changeLanguage("en")}
            >
              English
            </button>
          </div>
        )}
      </div>
    );
  }

  async function doLogin(event) {
    event.preventDefault();
    try {
      setError("");
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t("loginFailed"));
      persistAuth(data);
    } catch (err) {
      setError(err.message || t("genericError"));
    }
  }

  function doLogout() {
    persistAuth(null);
    setFlights([]);
    setKpis({
      totalFlights: 0,
      successRate: 0,
      totalDistance: 0,
      incidentRate: 0,
      avgLandingAccuracy: 0,
    });
    setForm(initialForm);
    setEditingId("");
  }

  function onFormChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => {
      const nextValue = type === "checkbox" ? checked : value;
      const nextForm = { ...prev, [name]: nextValue };
      if (name === "incident" && !checked) {
        nextForm.incidentDescription = "";
      }
      return nextForm;
    });
  }

  function onFilterChange(event) {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      const response = await apiFetch(
        editingId ? `/flights/${editingId}` : "/flights",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(form),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("cannotSaveFlight"));
      }
      setForm(initialForm);
      setEditingId("");
      await loadData();
    } catch (err) {
      setError(err.message || t("genericError"));
    }
  }

  async function clearAll() {
    if (!window.confirm(t("confirmDeleteAll"))) return;
    try {
      setError("");
      const response = await apiFetch("/flights", { method: "DELETE" });
      if (!response.ok) throw new Error(t("cannotDeleteData"));
      await loadData();
    } catch (err) {
      setError(err.message || t("genericError"));
    }
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  async function deleteOne(id) {
    if (!window.confirm(t("confirmDeleteRecord"))) return;
    try {
      setError("");
      const response = await apiFetch(`/flights/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t("cannotDeleteRecord"));
      }
      await loadData();
    } catch (err) {
      setError(err.message || t("genericError"));
    }
  }

  function editFlight(flight) {
    setEditingId(flight.id);
    setForm({
      reportedBy:
        flight.reportedBy || auth?.user?.name || auth?.user?.username || "",
      flightId: flight.flightId,
      date: flight.date,
      uavId: flight.uavId,
      pilot: flight.pilot,
      payloadKg: String(flight.payloadKg ?? ""),
      takeoffTime: flight.takeoffTime,
      landingTime: flight.landingTime,
      distanceKm: String(flight.distanceKm ?? ""),
      batteryBefore: String(flight.batteryBefore ?? ""),
      batteryAfter: String(flight.batteryAfter ?? ""),
      gnss: flight.gnss || "",
      link: flight.link || "",
      flightResult: flight.flightResult || "",
      landingAccuracy: String(flight.landingAccuracy ?? ""),
      incident: Boolean(flight.incident),
      incidentDescription: flight.incidentDescription || "",
      notes: flight.notes || "",
    });
  }

  async function exportCsv() {
    try {
      setError("");
      const response = await apiFetch(`/export.csv?${queryString}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (!response.ok) throw new Error(t("cannotExportCsv"));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "flight-logs.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || t("genericError"));
    }
  }

  if (!auth?.token) {
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={doLogin}>
          <h2>{t("loginTitle")}</h2>
          <p>{t("sampleAccounts")}</p>
          <div className="actions">
            <LanguageSwitcher />
          </div>
          <label>
            {t("username")}
            <input
              name="username"
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm((p) => ({ ...p, username: e.target.value }))
              }
            />
          </label>
          <label>
            {t("password")}
            <input
              type="password"
              name="password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm((p) => ({ ...p, password: e.target.value }))
              }
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit">{t("login")}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="header">
        <h1>{t("dashboardTitle")}</h1>
        <p>{t("dashboardSubtitle")}</p>
        <div className="user-bar">
          <span>
            {auth.user.name} ({auth.user.role})
          </span>
          <LanguageSwitcher />
          <button type="button" className="secondary" onClick={doLogout}>
            {t("logout")}
          </button>
        </div>
      </header>

      <main className="container">
        <section className="card">
          <h2>{t("filterTitle")}</h2>
          <div className="grid filters">
            <label>
              {t("fromDate")}
              <input
                type="date"
                name="fromDate"
                value={filters.fromDate}
                onChange={onFilterChange}
              />
            </label>
            <label>
              {t("toDate")}
              <input
                type="date"
                name="toDate"
                value={filters.toDate}
                onChange={onFilterChange}
              />
            </label>
            <label>
              UAV ID
              <input
                type="text"
                name="uavId"
                value={filters.uavId}
                onChange={onFilterChange}
              />
            </label>
            <label>
              Pilot
              <input
                type="text"
                name="pilot"
                value={filters.pilot}
                onChange={onFilterChange}
              />
            </label>
            <label>
              Flight result
              <select
                name="flightResult"
                value={filters.flightResult}
                onChange={onFilterChange}
              >
                <option value="">{t("all")}</option>
                <option value="Success">Success</option>
                <option value="Partial">Partial</option>
                <option value="Failed">Failed</option>
              </select>
            </label>
            <label>
              {t("incident")}
              <select
                name="incident"
                value={filters.incident}
                onChange={onFilterChange}
              >
                <option value="">{t("all")}</option>
                <option value="true">{t("yes")}</option>
                <option value="false">{t("no")}</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <button type="button" className="secondary" onClick={resetFilters}>
              {t("resetFilter")}
            </button>
            <button type="button" onClick={exportCsv}>
              {t("exportCsv")}
            </button>
          </div>
        </section>

        <section className="card">
          <h2>{t("kpiTitle")}</h2>
          <div className="kpis">
            <article>
              <h3>{t("totalFlights")}</h3>
              <p>{kpis.totalFlights}</p>
            </article>
            <article>
              <h3>{t("successRate")}</h3>
              <p>{kpis.successRate.toFixed(1)}%</p>
            </article>
            <article>
              <h3>{t("totalDistance")}</h3>
              <p>{kpis.totalDistance.toFixed(2)}</p>
            </article>
            <article>
              <h3>{t("incidentRate")}</h3>
              <p>{kpis.incidentRate.toFixed(1)}%</p>
            </article>
            <article>
              <h3>{t("avgLandingAccuracy")}</h3>
              <p>{kpis.avgLandingAccuracy.toFixed(2)}</p>
            </article>
          </div>
        </section>

        {canWrite && (
          <section className="card">
            <h2>{t("formTitle")}</h2>
            <form className="grid form" onSubmit={onSubmit}>
              <label>
                {t("reportedBy")}
                <input
                  required
                  name="reportedBy"
                  value={form.reportedBy}
                  onChange={onFormChange}
                  placeholder={auth?.user?.name || ""}
                />
              </label>
              <label>
                Flight ID
                <input
                  required
                  name="flightId"
                  value={form.flightId}
                  onChange={onFormChange}
                />
              </label>
              <label>
                {t("date")}
                <input
                  required
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={onFormChange}
                />
              </label>
              <label>
                UAV ID
                <input
                  required
                  name="uavId"
                  value={form.uavId}
                  onChange={onFormChange}
                />
              </label>
              <label>
                Pilot
                <input
                  required
                  name="pilot"
                  value={form.pilot}
                  onChange={onFormChange}
                />
              </label>
              <label>
                Payload (kg)
                <input
                  type="number"
                  step="0.01"
                  name="payloadKg"
                  value={form.payloadKg}
                  onChange={onFormChange}
                />
              </label>
              <label>
                Takeoff time
                <input
                  required
                  type="time"
                  name="takeoffTime"
                  value={form.takeoffTime}
                  onChange={onFormChange}
                />
              </label>
              <label>
                Landing time
                <input
                  required
                  type="time"
                  name="landingTime"
                  value={form.landingTime}
                  onChange={onFormChange}
                />
              </label>
              <label>
                Distance (km)
                <input
                  type="number"
                  step="0.01"
                  name="distanceKm"
                  value={form.distanceKm}
                  onChange={onFormChange}
                />
              </label>
              <label>
                {t("batteryBefore")}
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="batteryBefore"
                  value={form.batteryBefore}
                  onChange={onFormChange}
                />
              </label>
              <label>
                {t("batteryAfter")}
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="batteryAfter"
                  value={form.batteryAfter}
                  onChange={onFormChange}
                />
              </label>
              <label>
                GNSS
                <select name="gnss" value={form.gnss} onChange={onFormChange}>
                  <option value="">{t("choose")}</option>
                  <option value="Good">Good</option>
                  <option value="Weak">Weak</option>
                  <option value="Lost">Lost</option>
                </select>
              </label>
              <label>
                Link
                <select name="link" value={form.link} onChange={onFormChange}>
                  <option value="">{t("choose")}</option>
                  <option value="Stable">Stable</option>
                  <option value="Fluctuated">Fluctuated</option>
                  <option value="Lost">Lost</option>
                </select>
              </label>
              <label>
                Flight result
                <select
                  required
                  name="flightResult"
                  value={form.flightResult}
                  onChange={onFormChange}
                >
                  <option value="">{t("choose")}</option>
                  <option value="Success">Success</option>
                  <option value="Partial">Partial</option>
                  <option value="Failed">Failed</option>
                </select>
              </label>
              <label>
                Landing accuracy (m)
                <input
                  type="number"
                  step="0.01"
                  name="landingAccuracy"
                  value={form.landingAccuracy}
                  onChange={onFormChange}
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="incident"
                  checked={form.incident}
                  onChange={onFormChange}
                />
                {t("incident")}
              </label>
              {form.incident && (
                <label className="full">
                  {t("incidentDescription")}
                  <textarea
                    rows="3"
                    name="incidentDescription"
                    value={form.incidentDescription}
                    onChange={onFormChange}
                  />
                </label>
              )}
              <label className="full">
                {t("notes")}
                <textarea
                  rows="3"
                  name="notes"
                  value={form.notes}
                  onChange={onFormChange}
                />
              </label>
              <div className="actions full">
                <button type="submit">
                  {editingId ? t("updateFlight") : t("saveFlight")}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setForm(initialForm);
                    setEditingId("");
                  }}
                >
                  {t("clearForm")}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="card">
          <div className="table-header">
            <h2>{t("listTitle")}</h2>
            {canDelete && (
              <button className="danger" type="button" onClick={clearAll}>
                {t("deleteAllData")}
              </button>
            )}
          </div>
          {error && <p className="error">{error}</p>}
          {loading && <p>{t("loadingData")}</p>}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Flight ID</th>
                  <th>{t("date")}</th>
                  <th>UAV ID</th>
                  <th>Pilot</th>
                  <th>Payload</th>
                  <th>{t("takeoff")}</th>
                  <th>{t("landing")}</th>
                  <th>{t("flightTime")}</th>
                  <th>{t("distance")}</th>
                  <th>{t("batteryBefore")}</th>
                  <th>{t("batteryAfter")}</th>
                  <th>GNSS</th>
                  <th>Link</th>
                  <th>{t("result")}</th>
                  <th>{t("landingAccuracy")}</th>
                  <th>{t("incident")}</th>
                  <th>{t("incidentDescription")}</th>
                  <th>{t("notes")}</th>
                  <th>{t("reportedBy")}</th>
                  <th>{t("action")}</th>
                </tr>
              </thead>
              <tbody>
                {!flights.length && (
                  <tr>
                    <td colSpan="20">{t("noData")}</td>
                  </tr>
                )}
                {flights.map((f) => (
                  <tr key={f.id}>
                    <td>{f.flightId}</td>
                    <td>{f.date}</td>
                    <td>{f.uavId}</td>
                    <td>{f.pilot}</td>
                    <td>{f.payloadKg}</td>
                    <td>{f.takeoffTime}</td>
                    <td>{f.landingTime}</td>
                    <td>{f.flightTimeMin}</td>
                    <td>{f.distanceKm}</td>
                    <td>{f.batteryBefore}</td>
                    <td>{f.batteryAfter}</td>
                    <td>{f.gnss || "-"}</td>
                    <td>{f.link || "-"}</td>
                    <td>{f.flightResult}</td>
                    <td>{f.landingAccuracy}</td>
                    <td>{f.incident ? t("yes") : t("no")}</td>
                    <td>{f.incidentDescription || "-"}</td>
                    <td>{f.notes || "-"}</td>
                    <td>{f.reportedBy || "-"}</td>
                    <td>
                      {canWrite && (
                        <button
                          type="button"
                          className="table-btn"
                          onClick={() => editFlight(f)}
                        >
                          {t("edit")}
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          className="table-btn danger"
                          onClick={() => deleteOne(f.id)}
                        >
                          {t("delete")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
