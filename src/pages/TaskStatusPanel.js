import React, { useEffect, useState } from "react";
import "../styles/TaskStatusPanel.css";
import { FaUserTie, FaUsers } from "react-icons/fa6";
import {
    FiClock,
    FiRefreshCw,
    FiCheckCircle,
    FiWatch,
    FiPauseCircle,
    FiDownload,
    FiCalendar,
} from "react-icons/fi";
import { GoTasklist } from "react-icons/go";
import { HiUserGroup } from "react-icons/hi2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/*  Install once:  npm install jspdf jspdf-autotable  */

/* ── API endpoints ──────────────────────────────────────────────── */
const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const TASK_API = "https://storekkb.mpdatahub.com/api";

const DAILY_API = `${TASK_API}/task-List-ByTeam`;            // ?team_id=
const MONTHLY_API = `${TASK_API}/task-List-ByTeam-month`;    // ?team_id=&month=&year=

/* Send the login token (harmless if the API doesn't need it) */
const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

/* ── Lookup tables ──────────────────────────────────────────────── */
const STATUS_META = {
    todo: { label: "To Do", icon: <FiClock />, cls: "tsp-status-todo" },
    pending: { label: "Pending", icon: <FiWatch />, cls: "tsp-status-pending" },
    "in-progress": { label: "In Progress", icon: <FiRefreshCw />, cls: "tsp-status-in_progress" },
    completed: { label: "Completed", icon: <FiCheckCircle />, cls: "tsp-status-completed" },
    hold: { label: "Hold", icon: <FiPauseCircle />, cls: "tsp-status-hold" },
    not_completed: { label: "Not Completed", icon: <FiPauseCircle />, cls: "tsp-status-not_completed" },
};

const PRIORITY_META = {
    very_low: { label: "Very Low", cls: "tsp-priority-very-low", dot: "tsp-dot-very-low" },
    low: { label: "Low", cls: "tsp-priority-low", dot: "tsp-dot-low" },
    medium: { label: "Medium", cls: "tsp-priority-medium", dot: "tsp-dot-medium" },
    high: { label: "High", cls: "tsp-priority-high", dot: "tsp-dot-high" },
    very_high: { label: "Very High", cls: "tsp-priority-very-high", dot: "tsp-dot-very-high" },
};

const AVATAR_PALETTE = ["tsp-av-0", "tsp-av-1", "tsp-av-2", "tsp-av-3", "tsp-av-4", "tsp-av-5"];

const MONTH_OPTIONS = [
    { label: "January", value: "1" },
    { label: "February", value: "2" },
    { label: "March", value: "3" },
    { label: "April", value: "4" },
    { label: "May", value: "5" },
    { label: "June", value: "6" },
    { label: "July", value: "7" },
    { label: "August", value: "8" },
    { label: "September", value: "9" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
];

/* ── Helpers ─────────────────────────────────────────────────────── */
function fmtTime(t) { return t ? t.substring(0, 5) : null; }
function fmtDate(d) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });
}
function initials(name) {
    return name ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";
}
function avatarCls(name) {
    return AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];
}

/* Build a summary from the task arrays when the API doesn't send one */
function buildSummary(tasks) {
    const count = (s) => tasks.filter(t => t.status === s).length;
    return {
        total_tasks: tasks.length,
        completed: count("completed"),
        in_progress: count("in-progress"),
        pending: count("pending"),
        hold: count("hold"),
    };
}

/* Normalise either API response into { summary, tl_tasks, tm_tasks, other_tasks } */
function normalizeResponse(json) {
    const tl = Array.isArray(json.tl_tasks) ? json.tl_tasks : [];
    const tm = Array.isArray(json.tm_tasks) ? json.tm_tasks : [];

    // Fallback: the monthly API may return one flat list in `data`
    const other =
        tl.length === 0 && tm.length === 0 && Array.isArray(json.data) ? json.data : [];

    const all = [...tl, ...tm, ...other];

    return {
        summary: json.summary && Object.keys(json.summary).length ? json.summary : buildSummary(all),
        tl_tasks: tl,
        tm_tasks: tm,
        other_tasks: other,
    };
}

