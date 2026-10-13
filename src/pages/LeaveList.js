import React, { useEffect, useState } from 'react';
import '../styles/LeaveList.css';
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiAlertCircle,
  FiSearch,
  FiPlus,
  FiX,
} from 'react-icons/fi';

const BASE = 'https://storekkb.mpdatahub.com/api';

const COMPANY_API = `${BASE}/list-company`;
const BRANCH_API = `${BASE}/get-branch-for-company?company_id=`;
const EMPLOYEE_API = `${BASE}/employee-list-by-branch?branch_id=`;
const LEAVE_LIST_BASE = `${BASE}/leave-list-branch`;
const UPDATE_STATUS_API = `${BASE}/update-Leave-status`;
const APPLY_LEAVE_API = `${BASE}/apply-leave`;

const STATUS_CONFIG = {
  approved: {
    label: 'Approved',
    icon: <FiCheckCircle />,
    cls: 'status--approved',
  },
  pending: { label: 'Pending', icon: <FiClock />, cls: 'status--pending' },
  rejected: { label: 'Rejected', icon: <FiXCircle />, cls: 'status--rejected' },
};

/* Duration dropdown options */
const DURATION_OPTIONS = [
  { label: 'Half Day (0.5)', value: '0.5' },
  { label: 'Full Day (1)', value: '1' },
];

/* Build headers with the login token */
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const emptyForm = {
  user_id: '',
  leave_date: '',
  reason: '',
  duration: '1',
  half_day: '',
};

