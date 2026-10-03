import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import '../styles/RegistrationForm.css';

const API_BASE = 'https://storekkb.mpdatahub.com/api';

const RegistrationForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    empid: '',
    email: '',
    mobile: '',
    password: '',
    c_password: '',
    company_id: '',
    branch_id: '',
    address: '',
    position: '',
    role_id: '',
    start_time: '',
    end_time: '',
    dob: '',
    salary: '',
    profileimg: null,
  });

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [passwordError, setPasswordError] = useState('');

  /* ================= POSITIONS STATE ================= */
  // Only kept here so the employee form's Position dropdown has data.
  // Adding/editing/deleting positions now lives on the Company Details page.
  const [positions, setPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(false);

  /* ================= FETCH COMPANIES ================= */

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);

      try {
        const response = await fetch(`${API_BASE}/list-company`);
        const result = await response.json();
        if (result.success) {
          setCompanies(result.data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
      setLoadingCompanies(false);
    };

    fetchCompanies();
  }, []);

  /* ================= FETCH ROLES ================= */

  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);

      try {
        const response = await fetch(`${API_BASE}/roles`);
        const result = await response.json();

        if (result.success) {
          setRoles(result.data);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
      }

      setLoadingRoles(false);
    };

    fetchRoles();
  }, []);

  /* ================= FETCH BRANCHES ================= */

  useEffect(() => {
    if (formData.company_id) {
      const fetchBranches = async () => {
        setLoadingBranches(true);

        try {
          const response = await fetch(
            `${API_BASE}/get-branch-for-company?company_id=${formData.company_id}`
          );

          const result = await response.json();

          if (result.success) {
            setBranches(result.data);
          } else {
            setBranches([]);
          }
        } catch (error) {
          console.error('Error fetching branches:', error);
          setBranches([]);
        }

        setLoadingBranches(false);
      };

      fetchBranches();
    } else {
      setBranches([]);
    }
  }, [formData.company_id]);

  /* ================= FETCH POSITIONS ================= */
  // Read-only here — just populates the dropdown.

  useEffect(() => {
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

    fetchPositions();
  }, []);

  /* ================= HANDLE EMPLOYEE INPUT ================= */

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...(name === 'company_id' ? { branch_id: '' } : {}),
      }));
    }
  };

  /* ================= EMPLOYEE FORM SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.c_password) {
      setPasswordError('Passwords do not match');
      return;
    } else {
      setPasswordError('');
    }

    const submitData = new FormData();

    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) {
        submitData.append(key, formData[key]);
      }
    });

    try {
      const response = await fetch(`${API_BASE}/add-user`, {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || 'User registered successfully!');

        setFormData({
          name: '',
          empid: '',
          email: '',
          mobile: '',
          password: '',
          c_password: '',
          company_id: '',
          branch_id: '',
          address: '',
          position: '',
          role_id: '',
          start_time: '',
          end_time: '',
          dob: '',
          salary: '',
          profileimg: null,
        });
      } else {
        if (result.data) {
          let errorMessages = Object.values(result.data).flat().join('\n');

          alert(errorMessages);
        } else {
          alert(result.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    }
  };

  // Only positions that are Active + isActive show up as selectable
  // options on the Employee form
  const selectablePositions = positions.filter(
    (p) => p.islotlog === 'Active' && (p.isActive === true || p.isActive === 1)
  );

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="form-header">
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/admin/emp-list')}
          >
            <FiArrowLeft /> Back
          </button>
          <h2 className="form-title">Employee Registration</h2>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          {/* NAME */}

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* EMPID */}

          <div className="form-group">
            <label>Employee ID</label>
            <input
              type="text"
              name="empid"
              value={formData.empid}
              onChange={handleChange}
              required
            />
          </div>

          {/* EMAIL */}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* MOBILE */}

          <div className="form-group">
            <label>Mobile</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              pattern="\d{10}"
              required
            />
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              required
            />
          </div>

          {/* PASSWORD */}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* CONFIRM PASSWORD */}

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="c_password"
              value={formData.c_password}
              onChange={handleChange}
              required
            />

            {passwordError && (
              <span className="error-text">{passwordError}</span>
            )}
          </div>

          {/* POSITION */}

          <div className="form-group">
            <label>Position</label>

            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
            >
              <option value="">
                {loadingPositions ? 'Loading...' : 'Select Position'}
              </option>

              {selectablePositions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.position_name}
                </option>
              ))}
            </select>
          </div>

          {/* ROLE */}

          <div className="form-group">
            <label>Role</label>

            <select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              required
            >
              <option value="">
                {loadingRoles ? 'Loading...' : 'Select Role'}
              </option>

              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {/* COMPANY */}

          <div className="form-group">
            <label>Company</label>

            <select
              name="company_id"
              value={formData.company_id}
              onChange={handleChange}
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

          {/* BRANCH */}

          <div className="form-group">
            <label>Branch</label>

            <select
              name="branch_id"
              value={formData.branch_id}
              onChange={handleChange}
              disabled={!formData.company_id}
              required
            >
              <option value="">
                {loadingBranches ? 'Loading...' : 'Select Branch'}
              </option>

              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* SALARY */}
          <div className="form-group">
            <label>Salary</label>
            <input
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* START TIME */}

          <div className="form-group">
            <label>Start Time</label>
            <input
              type="time"
              step="1"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
            />
          </div>

          {/* END TIME */}

          <div className="form-group">
            <label>End Time</label>
            <input
              type="time"
              step="1"
              name="end_time"
              value={formData.end_time}
              min={formData.start_time}
              onChange={handleChange}
              required
            />
          </div>

          {/* ADDRESS */}

          <div className="form-group full-width">
            <label>Address</label>

            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              required
            ></textarea>
          </div>

          {/* PROFILE IMAGE */}

          <div className="form-group full-width">
            <label>Profile Image</label>

            <input
              type="file"
              name="profileimg"
              accept="image/*"
              onChange={handleChange}
            />
          </div>

          {/* SUBMIT */}

          <div className="form-actions full-width">
            <button type="submit" className="submit-btn">
              Register Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;