/* ── PDF export ──────────────────────────────────────────────────── */
function exportPdf({ teamName, periodLabel, summary, sections }) {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // Title block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("Task Status Report", 40, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Team: ${teamName || "-"}`, 40, 58);
    doc.text(`Period: ${periodLabel}`, 40, 72);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, pageW - 40, 58, { align: "right" });

    // Summary line
    doc.setTextColor(30, 64, 175);
    doc.setFont("helvetica", "bold");
    doc.text(
        `Total: ${summary.total_tasks ?? 0}   Completed: ${summary.completed ?? 0}   In Progress: ${summary.in_progress ?? 0}   Pending: ${summary.pending ?? 0}   On Hold: ${summary.hold ?? 0}`,
        40,
        92
    );

    let startY = 108;

    sections.forEach(({ title, tasks }) => {
        if (!tasks || tasks.length === 0) return;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(`${title} (${tasks.length})`, 40, startY);

        autoTable(doc, {
            startY: startY + 8,
            margin: { left: 40, right: 40 },
            head: [[
                "S.No", "Title", "Description", "Project", "Assigned To", "Assigned By",
                "Status", "Priority", "Date", "Start", "End", "Duration", "Reason",
            ]],
            body: tasks.map((t, i) => [
                i + 1,
                t.title || "-",
                t.description || "-",
                t.project_name || "-",
                t.assigned_to_name || "-",
                t.assigned_by_name || "-",
                (STATUS_META[t.status] || {}).label || t.status || "-",
                (PRIORITY_META[t.priority] || {}).label || t.priority || "-",
                fmtDate(t.task_date) || "-",
                fmtTime(t.start_time) || "-",
                fmtTime(t.end_time) || "-",
                t.duration || "-",
                t.reason || "-",
            ]),
            styles: { fontSize: 7.5, cellPadding: 4, overflow: "linebreak", valign: "top" },
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [248, 250, 253] },
            columnStyles: {
                0: { cellWidth: 28 },
                1: { cellWidth: 70 },
                2: { cellWidth: 120 },
                12: { cellWidth: 90 },
            },
            didDrawPage: () => {
                const n = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(
                    `Page ${n}`,
                    pageW - 40,
                    doc.internal.pageSize.getHeight() - 16,
                    { align: "right" }
                );
            },
        });

        startY = doc.lastAutoTable.finalY + 28;
    });

    const safeTeam = (teamName || "team").replace(/[^a-z0-9]+/gi, "_");
    const safePeriod = periodLabel.replace(/[^a-z0-9]+/gi, "_");
    doc.save(`tasks_${safeTeam}_${safePeriod}.pdf`);
}

/* ── Atoms ───────────────────────────────────────────────────────── */
const Dash = () => <span className="tsp-dash">—</span>;

function StatusPill({ status }) {
    const m = STATUS_META[status] || STATUS_META.todo;
    return (
        <span className={`tsp-status-pill ${m.cls}`}>
            {m.icon} {m.label}
        </span>
    );
}

function PriorityBadge({ priority }) {
    const m = PRIORITY_META[priority] || PRIORITY_META.medium;
    return (
        <span className={`tsp-priority-badge ${m.cls}`}>
            <span className={`tsp-priority-dot ${m.dot}`} />
            {m.label}
        </span>
    );
}

function UserCell({ name }) {
    if (!name) return <Dash />;
    return (
        <span className="tsp-user-cell">
            <span className={`tsp-avatar ${avatarCls(name)}`}>{initials(name)}</span>
            <span className="tsp-user-name">{name}</span>
        </span>
    );
}

