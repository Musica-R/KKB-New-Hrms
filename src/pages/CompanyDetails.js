import React, { useState, useEffect } from 'react';
import '../styles/CompanyDetails.css';
import '../styles/RegistrationForm.css';
import Lottie from 'lottie-react';
import animationData from '../LottieFiles/Company.json';
import { IoAdd } from 'react-icons/io5';
import { createPortal } from 'react-dom';
import { FaGreaterThan } from 'react-icons/fa6';
import { CiEdit } from 'react-icons/ci';

const API_BASE = 'https://storekkb.mpdatahub.com/api';

const CompanyDetails = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    company_address: '',
  });

  const [formData1, setFormData1] = useState({
    company_id: '',
    branch_name: '',
    branch_lon: '',
    branch_lat: '',
    branch_address: '',
    branch_id: '',
    meter: ''
  });

  const [activeCompanyForm, setActiveCompanyForm] = useState(false);
  const [activeBranchForm, setActiveBranchForm] = useState(false);
  const [branchList, setBranchList] = useState(false);

  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState(null);

  const [branch, setBranch] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  const [loading, setLoading] = useState(true);

  /* ================= POSITIONS STATE ================= */
  // Moved here from the Registration page - lives at the bottom of Company Details.
  const [positions, setPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(false);

  const [newPosition, setNewPosition] = useState({
    position_name: '',
    islotlog: 'Active',
    isActive: true,
  });
  const [addingPosition, setAddingPosition] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ================= EDIT BRANCH ================= */

  const handleEdit = (branch) => {
    setFormData1({
      company_id: branch.company_id,
      branch_name: branch.branch_name,
      branch_lat: branch.branch_lat,
      branch_lon: branch.branch_lon,
      branch_address: branch.branch_address,
      branch_id: branch.id,
      meter: branch.meter || ''
    });
    setIsEdit(true);
    setActiveBranchForm(true);
  };

  const closeBranchForm = () => {
    setActiveBranchForm(false);
    setIsEdit(false);
    setFormData1({
      company_id: '',
      branch_name: '',
      branch_lon: '',
      branch_lat: '',
      branch_address: '',
      branch_id: '',
      meter: ''
    });
  };

  /* ================= FETCH COMPANIES ================= */

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);

      try {
        const response = await fetch(
          'https://storekkb.mpdatahub.com/api/list-company'
        );
        const result = await response.json();
        if (result.success) {
          setCompanies(result.data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
      setLoadingCompanies(false);
    };

    fetchCompanies();
  }, [setActiveCompanyForm]);

  /* ================= FETCH BRANCH BY COMPANY ID ================= */

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const response = await fetch(
          `https://storekkb.mpdatahub.com/api/list-Branch-id/${companyId}`
        );
        const result = await response.json();
        if (result.success) {
          setBranch(result.data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchBranch();
  }, [companyId, formData1]);

  /* ================= FETCH POSITIONS ================= */

  const fetchPositions = async () => {
    setLoadingPositions(true);

    try {
      const response = await fetch(`${API_BASE}/positions`);
      const result = await response.json();

      if (result.status) {
        setPositions(result.data);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }

    setLoadingPositions(false);
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  /* ================= HANDLE INPUT ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChange1 = (e) => {
    const { name, value } = e.target;

    setFormData1((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ================= COMPANY FORM SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = new FormData();

    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) {
        submitData.append(key, formData[key]);
      }
    });

    try {
      const response = await fetch(
        'https://storekkb.mpdatahub.com/api/add-company',
        {
          method: 'POST',
          body: submitData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log(result);
        alert(result.message || 'Company Created successfully!');

        setFormData({
          company_name: '',
          company_address: '',
        });
      } else {
        alert(
          'Failed to create Company: ' + (result.message || 'Unknown error')
        );
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    } finally {
      setActiveCompanyForm(false);
    }
  };

  /* ================= BRANCH FORM SUBMIT ================= */

  const branchUpdate = async (e) => {
    e.preventDefault();

    const submitData = new FormData();

    Object.keys(formData1).forEach((key) => {
      if (formData1[key] !== null) {
        submitData.append(key, formData1[key]);
      }
    });

    try {
      if (isEdit) {
        const response = await fetch(
          'https://storekkb.mpdatahub.com/api/update-branch',
          {
            method: 'POST',
            body: submitData,
          }
        );

        const result = await response.json();

        if (response.ok) {
          console.log(result);
          alert(result.message || 'Branch Updated successfully!');

          setFormData1({
            company_id: '',
            branch_name: '',
            branch_lon: '',
            branch_lat: '',
            branch_address: '',
            branch_id: '',
          });
        } else {
          alert(
            'Failed to update Branch: ' + (result.message || 'Unknown error')
          );
        }
      } else {
        const response = await fetch(
          'https://storekkb.mpdatahub.com/api/add-branch',
          {
            method: 'POST',
            body: submitData,
          }
        );

        const result = await response.json();

        if (response.ok) {
          console.log(result);
          alert(result.message || 'Branch Created successfully!');

          setFormData1({
            company_id: '',
            branch_name: '',
            branch_lon: '',
            branch_lat: '',
            branch_address: '',
            branch_id: '',
          });
        } else {
          alert(
            'Failed to create Branch: ' + (result.message || 'Unknown error')
          );
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    } finally {
      setActiveBranchForm(false);
      setIsEdit(false);
    }
  };

  /* ================= ADD NEW POSITION ================= */

  const handleNewPositionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPosition((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddPosition = async (e) => {
    e.preventDefault();

    if (!newPosition.position_name.trim()) return;

    setAddingPosition(true);

    try {
      const response = await fetch(`${API_BASE}/create-positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPosition),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || 'Position added successfully!');
        setNewPosition({ position_name: '', islotlog: 'Active', isActive: true });
        fetchPositions();
      } else {
        if (result.data) {
          alert(Object.values(result.data).flat().join('\n'));
        } else {
          alert(result.message || 'Failed to add position');
        }
      }
    } catch (error) {
      console.error('Error adding position:', error);
      alert('Error adding position');
    }

    setAddingPosition(false);
  };

  /* ================= TOGGLE POSITION STATUS ================= */

  const updatePositionStatus = async (position, updates) => {
    const previous = position;

    setPositions((prev) =>
      prev.map((p) => (p.id === position.id ? { ...p, ...updates } : p))
    );

    try {
      const params = new URLSearchParams({
        islotlog: updates.islotlog,
        isActive: updates.isActive ? 1 : 0,
      });

      const response = await fetch(
        `${API_BASE}/positions/${position.id}/status?${params.toString()}`
      );

      const result = await response.json();

      if (!response.ok || result.status === false) {
        setPositions((prev) =>
          prev.map((p) => (p.id === position.id ? previous : p))
        );
        alert(result.message || 'Failed to update position status');
      }
    } catch (error) {
      console.error('Error updating position status:', error);
      setPositions((prev) =>
        prev.map((p) => (p.id === position.id ? previous : p))
      );
      alert('Error updating position status');
    }
  };

  const handleToggleSlotLog = (position) => {
    updatePositionStatus(position, {
      islotlog: position.islotlog === 'Active' ? 'Inactive' : 'Active',
      isActive: position.isActive,
    });
  };

  const handleToggleActive = (position) => {
    updatePositionStatus(position, {
      islotlog: position.islotlog,
      isActive: !position.isActive,
    });
  };

  /* ================= EDIT POSITION NAME ================= */

  const startEdit = async (position) => {
    setEditingId(position.id);
    setEditName(position.position_name);

    try {
      const response = await fetch(`${API_BASE}/positions/${position.id}`);
      const result = await response.json();

      if (result.status && result.data) {
        setEditName(result.data.position_name);
      }
    } catch (error) {
      console.error('Error fetching position:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (position) => {
    if (!editName.trim()) return;

    setSavingEdit(true);

    try {
      const response = await fetch(
        `${API_BASE}/positions-update/${position.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            position_name: editName,
            islotlog: position.islotlog,
            isActive: position.isActive,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setPositions((prev) =>
          prev.map((p) =>
            p.id === position.id ? { ...p, position_name: editName } : p
          )
        );
        setEditingId(null);
        setEditName('');
      } else {
        if (result.data) {
          alert(Object.values(result.data).flat().join('\n'));
        } else {
          alert(result.message || 'Failed to update position');
        }
      }
    } catch (error) {
      console.error('Error updating position:', error);
      alert('Error updating position');
    }

    setSavingEdit(false);
  };

  /* ================= DELETE POSITION ================= */

  const confirmDeletePosition = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `${API_BASE}/positions-destroy/${deleteTarget.id}`
      );

      if (response.ok) {
        setPositions((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        if (editingId === deleteTarget.id) {
          setEditingId(null);
          setEditName('');
        }
        setDeleteTarget(null);
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to delete position');
      }
    } catch (error) {
      console.error('Error deleting position:', error);
      alert('Error deleting position');
    }

    setDeleting(false);
  };

  /* ================= LOADING STATE ================= */

  if (loading) {
    return (
      <div className="attendance-page loading-container">
        <div className="loader-pulse"></div>
        <p>Loading Company records...</p>
      </div>
    );
  }

  return (
    <div className="form-containers fade-in-up">
      {/* HEADER */}
      <div className="page-headers glass-panels">
        <div className="header-content">
          <div className="permission-title-group">
            <Lottie animationData={animationData} loop={true} style={{ width: 64, height: 64 }} />
            <div>
              <h1>Add Company</h1>
              <p>
                Create and maintain company profiles to streamline operations,
                improve data management, and support organizational growth.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toggle-button">
        <button
          type="button"
          className="toggle-btn"
          onClick={() => setActiveBranchForm(true)}
        >
          <IoAdd style={{ fontSize: '16px' }} /> Add Branch
        </button>
      </div>

      {/* ================= COMPANY FORM ================= */}

      {activeCompanyForm &&
        createPortal(
          <div
            className="modal-overlays"
            onClick={() => setActiveCompanyForm(false)}
          >
            <div
              className="form-card modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="close-btn"
                aria-label="Close"
                onClick={() => setActiveCompanyForm(false)}
              >
                ×
              </button>
              <h2 className="form-title">Add New Company</h2>

              <form onSubmit={handleSubmit} className="registration-form">
                <div className="form-group full-width">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Company Address</label>

                  <textarea
                    name="company_address"
                    value={formData.company_address}
                    onChange={handleChange}
                    rows="3"
                    required
                  ></textarea>
                </div>

                <div className="form-actions full-width">
                  <button type="submit" className="submit-btn">
                    Add Company
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ================= BRANCH FORM ================= */}

      {activeBranchForm &&
        createPortal(
          <div className="modal-overlays" onClick={closeBranchForm}>
            <div
              className="form-card modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="close-btn"
                aria-label="Close"
                onClick={closeBranchForm}
              >
                ×
              </button>
              <h2 className="form-title">
                {isEdit ? 'Update Branch' : 'Add New Branch'}
              </h2>

              <form onSubmit={branchUpdate} className="registration-form">
                <div className="form-group full-width">
                  <label>Company</label>
                  <select
                    name="company_id"
                    value={formData1.company_id}
                    onChange={handleChange1}
                    required
                  >
                    <option value="">
                      {loadingCompanies ? 'Loading...' : 'Select Company'}
                    </option>

                    {companies.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Branch Name</label>
                  <input
                    type="text"
                    name="branch_name"
                    value={formData1.branch_name}
                    onChange={handleChange1}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="text"
                    name="branch_lat"
                    value={formData1.branch_lat}
                    onChange={handleChange1}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="text"
                    name="branch_lon"
                    value={formData1.branch_lon}
                    onChange={handleChange1}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Branch Address</label>
                  <textarea
                    name="branch_address"
                    value={formData1.branch_address}
                    onChange={handleChange1}
                    rows="3"
                    required
                  ></textarea>
                </div>

                <div className="form-group full-width">
                  <label>Allowed Radius (Meters)</label>
                  <select name="meter" value={formData1.meter} onChange={handleChange1} required>
                    <option value="">Select Radius</option>
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((meter) => (
                      <option key={meter} value={meter}>
                        {meter} meters
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-actions full-width">
                  <button type="submit" className="submit-btn">
                    {isEdit ? 'Update Branch' : 'Add Branch'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ================= COMPANY LIST ================= */}

      <div className="section-block">
        <div className="section-heading-row">
          <h2 className="form-title">Company List</h2>
        </div>

        {companies.length === 0 ? (
          <div className="empty-state">No companies added yet.</div>
        ) : (
          <div className="card-container">
            {companies.map((data) => (
              <div className="holiday-card" key={data.id}>
                <div className="card-header">
                  <h3>{data.name}</h3>
                  <button
                    type="button"
                    className="arrow"
                    aria-label={`View branches for ${data.name}`}
                    onClick={() => {
                      setBranchList(true);
                      setCompanyId(data.id);
                    }}
                  >
                    <FaGreaterThan style={{ color: '#5355E0', fontSize: '11px' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= BRANCH LIST ================= */}

      {branchList &&
        createPortal(
          <div className="modal-overlays" onClick={() => setBranchList(false)}>
            <div
              className="form-card1 modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="close-btn"
                aria-label="Close"
                onClick={() => setBranchList(false)}
              >
                ×
              </button>
              <h2 className="form-title">Branch List</h2>

              {branch.length === 0 ? (
                <div className="empty-state">No branches added for this company yet.</div>
              ) : (
                <div className="card-containers">
                  {branch.map((data) => (
                    <div className="holiday-card" key={data.id}>
                      <div className="card-icon-row">
                        <button
                          type="button"
                          className="delete-icons"
                          aria-label={`Edit ${data.branch_name}`}
                          onClick={() => handleEdit(data)}
                        >
                          <CiEdit style={{ color: '#5355E0' }} />
                        </button>
                      </div>
                      <div className="card-header">
                        <h3>{data.branch_name}</h3>
                      </div>
                      <div className="coords-row">
                        <span className="date">Lat: {data.branch_lat}</span>
                        <span className="date">Lon: {data.branch_lon}</span>
                      </div>

                      <div className="meter-badge">{data.meter} meters</div>
                      <p className="description">{data.branch_address}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* ================= POSITION MANAGEMENT (moved from Registration page) ================= */}

      <div className="section-block">
        <div className="section-heading-row">
          <h2 className="form-title">Position Management</h2>
        </div>

        <div className="form-card">
          <form onSubmit={handleAddPosition} className="position-add-form">
            <div className="form-group">
              <label>Position Name</label>
              <input
                type="text"
                name="position_name"
                value={newPosition.position_name}
                onChange={handleNewPositionChange}
                placeholder="e.g. Technician"
                required
              />
            </div>

            <div className="form-group">
              <label>Location Status</label>
              <select
                name="islotlog"
                value={newPosition.islotlog}
                onChange={handleNewPositionChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="form-group position-active-field">
              <label>Active</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={newPosition.isActive}
                  onChange={handleNewPositionChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={addingPosition}
              >
                {addingPosition ? 'Adding...' : 'Add Position'}
              </button>
            </div>
          </form>

          {loadingPositions ? (
            <p className="position-empty">Loading positions...</p>
          ) : positions.length === 0 ? (
            <p className="position-empty">No positions added yet.</p>
          ) : (
            <div className="position-grid">
              {positions.map((position) => (
                <div className="position-card" key={position.id}>
                  <div className="position-card-header">
                    {editingId === position.id ? (
                      <input
                        type="text"
                        className="position-edit-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <h3 className="position-card-name">
                        {position.position_name}
                      </h3>
                    )}
                  </div>

                  <div className="position-card-row">
                    <span>Location Status</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={position.islotlog === 'Active'}
                        onChange={() => handleToggleSlotLog(position)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="position-card-row">
                    <span>Active</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={
                          position.isActive === true || position.isActive === 1
                        }
                        onChange={() => handleToggleActive(position)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="position-card-footer">
                    {editingId === position.id ? (
                      <>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => saveEdit(position)}
                          disabled={savingEdit}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="link-btn cancel"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => startEdit(position)}
                        >
                          Edit Position
                        </button>
                        <button
                          type="button"
                          className="link-btn delete"
                          onClick={() => setDeleteTarget(position)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DELETE CONFIRMATION POPUP */}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-boxs" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete Position</h3>
            <p className="modal-message">
              Are you sure you want to delete{' '}
              <strong>{deleteTarget.position_name}</strong>? This action
              cannot be undone.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn confirm-delete"
                onClick={confirmDeletePosition}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetails;