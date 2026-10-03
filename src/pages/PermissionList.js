import React, { useState, useEffect } from 'react';
import '../styles/PermissionList.css';
import { FiClock, FiCheckCircle, FiXCircle, FiRefreshCw, FiAlertCircle, FiSearch } from 'react-icons/fi';
import Lottie from "lottie-react";
import animationData from "../LottieFiles/Allow Permission.json";

const COMPANY_API = 'https://storekkb.mpdatahub.com/api/list-company';
const BRANCH_API = 'https://storekkb.mpdatahub.com/api/get-branch-for-company?company_id=';

const PERMISSION_LIST_BASE = 'https://storekkb.mpdatahub.com/api/permission-list-by-branch';
const APPROVE_PERMISSION_API = 'https://storekkb.mpdatahub.com/api/approve-permission';

const STATUS_CONFIG = {
  approved: {
    label: 'Approved',
    icon: <FiCheckCircle />,
    cls: 'pl-status-approved',
  },
  pending: { label: 'Pending', icon: <FiClock />, cls: 'pl-status-pending' },
  rejected: {
    label: 'Rejected',
    icon: <FiXCircle />,
    cls: 'pl-status-rejected',
  },
};

export default function PermissionList() {
  const [permissions, setPermissions] = useState([]);
  const [meta, setMeta] = useState({ branch_name: '', total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  // Company / Branch dropdown state
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1);
  const currentYear = now.getFullYear();

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
        }
      }
    } catch (err) {
      console.error(err);
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
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------- COMPANY CHANGE HANDLER ---------------- */

  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    setSelectedCompany(companyId);
    setSelectedBranch('');
    setBranches([]);
    fetchBranches(companyId, true);
  };

  /* ---------------- BRANCH CHANGE HANDLER ---------------- */

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
  };

  /* ---------------- UPDATE STATUS ---------------- */

  const updateStatus = async (id, newStatus) => {
    if (updatingId) return;
    try {
      setUpdatingId(id);
      const res = await fetch(`${APPROVE_PERMISSION_API}/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        setPermissions((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Network error while updating status');
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ---------------- FETCH PERMISSIONS FOR SELECTED BRANCH + DATE FILTER ---------------- */

  useEffect(() => {
    if (!selectedBranch) return;

    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${PERMISSION_LIST_BASE}?branch_id=${selectedBranch}&user_id=${dateFilter.user_id}&month=${dateFilter.month}&year=${dateFilter.year}`
        );
        const json = await res.json();

        if (json.success) {
          setPermissions(json.data || []);
          setMeta({
            branch_name: json.branch_name || '',
            total: json.total_permissions || 0,
          });
        } else {
          setError('Failed to fetch permission list');
          setPermissions([]);
        }
      } catch (err) {
        setError('Network error. Please try again later.');
        console.error(err);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [selectedBranch, dateFilter]);

  const refetchPermissions = () => {
    setDateFilter({
      user_id: '',
      month: currentMonth,
      year: currentYear,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === '00:00:00') return '—';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const formatDuration = (value) => {
    if (!value) return '—';
    const num = parseFloat(value);

    if (num < 1) {
      return `${Math.round(num * 100)} min`;
    }

    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 100);

    if (minutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${minutes} min`;
  };

  const filtered = permissions.filter((p) => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch =
      String(p.id).includes(searchTerm) ||
      (p.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.user_id).includes(searchTerm) ||
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.empid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.branch_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: permissions.length,
    approved: permissions.filter((p) => p.status === 'approved').length,
    pending: permissions.filter((p) => p.status === 'pending').length,
    rejected: permissions.filter((p) => p.status === 'rejected').length,
  };

  const renderPermissionRow = (p, idx) => {
    const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
    const isUpdating = updatingId === p.id;

    return (
      <tr key={p.id}>
        <td>{idx + 1}</td>
        <td>
          <span className="pl-id-badge">#{p.id}</span>
        </td>
        <td>
          <div className="pl-emp-info">
            <span className="pl-name">{p.name}</span>
            {/* {p.empid && <span className="pl-empid">{p.empid}</span>} */}
          </div>
        </td>
        <td>{formatDate(p.attendance_date)}</td>
        <td>
          <span className="pl-time-badge">
            {formatTime(p.start_time)} - {formatTime(p.end_time)}
          </span>
        </td>
        <td>
          <span className="pl-hours">
            {formatDuration(p.permission_hours)}
          </span>
        </td>
        <td className="pl-reason-cell">
          <div className="pl-reason-text" title={p.reason}>
            {p.reason}
          </div>
        </td>
        <td>
          <span className={`pl-status ${sc.cls}`}>
            {sc.icon} {sc.label}
          </span>
        </td>
        <td style={{ color: '#94a3b8', fontSize: '12px' }}>
          {formatDate(p.created_at)}
        </td>
        <td style={{ textAlign: 'center' }}>
          {p.status === 'pending' ? (
            <select
              className="ll-status-dropdown"
              value={p.status}
              disabled={isUpdating}
              onChange={(e) => updateStatus(p.id, e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approve</option>
              <option value="rejected">Reject</option>
            </select>
          ) : (
            <span
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#94a3b8',
              }}
            >
              {sc.icon} {sc.label}
            </span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="permission-page fade-in">
      <div className="permission-header">
        <div className="permission-title-group">
          <Lottie animationData={animationData} loop={true} style={{ width: 70, height: 70 }} />
          <div>
            <h1>Permission List</h1>
            <p>
              {meta.branch_name ? `${meta.branch_name} · ` : ''}
              Total {counts.all} permission requests found
            </p>
          </div>
        </div>

        <div className="permission-controls">
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

          <div className="pl-search-wrap">
            <FiSearch className="pl-search-icon" />
            <input
              type="text"
              className="pl-search-input"
              placeholder="Search by ID, name, reason, branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className={`pl-refresh-btn ${loading ? 'spinning' : ''}`}
            onClick={refetchPermissions}
            disabled={loading}
          >
            <FiRefreshCw />
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
          <select
            name="year"
            value={dateFilter.year}
            onChange={handleDate}
          >
            {Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pl-tabs">
        {['all', 'approved', 'pending', 'rejected'].map((s) => (
          <button
            key={s}
            className={`pl-tab ${filterStatus === s ? 'pl-tab--active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="pl-tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {!selectedBranch ? (
        <div className="pl-center">
          <p>Select a company and branch to view permission records.</p>
        </div>
      ) : (
        <>
          {!loading && !error && permissions.length > 0 && (
            <div className="pl-summary-grid">
              <div className="pl-summary-card pl-summary-total">
                <span className="pl-card-num">{counts.all}</span>
                <span className="pl-card-label">Total Applied</span>
              </div>
              <div className="pl-summary-card pl-summary-approved">
                <span className="pl-card-num">{counts.approved}</span>
                <span className="pl-card-label">Approved</span>
              </div>
              <div className="pl-summary-card pl-summary-pending">
                <span className="pl-card-num">{counts.pending}</span>
                <span className="pl-card-label">Pending</span>
              </div>
              <div className="pl-summary-card pl-summary-rejected">
                <span className="pl-card-num">{counts.rejected}</span>
                <span className="pl-card-label">Rejected</span>
              </div>
            </div>
          )}

          {loading && permissions.length === 0 ? (
            <div className="pl-center">
              <div className="pl-spinner"></div>
              <p>Fetching permissions...</p>
            </div>
          ) : error ? (
            <div className="pl-error">
              <span>
                <FiAlertCircle /> {error}
              </span>
              <button className="pl-retry-btn" onClick={refetchPermissions}>
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="pl-center">
              <p>No permission records found.</p>
            </div>
          ) : (
            <div className="pl-table-container">
              <table className="pl-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Permission ID</th>
                    <th>Employee Details</th>
                    <th>Date</th>
                    <th>Time Slot</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Applied On</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => renderPermissionRow(p, idx))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}