/* ── Summary Bar ─────────────────────────────────────────────────── */
function SummaryBar({ s, onFilter, active }) {
    return (
        <div className="tsp-summary-bar">
            <div
                className={`tsp-summary-item tsp-stat-total ${active === "all" ? "active" : ""}`}
                onClick={() => onFilter("all")}
            >
                <span className="tsp-summary-num">{s.total_tasks ?? 0}</span>
                <span className="tsp-summary-lbl">Total Tasks</span>
            </div>

            <div
                className={`tsp-summary-item tsp-stat-completed ${active === "completed" ? "active" : ""}`}
                onClick={() => onFilter("completed")}
            >
                <span className="tsp-summary-num">{s.completed ?? 0}</span>
                <span className="tsp-summary-lbl">Completed</span>
            </div>

            <div
                className={`tsp-summary-item tsp-stat-inprogress ${active === "in-progress" ? "active" : ""}`}
                onClick={() => onFilter("in-progress")}
            >
                <span className="tsp-summary-num">{s.in_progress ?? 0}</span>
                <span className="tsp-summary-lbl">In Progress</span>
            </div>

            <div
                className={`tsp-summary-item tsp-stat-pending ${active === "pending" ? "active" : ""}`}
                onClick={() => onFilter("pending")}
            >
                <span className="tsp-summary-num">{s.pending ?? 0}</span>
                <span className="tsp-summary-lbl">Pending</span>
            </div>

            <div
                className={`tsp-summary-item tsp-stat-hold ${active === "hold" ? "active" : ""}`}
                onClick={() => onFilter("hold")}
            >
                <span className="tsp-summary-num">{s.hold ?? 0}</span>
                <span className="tsp-summary-lbl">On Hold</span>
            </div>
        </div>
    );
}