export default function LeaveList() {
  const [leaves, setLeaves] = useState([]);
  const [meta, setMeta] = useState({ month: '', total: 0, branch_name: '' });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Company / Branch dropdown state
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // Employees + Apply Leave modal state
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [applying, setApplying] = useState(false);
  const [formError, setFormError] = useState('');

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1);
  const currentYear = now.getFullYear();

  const years = Array.from(
    { length: 11 }, // 5 previous + current + 5 next
    (_, i) => currentYear - 5 + i
  );

  const [dateFilter, setDateFilter] = useState({
    user_id: '',
    month: currentMonth,
    year: currentYear,
  });

  const monthOptions = [
    { label: 'January', value: '1' },
    { label: 'February', value: '2' },
    { label: 'March', value: '3' },
    { label: 'April', value: '4' },
    { label: 'May', value: '5' },
    { label: 'June', value: '6' },
    { label: 'July', value: '7' },
    { label: 'August', value: '8' },
    { label: 'September', value: '9' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
  ];

  const handleDate = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ---------------- INITIAL LOAD: companies ---------------- */

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- FETCH COMPANIES ---------------- */

  const fetchCompanies = async () => {
    try {
      const res = await fetch(COMPANY_API);
      const json = await res.json();

      if (json.success) {
        setCompanies(json.data);

        if (json.data.length > 0) {
          const firstCompany = json.data[0].id;
          setSelectedCompany(firstCompany);
          fetchBranches(firstCompany, true);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  /* ---------------- FETCH BRANCHES FOR A COMPANY ---------------- */

  const fetchBranches = async (companyId, autoSelectFirst = false) => {
    try {
      const res = await fetch(`${BRANCH_API}${companyId}`);
      const json = await res.json();

      if (json.success) {
        setBranches(json.data);

        if (autoSelectFirst && json.data.length > 0) {
          setSelectedBranch(json.data[0].id);
        } else if (json.data.length === 0) {
          setSelectedBranch('');
          setLoading(false);
        }
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  /* ---------------- COMPANY / BRANCH HANDLERS ---------------- */

  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    setSelectedCompany(companyId);
    setSelectedBranch('');
    setBranches([]);
    setEmployees([]);
    fetchBranches(companyId, true);
  };

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
  };

  /* ---------------- FETCH EMPLOYEES FOR SELECTED BRANCH ---------------- */

  useEffect(() => {
    if (!selectedBranch) {
      setEmployees([]);
      return;
    }

    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true);
        const res = await fetch(`${EMPLOYEE_API}${selectedBranch}`, {
          headers: authHeaders(),
        });
        const json = await res.json();

        if (json.success) {
          setEmployees(json.data || []);
        } else {
          setEmployees([]);
        }
      } catch (err) {
        console.log(err);
        setEmployees([]);
      } finally {
        setEmployeesLoading(false);
      }
    };

    fetchEmployees();
  }, [selectedBranch]);

  /* ---------------- FETCH LEAVES FOR SELECTED BRANCH + DATE FILTER ---------------- */

  useEffect(() => {
    if (!selectedBranch) return;

    const fetchLeaves = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${LEAVE_LIST_BASE}?branch_id=${selectedBranch}&user_id=${dateFilter.user_id}&month=${dateFilter.month}&year=${dateFilter.year}`,
          { headers: authHeaders() }
        );
        const json = await res.json();

        if (json.success) {
          setLeaves(json.data);
          setMeta({
            month: json.month,
            total: json.total_leaves,
            branch_name: json.branch_name,
          });
        } else {
          setError('Failed to load leave records.');
          setLeaves([]);
        }
      } catch (err) {
        setError('Network error. Please try again.');
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [selectedBranch, dateFilter, refreshKey]);

  const refetchLeaves = () => {
    setDateFilter({
      user_id: '',
      month: currentMonth,
      year: currentYear,
    });
    setRefreshKey((k) => k + 1);
  };

  /* ---------------- UPDATE STATUS ---------------- */

  const updateStatus = async (leaveId, newStatus) => {
    if (updatingId) return;

    try {
      setUpdatingId(leaveId);

      const res = await fetch(UPDATE_STATUS_API, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          leave_id: leaveId,
          status: newStatus,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setLeaves((prev) =>
          prev.map((l) => (l.id === leaveId ? { ...l, status: newStatus } : l))
        );
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Network error while updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  /* ---------------- APPLY LEAVE (MODAL) ---------------- */

  const openApplyModal = () => {
    setFormError('');
    setForm({
      ...emptyForm,
      user_id: employees.length > 0 ? String(employees[0].id) : '',
    });
    setShowModal(true);
  };

  const closeApplyModal = () => {
    if (applying) return;
    setShowModal(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // half_day session only applies when duration is 0.5
      if (name === 'duration' && value !== '0.5') {
        next.half_day = '';
      }
      return next;
    });
  };

  // Show Morning/Afternoon only for a half day
  const isHalfDay = form.duration === '0.5';

  const submitLeave = async (e) => {
    e.preventDefault();
    setFormError('');

    const duration = parseFloat(form.duration);

    if (!form.user_id) return setFormError('Please select an employee.');
    if (!form.leave_date) return setFormError('Please select the leave date.');
    if (!form.reason.trim()) return setFormError('Please enter a reason.');
    if (isHalfDay && !form.half_day)
      return setFormError('Please choose Morning or Afternoon for a half day.');

    const payload = {
      user_id: Number(form.user_id), // selected employee's id
      leave_date: form.leave_date,
      reason: form.reason.trim(),
      duration: duration, // 0.5 or 1
      half_day: isHalfDay ? form.half_day : null,
    };

    try {
      setApplying(true);

      const res = await fetch(APPLY_LEAVE_API, {
        method: 'POST',
        headers: authHeaders(), // sends Authorization: Bearer <token>
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.success || data.status)) {
        setShowModal(false);

        // jump to the month of the applied leave so it shows in the list
        const d = new Date(form.leave_date);
        setDateFilter({
          user_id: '',
          month: String(d.getMonth() + 1),
          year: d.getFullYear(),
        });
        setRefreshKey((k) => k + 1);

        alert(data.message || 'Leave applied successfully');
      } else {
        // Laravel validation errors come as { errors: { field: [msg] } }
        if (data.errors) {
          const firstMsg = Object.values(data.errors).flat()[0];
          setFormError(firstMsg || 'Validation failed');
        } else {
          setFormError(data.message || 'Failed to apply leave');
        }
      }
    } catch (err) {
      setFormError('Network error while applying leave');
    } finally {
      setApplying(false);
    }
  };

  /* ---------------- FILTERS / COUNTS ---------------- */

  const filtered = leaves.filter((l) => {
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;

    const matchSearch =
      String(l.id).includes(searchTerm) ||
      (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.empid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.branch_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.leave_date || '').includes(searchTerm);

    return matchStatus && matchSearch;
  });

  const counts = {
    all: leaves.length,
    approved: leaves.filter((l) => l.status === 'approved').length,
    pending: leaves.filter((l) => l.status === 'pending').length,
    rejected: leaves.filter((l) => l.status === 'rejected').length,
  };

  function formatDuration(duration) {
    const d = parseFloat(duration);

    if (d === 0.5) return 'Half Day';

    if (d % 1 === 0) {
      return `${d} Day${d > 1 ? 's' : ''}`;
    }

    if (d % 1 === 0.5) {
      const fullDays = Math.floor(d);
      return `${fullDays} Day${fullDays > 1 ? 's' : ''} + Half Day`;
    }

    return duration;
  }

  function formatHalfDay(halfday) {
    if (!halfday) return '—';
    return halfday.charAt(0).toUpperCase() + halfday.slice(1);
  }

  const renderLeaveRow = (leave, idx) => {
    const sc = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
    const isUpdating = updatingId === leave.id;

    return (
      <tr key={leave.id} className="ll-row">
        <td className="ll-idx">{idx + 1}</td>

        <td className="ll-id-cell">
          <span className="ll-id-badge">#{leave.id}</span>
        </td>

        <td>
          <div className="ll-emp-info">
            <span className="ll-name">{leave.name}</span>
            <span className="ll-empid">{leave.empid}</span>
          </div>
        </td>

        <td className="ll-date">{formatDate(leave.leave_date)}</td>

        <td className="ll-reason-cell">
          <div className="ll-reason-text" title={leave.reason}>
            {leave.reason || '—'}
          </div>
        </td>

        <td className="ll-date ll-dim">{formatDate(leave.created_at)}</td>

        <td>{formatDuration(leave.duration)}</td>

        <td>{formatHalfDay(leave.half_day)}</td>

        <td>
          <span className={`ll-status ${sc.cls}`}>
            {sc.icon} {sc.label}
          </span>
        </td>

        <td className="ll-txt-center">
          {leave.status === 'pending' ? (
            <select
              className="ll-status-dropdown"
              value={leave.status || 'pending'}
              disabled={isUpdating}
              onChange={(e) => updateStatus(leave.id, e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          ) : (
            <span className="ll-status-fixed">
              {' '}
              {sc.icon} {sc.label}
            </span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="leavelist-page">
      <div className="leavelist-header">
        <div className="leavelist-title">
          <FiCalendar className="ll-title-icon" />

          <div>
            <h1>Leave Management</h1>
            <p>
              {meta.branch_name ? `${meta.branch_name} · ` : ''}
              {meta.month || 'Current Month'} · {meta.total} leave
              {meta.total !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>

        <div className="leavelist-controls">
          {/* COMPANY DROPDOWN */}
          <select
            className="branch-select"
            value={selectedCompany}
            onChange={handleCompanyChange}
          >
            <option value="" disabled>
              Select Company
            </option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          {/* BRANCH DROPDOWN */}
          <select
            className="branch-select"
            value={selectedBranch}
            onChange={handleBranchChange}
            disabled={branches.length === 0}
          >
            <option value="" disabled>
              Select Branch
            </option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          <div className="ll-search-wrap">
            <FiSearch className="ll-search-icon" />

            <input
              type="text"
              className="ll-search"
              placeholder="Search by ID, name, emp id, branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* APPLY LEAVE BUTTON */}
          <button
            className="ll-apply-btn"
            onClick={openApplyModal}
            disabled={!selectedBranch || employeesLoading}
            title="Apply leave for an employee"
          >
            <FiPlus /> Apply Leave
          </button>

          <button
            className="ll-refresh-btn"
            onClick={refetchLeaves}
            title="Refresh"
          >
            <FiRefreshCw className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      <div
        style={{ display: 'flex', width: '100%', gap: '30px', padding: '10px' }}
      >
        <div className="form-group">
          <label>Month Filter</label>
          <select name="month" value={dateFilter.month} onChange={handleDate}>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Year Filter</label>
          <select name="year" value={dateFilter.year} onChange={handleDate}>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ll-tabs">
        {['all', 'approved', 'pending', 'rejected'].map((s) => (
          <button
            key={s}
            className={`ll-tab ll-tab--${s} ${filterStatus === s ? 'll-tab--active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}

            <span className="ll-tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {!selectedBranch ? (
        <div className="ll-center">
          <p>Select a company and branch to view leave records.</p>
        </div>
      ) : (
        <>
          {loading && leaves.length === 0 && (
            <div className="ll-center">
              <div className="ll-spinner" />
              <p>Loading leave records…</p>
            </div>
          )}

          {error && (
            <div className="ll-error">
              <FiAlertCircle />
              {error}

              <button className="ll-retry" onClick={refetchLeaves}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && leaves.length > 0 && (
            <div className="ll-summary-row">
              <div className="ll-summary-card ll-summary--total">
                <span className="ll-sum-num">{counts.all}</span>
                <span className="ll-sum-label">Total Applied</span>
              </div>

              <div className="ll-summary-card ll-summary--approved">
                <span className="ll-sum-num">{counts.approved}</span>
                <span className="ll-sum-label">Approved</span>
              </div>

              <div className="ll-summary-card ll-summary--pending">
                <span className="ll-sum-num">{counts.pending}</span>
                <span className="ll-sum-label">Pending</span>
              </div>

              <div className="ll-summary-card ll-summary--rejected">
                <span className="ll-sum-num">{counts.rejected}</span>
                <span className="ll-sum-label">Rejected</span>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {filtered.length === 0 ? (
                <div className="ll-center">
                  <p>No leave records found matching your criteria.</p>
                </div>
              ) : (
                <div className="ll-table-wrap">
                  <table className="ll-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Leave ID</th>
                        <th>Employee Details</th>
                        <th>Leave Date</th>
                        <th>Reason</th>
                        <th>Applied On</th>
                        <th>Leave Duration</th>
                        <th>Session</th>
                        <th>Status</th>
                        <th className="ll-txt-center">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filtered.map((leave, idx) => renderLeaveRow(leave, idx))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ================= APPLY LEAVE MODAL ================= */}
      {showModal && (
        <div className="ll-modal-overlay" onClick={closeApplyModal}>
          <div className="ll-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ll-modal-head">
              <h2>Apply Leave</h2>
              <button
                type="button"
                className="ll-modal-close"
                onClick={closeApplyModal}
              >
                <FiX />
              </button>
            </div>

            <form className="ll-modal-form" onSubmit={submitLeave}>
              <div className="ll-field">
                <label>Employee</label>
                <select
                  name="user_id"
                  value={form.user_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="" disabled>
                    Select Employee
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                {employees.length === 0 && (
                  <small className="ll-hint">
                    No employees found for this branch.
                  </small>
                )}
              </div>

              <div className="ll-field-row">
                <div className="ll-field">
                  <label>Leave Date</label>
                  <input
                    type="date"
                    name="leave_date"
                    value={form.leave_date}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="ll-field">
                  <label>Duration</label>
                  <select
                    name="duration"
                    value={form.duration}
                    onChange={handleFormChange}
                    required
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isHalfDay && (
                <div className="ll-field">
                  <label>Half Day Session</label>
                  <select
                    name="half_day"
                    value={form.half_day}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="" disabled>
                      Select session
                    </option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                  </select>
                </div>
              )}

              <div className="ll-field">
                <label>Reason</label>
                <textarea
                  name="reason"
                  rows="3"
                  value={form.reason}
                  onChange={handleFormChange}
                  placeholder="Enter the reason for leave"
                  required
                />
              </div>

              {formError && <div className="ll-form-error">{formError}</div>}

              <div className="ll-modal-actions">
                <button
                  type="button"
                  className="ll-btn-cancel"
                  onClick={closeApplyModal}
                  disabled={applying}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ll-btn-submit"
                  disabled={applying}
                >
                  {applying ? 'Applying…' : 'Apply Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}