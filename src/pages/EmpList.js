import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/EmpList.css';
import { FiEdit2, FiX, FiSave, FiPlus, FiUsers, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import Lottie from "lottie-react";
import animationData from "../LottieFiles/Employee Search.json";

const COMPANY_API = "https://storekkb.mpdatahub.com/api/list-company";
const BRANCH_API = "https://storekkb.mpdatahub.com/api/get-branch-for-company?company_id=";

const UPDATE_URL = 'https://storekkb.mpdatahub.com/api/update-profile';
const ROLE_API = "https://storekkb.mpdatahub.com/api/roles";
const POSITION_API = "https://storekkb.mpdatahub.com/api/positions";

// Branch-filtered list APIs
const API_URL_BASE = 'https://storekkb.mpdatahub.com/api/employee-list-by-branch?branch_id=';
const INACTIVE_URL_BASE = 'https://storekkb.mpdatahub.com/api/inactive-employee-list-by-branch?branch_id=';
const INTERN_URL_BASE = 'https://storekkb.mpdatahub.com/api/employee-list-role-by-branch?branch_id=';
const INACTIVE_INTERN_URL_BASE = 'https://storekkb.mpdatahub.com/api/inactive-employee-list-role-by-branch?branch_id=';

const UPDATE_STATUS_URL = 'https://storekkb.mpdatahub.com/api/update-Employee-Status';

export default function EmpList() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [inactiveEmployees, setInactiveEmployees] = useState([]);
  const [interns, setInterns] = useState([]);
  const [inactiveInterns, setInactiveInterns] = useState([]);

  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [roles, setRoles] = useState([]);

  /* ================= POSITIONS STATE ================= */
  // Same source of truth as the Registration form's Position dropdown.
  const [positions, setPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(false);

  // Company / Branch dropdown state
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // Branch dropdown used ONLY inside the edit modal (may differ from page-level company)
  const [editBranches, setEditBranches] = useState([]);

  // active | inactive | intern | inactive_intern
  const [filterStatus, setFilterStatus] = useState('active');

  /* ---------------- PASSWORD CHANGE STATE (edit modal) ---------------- */
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  /* ---------------- INITIAL LOAD: companies + roles + positions ---------------- */

  useEffect(() => {
    fetchRoles();
    fetchPositions();
    fetchCompanies();
  }, []);

  /* ---------------- WHEN BRANCH CHANGES: reload all 4 lists ---------------- */

  useEffect(() => {
    if (selectedBranch) {
      fetchAllListsForBranch(selectedBranch);
    }
  }, [selectedBranch]);

  const tabLabels = {
    active: 'Employee List',
    inactive: 'Inactive Employee List',
    intern: 'Intern List',
    inactive_intern: 'Inactive Intern List',
  };

  const counts = {
    active: employees.length,
    inactive: inactiveEmployees.length,
    intern: interns.length,
    inactive_intern: inactiveInterns.length,
  };

  /* ---------------- FETCH COMPANIES ---------------- */

  const fetchCompanies = async () => {
    try {
      const res = await fetch(COMPANY_API);
      const json = await res.json();

      if (json.success) {
        setCompanies(json.data);

        // auto-select the first company, then load its branches
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

  /* ---------------- FETCH ALL 4 LISTS FOR SELECTED BRANCH ---------------- */

  const fetchAllListsForBranch = async (branchId) => {
    setListLoading(true);
    setLoading(true);

    await Promise.all([
      fetchEmployees(branchId),
      fetchInactiveEmployees(branchId),
      fetchInterns(branchId),
      fetchInactiveInterns(branchId),
    ]);

    setListLoading(false);
    setLoading(false);
  };

  const fetchEmployees = async (branchId) => {
    try {
      const res = await fetch(`${API_URL_BASE}${branchId}`);
      const json = await res.json();

      if (json.success) {
        setEmployees(json.data);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.log(err);
      setEmployees([]);
    }
  };

  const fetchInactiveEmployees = async (branchId) => {
    try {
      const res = await fetch(`${INACTIVE_URL_BASE}${branchId}`);
      const json = await res.json();

      if (json.success) {
        setInactiveEmployees(json.data);
      } else {
        setInactiveEmployees([]);
      }
    } catch (err) {
      console.log(err);
      setInactiveEmployees([]);
    }
  };

  const fetchInterns = async (branchId) => {
    try {
      const res = await fetch(`${INTERN_URL_BASE}${branchId}`);
      const json = await res.json();

      if (json.success) {
        setInterns(json.data);
      } else {
        setInterns([]);
      }
    } catch (err) {
      console.log(err);
      setInterns([]);
    }
  };

  const fetchInactiveInterns = async (branchId) => {
    try {
      const res = await fetch(`${INACTIVE_INTERN_URL_BASE}${branchId}`);
      const json = await res.json();

      if (json.success) {
        setInactiveInterns(json.data);
      } else {
        setInactiveInterns([]);
      }
    } catch (err) {
      console.log(err);
      setInactiveInterns([]);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(ROLE_API);
      const json = await res.json();

      if (json.success) {
        setRoles(json.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  /* ---------------- FETCH POSITIONS ---------------- */
  // Same endpoint + response shape (result.status / result.data) used on the Registration form.

  const fetchPositions = async () => {
    setLoadingPositions(true);

    try {
      const res = await fetch(POSITION_API);
      const json = await res.json();

      if (json.status) {
        setPositions(json.data);
      }
    } catch (err) {
      console.log(err);
    }

    setLoadingPositions(false);
  };

  // Only positions that are Active + isActive show up as selectable
  // options on the edit modal's Position dropdown (mirrors Registration form)
  const selectablePositions = positions.filter(
    (p) => p.islotlog === 'Active' && (p.isActive === true || p.isActive === 1)
  );

  /* ---------------- UPDATE EMPLOYEE STATUS ---------------- */

  const updateEmployeeStatus = async (id, status) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${UPDATE_STATUS_URL}?user_id=${id}&status=${status}`
      );
      const json = await res.json();

      if (json.success && selectedBranch) {
        fetchAllListsForBranch(selectedBranch);
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  const handleToggle = (id, status) => {
    const updatedStatus = status === 0 ? 1 : 0;
    updateEmployeeStatus(id, updatedStatus);
  };

  /* ---------------- OPEN EDIT ---------------- */

  const openEdit = (emp) => {
    setEditData({
      id: emp.id,
      name: emp.name || "",
      empid: emp.empid || "",
      email: emp.email || "",
      mobile: emp.mobile || "",
      position: emp.position || "",
      address: emp.address || "",
      dob: emp.dob || "",
      role_id: emp.role_id || "",
      company_id: emp.company_id || selectedCompany || "",
      branch_id: emp.branch_id || selectedBranch || "",
      start_time: emp.start_time ? emp.start_time.slice(0, 5) : "",
      end_time: emp.end_time ? emp.end_time.slice(0, 5) : "",
      salary: emp.salary ?? "",
    });

    // load branches for whichever company this employee belongs to
    fetchEditBranches(emp.company_id || selectedCompany);

    // reset password-change UI every time the modal is opened for a (possibly different) employee
    setShowPasswordChange(false);
    setNewPassword('');
    setConfirmPassword('');
    setShowPwd(false);
    setShowConfirmPwd(false);
    setPasswordError('');

    setEditModal(true);
  };

  const closeEditModal = () => {
    setEditModal(false);
    setShowPasswordChange(false);
    setNewPassword('');
    setConfirmPassword('');
    setShowPwd(false);
    setShowConfirmPwd(false);
    setPasswordError('');
  };

  const fetchEditBranches = async (companyId) => {
    try {
      const res = await fetch(`${BRANCH_API}${companyId}`);
      const json = await res.json();

      if (json.success) {
        setEditBranches(json.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';

    const [hour, minute] = time.split(':');

    let h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';

    h = h % 12 || 12; // convert 0 → 12

    return `${h}:${minute} ${ampm}`;
  };

  /* ---------------- INPUT CHANGE ---------------- */

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ---------------- TOGGLE PASSWORD CHANGE PANEL ---------------- */

  const togglePasswordChange = () => {
    setShowPasswordChange((prev) => !prev);
    setNewPassword('');
    setConfirmPassword('');
    setShowPwd(false);
    setShowConfirmPwd(false);
    setPasswordError('');
  };

  /* ---------------- SAVE EDIT ---------------- */

  const saveEdit = async () => {
    if (!editData?.id) {
      setSaveError('ID missing');
      return;
    }

    // validate password fields only if the user opened the panel and is trying to change it
    if (showPasswordChange) {
      if (!newPassword || !confirmPassword) {
        setPasswordError('Please fill in both password fields');
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
    }

    setSaving(true);
    setSaveError('');
    setPasswordError('');

    try {
      const formData = new FormData();
      const formatToHMS = (time) => {
        if (!time) return '';
        if (time.length === 8) return time;
        return time + ':00'; // convert HH:mm → HH:mm:ss
      };
      formData.append('id', editData.id);

      // only send changed fields
      if (editData.name) formData.append('name', editData.name);
      if (editData.empid) formData.append('empid', editData.empid);
      if (editData.email) formData.append('email', editData.email);
      if (editData.mobile) formData.append('mobile', editData.mobile);
      if (editData.position) formData.append('position', editData.position);
      if (editData.address) formData.append('address', editData.address);
      if (editData.dob) formData.append('dob', editData.dob);
      if (editData.salary !== '' && editData.salary !== null && editData.salary !== undefined) {
        formData.append('salary', editData.salary);
      }
      if (editData.start_time) {
        formData.append('start_time', formatToHMS(editData.start_time));
      }

      if (editData.end_time) {
        formData.append('end_time', formatToHMS(editData.end_time));
      }
      formData.append("role_id", editData.role_id);
      formData.append("company_id", editData.company_id);
      formData.append("branch_id", editData.branch_id);

      // include password only if the change-password panel was used
      if (showPasswordChange && newPassword) {
        formData.append('password', newPassword);
      }

      const res = await fetch(UPDATE_URL, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      console.log('API Response:', json);

      if (json.success) {
        // refresh the currently selected branch's lists so any branch change is reflected
        if (selectedBranch) {
          fetchAllListsForBranch(selectedBranch);
        }

        closeEditModal();
      } else {
        setSaveError(json.message || 'Update failed');
      }
    } catch {
      setSaveError('Network error');
    }
    setSaving(false);
  };

  /* ---------------- LISTS PER TAB (no search filtering) ---------------- */

  const listByTab = {
    active: employees,
    inactive: inactiveEmployees,
    intern: interns,
    inactive_intern: inactiveInterns,
  };

  const headerCountLabel = () => {
    if (filterStatus === 'active') return `${employees.length} employees`;
    if (filterStatus === 'inactive') return `${inactiveEmployees.length} employees`;
    if (filterStatus === 'intern') return `${interns.length} interns`;
    return `${inactiveInterns.length} interns`;
  };

  const currentBranchName =
    branches.find((b) => String(b.id) === String(selectedBranch))?.name || '';

  const formatSalary = (salary) => {
    if (salary === null || salary === undefined || salary === '') return 'N/A';
    const num = Number(salary);
    if (Number.isNaN(num)) return salary;
    return num.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  const renderEmpCard = (emp) => (
    <div className="emp-card" key={emp.id}>
      <div className="emp-card-top">
        <img
          src={emp.profile_img}
          alt={emp.name}
          className="emp-avatar"
        />
        <div className="emp-badge">{emp.empid}</div>
      </div>

      <div className="emp-card-body">
        <h3>{emp.name}</h3>

        <span className="emp-position">{emp.position || 'N/A'}</span>

        <p>
          <strong>Email:</strong> {emp.email}
        </p>
        <p>
          <strong>Phone:</strong> {emp.mobile}
        </p>
        <p>
          <strong>DOB:</strong> {emp.dob || 'N/A'}
        </p>
        <p>
          <strong>Address:</strong> {emp.address}
        </p>
        <p>
          <strong>Salary:</strong> {formatSalary(emp.salary)}
        </p>
        <p>
          <strong>Work Time:</strong>{' '}
          {formatTime(emp.start_time)} to {formatTime(emp.end_time)}
        </p>

        {/*============= BUTTONS =================*/}
        <div className="emp-card-actions">
          <label className="switch">
            <input
              type="checkbox"
              checked={emp.status === 1}
              onChange={() => handleToggle(emp.id, emp.status)}
            />
            <span className="slider"></span>
          </label>

          <span className="status-text">
            {emp.status === 1 ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="emp-card-actions">
        <button className="btn-edit" onClick={() => openEdit(emp)}>
          <FiEdit2 /> Edit
        </button>
      </div>
    </div>
  );

  /* ---------------- UI ---------------- */
  return (
    <div className="emplist-page">
      {/* HEADER */}

      <div className="emplist-header">
        <div className="emplist-title">
          <Lottie animationData={animationData} loop={true} style={{ width: 90, height: 70 }} />
          <div>
            <h1>Employee List</h1>
            <p>
              {currentBranchName ? `${currentBranchName} · ` : ''}
              {headerCountLabel()}
            </p>
          </div>
        </div>

        <div className="emplist-header-controls">
          {/* ADD EMPLOYEE BUTTON */}
          <button
            type="button"
            className="btn-add-employee"
            onClick={() => navigate('/admin/add-employee')}
          >
            <FiPlus /> Add Employee
          </button>

          {/* TEAM BUTTON — navigates to the Team Management page */}
          <button
            type="button"
            className="btn-add-employee"
            onClick={() => navigate('/admin/team-management')}
          >
            <FiUsers /> Team
          </button>

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
        </div>
      </div>

      <div className="pl-tabs">
        {['active', 'inactive'].map((s) => (
          <button
            key={s}
            className={`pl-tab ${filterStatus === s ? 'pl-tab--active' : ''}`}
            onClick={() => {
              setFilterStatus(s);
            }}
          >
            {tabLabels[s]}
            <span className="pl-tab-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* EMPLOYEE GRID - FLAT LIST FOR THE SELECTED BRANCH */}

      {!selectedBranch ? (
        <div className="emp-grid">
          <div className="emp-loader">
            <p>Select a company and branch to view employees.</p>
          </div>
        </div>
      ) : loading || listLoading ? (
        <div className="emp-grid">
          <div className="emp-loader">
            <p>Loading employees...</p>
          </div>
        </div>
      ) : listByTab[filterStatus].length === 0 ? (
        <div className="emp-grid">
          <div className="emp-loader">
            <p>No records found.</p>
          </div>
        </div>
      ) : (
        <div className="emp-grid">
          {listByTab[filterStatus].map((emp) => renderEmpCard(emp))}
        </div>
      )}

      {/* EDIT MODAL */}

      {editModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>Edit Employee</h2>

              <button
                className="modal-close"
                onClick={closeEditModal}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              {saveError && <div className="modal-api-error">{saveError}</div>}

              <div className="modal-form">

                <div className="form-group">
                  <label>Name</label>
                  <input
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Employee ID</label>
                  <input
                    name="empid"
                    value={editData.empid}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    name="email"
                    value={editData.email}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Mobile</label>
                  <input
                    name="mobile"
                    value={editData.mobile}
                    onChange={handleEditChange}
                  />
                </div>

                {/* POSITION — dropdown sourced from the same /positions API used on the
                    Registration form. Options use position_name (not id) as the value
                    because existing employee records store position as text, so the
                    employee's current position is pre-selected automatically. */}
                <div className="form-group">
                  <label>Position</label>

                  <select
                    name="position"
                    value={editData.position}
                    onChange={handleEditChange}
                  >
                    <option value="">
                      {loadingPositions ? 'Loading...' : 'Select Position'}
                    </option>

                    {/* Keep the employee's current value visible/selected even if it
                        doesn't match any active position (custom or differently-cased
                        entries in the existing data) */}
                    {editData.position &&
                      !selectablePositions.some(
                        (pos) => pos.position_name.toLowerCase() === editData.position.toLowerCase()
                      ) && (
                        <option value={editData.position}>{editData.position}</option>
                      )}

                    {selectablePositions.map((pos) => (
                      <option key={pos.id} value={pos.position_name}>
                        {pos.position_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Salary</label>
                  <input
                    type="number"
                    name="salary"
                    min="0"
                    step="0.01"
                    value={editData.salary}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>

                  <select
                    name="role_id"
                    value={editData.role_id}
                    onChange={handleEditChange}
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Company</label>

                  <select
                    name="company_id"
                    value={editData.company_id}
                    onChange={(e) => {
                      handleEditChange(e);
                      fetchEditBranches(e.target.value);
                    }}
                  >
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Branch</label>

                  <select
                    name="branch_id"
                    value={editData.branch_id}
                    onChange={handleEditChange}
                  >
                    {editBranches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={editData.dob}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group form-group--full">
                  <label>Address</label>
                  <input
                    name="address"
                    value={editData.address}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    name="start_time"
                    value={editData.start_time}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    name="end_time"
                    value={editData.end_time}
                    onChange={handleEditChange}
                  />
                </div>

              </div>

              {/* ===================== CHANGE PASSWORD SECTION ===================== */}
              <div className="password-section">
                <button
                  type="button"
                  className="btn-change-password"
                  onClick={togglePasswordChange}
                >
                  <FiLock /> {showPasswordChange ? 'Cancel Password Change' : 'Change Password'}
                </button>

                {showPasswordChange && (
                  <div className="password-fields">
                    {passwordError && (
                      <div className="modal-api-error">{passwordError}</div>
                    )}

                    <div className="form-group password-input-group">
                      <label>New Password</label>
                      <div className="password-input-wrap">
                        <input
                          type={showPwd ? 'text' : 'password'}
                          name="newPassword"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <span
                          className="password-toggle-icon"
                          onClick={() => setShowPwd((p) => !p)}
                        >
                          {showPwd ? <FiEyeOff /> : <FiEye />}
                        </span>
                      </div>
                    </div>

                    <div className="form-group password-input-group">
                      <label>Confirm Password</label>
                      <div className="password-input-wrap">
                        <input
                          type={showConfirmPwd ? 'text' : 'password'}
                          name="confirmPassword"
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <span
                          className="password-toggle-icon"
                          onClick={() => setShowConfirmPwd((p) => !p)}
                        >
                          {showConfirmPwd ? <FiEyeOff /> : <FiEye />}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={closeEditModal}
              >
                Cancel
              </button>

              <button className="btn-save" onClick={saveEdit} disabled={saving}>
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <FiSave /> Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}