/* ── Table ───────────────────────────────────────────────────────── */
function TaskTable({ tasks }) {
    if (!tasks || tasks.length === 0) {
        return <div className="tsp-empty-table">No tasks in this section.</div>;
    }

    return (
        <div className="tsp-table-wrap">
            <table className="tsp-table">
                <thead>
                    <tr>
                        <th>S.No</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Project</th>
                        <th>Assigned To</th>
                        <th>Assigned By</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Date</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Duration</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map((task, idx) => (
                        <tr key={task.id ?? idx}>
                            <td className="tsp-col-id">{idx + 1}</td>
                            <td className="tsp-col-title">{task.title || <Dash />}</td>
                            <td className="tsp-col-desc">{task.description || <Dash />}</td>
                            <td className="tsp-col-project">
                                <span className="tsp-project-tag">{task.project_name || <Dash />}</span>
                            </td>
                            <td className="tsp-col-user"><UserCell name={task.assigned_to_name} /></td>
                            <td className="tsp-col-user"><UserCell name={task.assigned_by_name} /></td>
                            <td className="tsp-col-status"><StatusPill status={task.status} /></td>
                            <td className="tsp-col-priority"><PriorityBadge priority={task.priority} /></td>
                            <td className="tsp-col-date">{fmtDate(task.task_date) || <Dash />}</td>
                            <td className="tsp-col-time">{fmtTime(task.start_time) || <Dash />}</td>
                            <td className="tsp-col-time">{fmtTime(task.end_time) || <Dash />}</td>
                            <td className="tsp-col-duration">
                                {task.duration
                                    ? <span className="tsp-duration-badge">{task.duration}</span>
                                    : <Dash />}
                            </td>
                            <td className="tsp-col-reason">{task.reason || <Dash />}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ── Section (TL / TM / Other) ───────────────────────────────────── */
function SectionBlock({ icon, title, headerCls, badgeCls, tasks }) {
    return (
        <div className="tsp-section">
            <div className={`tsp-section-header ${headerCls}`}>
                <span className="tsp-section-icon">{icon}</span>
                <span className="tsp-section-title">{title}</span>
                <span className={`tsp-section-badge ${badgeCls}`}>{tasks?.length ?? 0}</span>
            </div>
            <TaskTable tasks={tasks} />
        </div>
    );
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function TaskStatusPanel() {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1);
    const currentYear = now.getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState("");
    const [taskData, setTaskData] = useState(null);
    const [teamsLoading, setTeamsLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [error, setError] = useState(null);

    const [statusFilter, setStatusFilter] = useState("all");

    // "daily" (default) or "monthly"
    const [viewMode, setViewMode] = useState("daily");
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);

    const filterTasks = (tasks) => {
        if (!statusFilter || statusFilter === "all") return tasks;
        return tasks?.filter(t => t.status === statusFilter);
    };

    /* Fetch team list on mount */
    useEffect(() => {
        const load = async () => {
            setTeamsLoading(true);
            try {
                const res = await fetch(`${BASE_URL}/teams/team-list`, { headers: authHeaders() });
                const json = await res.json();
                if (json.success) setTeams(json.data);
            } catch (err) { console.error("Teams fetch error:", err); }
            setTeamsLoading(false);
        };
        load();
    }, []);

    /* Fetch tasks when team / mode / month / year changes */
    useEffect(() => {
        if (!selectedTeam) { setTaskData(null); return; }

        let cancelled = false;
        setStatusFilter("all");

        const load = async () => {
            setTasksLoading(true);
            setError(null);
            try {
                const url =
                    viewMode === "monthly"
                        ? `${MONTHLY_API}?team_id=${selectedTeam}&month=${month}&year=${year}`
                        : `${DAILY_API}?team_id=${selectedTeam}`;

                const res = await fetch(url, { headers: authHeaders() });
                const json = await res.json();

                if (cancelled) return;

                if (json.success) {
                    setTaskData(normalizeResponse(json));
                } else {
                    setTaskData(null);
                    setError(json.message || "Failed to load tasks.");
                }
            } catch (err) {
                if (cancelled) return;
                console.error("Tasks fetch error:", err);
                setTaskData(null);
                setError("Network error. Please try again.");
            }
            if (!cancelled) setTasksLoading(false);
        };
        load();

        return () => { cancelled = true; };
    }, [selectedTeam, viewMode, month, year]);

    /* Derived: the rows currently shown (after status filter) */
    const tlShown = filterTasks(taskData?.tl_tasks) || [];
    const tmShown = filterTasks(taskData?.tm_tasks) || [];
    const otherShown = filterTasks(taskData?.other_tasks) || [];
    const totalShown = tlShown.length + tmShown.length + otherShown.length;

    const periodLabel =
        viewMode === "monthly"
            ? `${MONTH_OPTIONS.find(m => m.value === String(month))?.label} ${year}`
            : `Daily - ${now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;

    const handleDownloadPdf = () => {
        if (!taskData || totalShown === 0) return;

        const teamName = teams.find(t => String(t.id) === String(selectedTeam))?.name;

        exportPdf({
            teamName,
            periodLabel,
            summary: taskData.summary || {},
            sections: [
                { title: "Team Lead Tasks", tasks: tlShown },
                { title: "Team Member Tasks", tasks: tmShown },
                { title: "Tasks", tasks: otherShown },
            ],
        });
    };

    return (
        <div className="tsp-page">
            <div className="tsp-inner">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="tsp-header">
                    <div className="tsp-header-glow" />

                    <div className="tsp-header-inner">
                        {/* Brand */}
                        <div className="tsp-header-brand">
                            <div className="tsp-header-logo"><GoTasklist /></div>
                            <div>
                                <h1 className="tsp-header-title">Task Status Panel</h1>
                                <p className="tsp-header-subtitle">
                                    {viewMode === "monthly"
                                        ? `Monthly report · ${periodLabel}`
                                        : "Daily task progress at a glance"}
                                </p>
                            </div>
                        </div>

                        {/* Right: selector + stat */}
                        <div className="tsp-header-right">
                            <div className="tsp-team-field">
                                <label className="tsp-team-label" htmlFor="tsp-team-select">
                                    Select Team <span className="tsp-required">*</span>
                                </label>
                                <div className="tsp-select-wrap">
                                    <select
                                        id="tsp-team-select"
                                        className="tsp-select"
                                        value={selectedTeam}
                                        onChange={e => setSelectedTeam(e.target.value)}
                                        disabled={teamsLoading}
                                    >
                                        <option value="">
                                            {teamsLoading ? "Loading teams…" : "— Choose a team —"}
                                        </option>
                                        {teams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <span className="tsp-select-arrow">▾</span>
                                </div>
                            </div>

                            <div className="tsp-header-stat">
                                <span className="tsp-header-stat-num">
                                    {taskData?.summary?.total_tasks ?? "—"}
                                </span>
                                <span className="tsp-header-stat-lbl">Total Tasks</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Toolbar: Daily / Monthly + month/year + PDF ─────── */}
                {selectedTeam && (
                    <div className="tsp-toolbar">
                        <div className="tsp-mode-toggle">
                            <button
                                type="button"
                                className={`tsp-mode-btn ${viewMode === "daily" ? "tsp-mode-btn--active" : ""}`}
                                onClick={() => setViewMode("daily")}
                            >
                                <FiClock /> Daily
                            </button>
                            <button
                                type="button"
                                className={`tsp-mode-btn ${viewMode === "monthly" ? "tsp-mode-btn--active" : ""}`}
                                onClick={() => setViewMode("monthly")}
                            >
                                <FiCalendar /> Monthly
                            </button>
                        </div>

                        {viewMode === "monthly" && (
                            <div className="tsp-month-filters">
                                <select
                                    className="tsp-mini-select"
                                    value={month}
                                    onChange={e => setMonth(e.target.value)}
                                >
                                    {MONTH_OPTIONS.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                                <select
                                    className="tsp-mini-select"
                                    value={year}
                                    onChange={e => setYear(e.target.value)}
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button
                            type="button"
                            className="tsp-pdf-btn"
                            onClick={handleDownloadPdf}
                            disabled={tasksLoading || !taskData || totalShown === 0}
                            title="Download the tasks shown below as a PDF"
                        >
                            <FiDownload /> Download PDF
                        </button>
                    </div>
                )}

                {/* ── No team chosen ─────────────────────────────────── */}
                {!selectedTeam && (
                    <div className="tsp-empty-page">
                        <div className="tsp-empty-icon"><HiUserGroup /></div>
                        <h3>Select a team to view tasks</h3>
                        <p>Choose a team from the dropdown above to see the task status table.</p>
                    </div>
                )}

                {/* ── Loading ────────────────────────────────────────── */}
                {selectedTeam && tasksLoading && (
                    <div className="tsp-loading">
                        <FiRefreshCw className="tsp-loading-icon" />
                        Loading tasks…
                    </div>
                )}

                {/* ── Error ──────────────────────────────────────────── */}
                {selectedTeam && !tasksLoading && error && (
                    <div className="tsp-error">{error}</div>
                )}

                {/* ── Content ────────────────────────────────────────── */}
                {selectedTeam && !tasksLoading && taskData && (
                    <>
                        <SummaryBar
                            s={taskData.summary || {}}
                            onFilter={(status) => setStatusFilter(status)}
                            active={statusFilter}
                        />

                        {/* Team Lead tasks */}
                        <SectionBlock
                            icon={<FaUserTie />}
                            title="Team Lead Tasks"
                            headerCls="tsp-section-header-tl"
                            badgeCls="tsp-section-badge-tl"
                            tasks={tlShown}
                        />

                        {/* Team Member tasks */}
                        <SectionBlock
                            icon={<FaUsers />}
                            title="Team Member Tasks"
                            headerCls="tsp-section-header-tm"
                            badgeCls="tsp-section-badge-tm"
                            tasks={tmShown}
                        />

                        {/* Flat list fallback (only if the monthly API returns `data`) */}
                        {taskData.other_tasks.length > 0 && (
                            <SectionBlock
                                icon={<GoTasklist />}
                                title="All Tasks"
                                headerCls="tsp-section-header-tl"
                                badgeCls="tsp-section-badge-tl"
                                tasks={otherShown}
                            />
                        )}
                    </>
                )}

            </div>
        </div>
    );
}