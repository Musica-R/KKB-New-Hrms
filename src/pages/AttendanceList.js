
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/AttendanceList.css';
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Lottie from "lottie-react";
import animationData from "../LottieFiles/Completing Tasks.json";

// ---------------- API ENDPOINTS ----------------
const COMPANY_API = "https://storekkb.mpdatahub.com/api/list-company";
const BRANCH_API = "https://storekkb.mpdatahub.com/api/get-branch-for-company?company_id=";
const POSITION_API = "https://storekkb.mpdatahub.com/api/positions";

const ATTENDANCE_PRESENT_API = "https://storekkb.mpdatahub.com/api/attendance-List-branch";
const ATTENDANCE_ABSENT_API = "https://storekkb.mpdatahub.com/api/attendance-List-absent-branch";

const EMPLOYEE_LIST_BY_BRANCH_API = "https://storekkb.mpdatahub.com/api/employee-list-by-branch?branch_id=";

const MONTHLY_SUMMARY_ADMIN_API = "https://storekkb.mpdatahub.com/api/get-Monthly-Summary-admin";

const EMP_PER_PAGE = 2; // employees shown per page inside the monthly report popup

const AttendanceList = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Company / Branch (drives both the daily list & the monthly modal)
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [position, setPosition] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');

  // Modal - employee monthly report
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState(''); // '' | 'all' | <user_id>
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState([]); // always an array of { user_id, empid, name, attendance: [...] }
  const [reportLoading, setReportLoading] = useState(false);
  const [reportPage, setReportPage] = useState(0);

  const [userType, setUserType] = useState('present');
  // 'present' | 'absent'

  const now = new Date();

  const [dateFilter, setDateFilter] = useState(now.toISOString().split('T')[0]);

  const handleDate = (e) => {
    const { value } = e.target;
    setDateFilter(value);
  };

  /* ---------------- INITIAL LOAD: companies ---------------- */

  useEffect(() => {
    fetchCompanies();
    fetchPosition();
  }, []);

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
      console.error(err);
      setLoading(false);
    }
  };

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
      console.error(err);
      setLoading(false);
    }
  };

  const fetchPosition = async () => {
    try {
      const res = await fetch(POSITION_API);
      const json = await res.json();

      if (json.status) {
        setPosition(json.data);
        if (json.data.length > 0) {
          setSelectedPosition(json.data[0].id);
        } else if (json.data.length === 0) {
          setSelectedPosition('');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    setSelectedCompany(companyId);
    setSelectedBranch('');
    setBranches([]);
    setAttendanceData([]);
    fetchBranches(companyId, true);
  };

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
  };

  const handlePositionChange = (e) => {
    setSelectedPosition(e.target.value);
  };

  /* ---------------- DAILY ATTENDANCE LIST (branch + company wise) ---------------- */

  useEffect(() => {
    if (!selectedBranch) {
      setAttendanceData([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let timeoutId;

    const fetchAttendance = async () => {
      try {
        const baseUrl =
          userType === 'present' ? ATTENDANCE_PRESENT_API : ATTENDANCE_ABSENT_API;

        const url = `${baseUrl}?branch_id=${selectedBranch}&date=${dateFilter}&position=${selectedPosition}`;

        const response = await fetch(url);
        const result = await response.json();

        if (isMounted && result.success && result.data) {
          setAttendanceData(result.data);
          setLoading(false);
        } else if (isMounted) {
          setAttendanceData([]);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      } finally {
        if (isMounted) {
          timeoutId = setTimeout(fetchAttendance, 10000);
        }
      }
    };

    setLoading(true);
    fetchAttendance();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [dateFilter, userType, selectedBranch, selectedPosition]);

  /* ---------------- EMPLOYEE LIST FOR MODAL (branch wise) ---------------- */

  const fetchEmployeesForBranch = async (branchId) => {
    try {
      const res = await fetch(`${EMPLOYEE_LIST_BY_BRANCH_API}${branchId}`);
      const data = await res.json();

      if (data.success) {
        setEmployees(data.data);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error(err);
      setEmployees([]);
    }
  };

  /* ---------------- MONTHLY REPORT (admin, branch wise, supports "all") ---------------- */

  const fetchMonthlyReport = async () => {
    if (!selectedBranch) return alert("Select a branch first");
    if (!selectedUser) return alert("Select Employee");

    setReportLoading(true);
    setReportPage(0);

    try {
      const res = await fetch(
        `${MONTHLY_SUMMARY_ADMIN_API}?user_id=${selectedUser}&month=${month}&year=${year}&branch_id=${selectedBranch}`
      );

      const data = await res.json();

      if (data.success) {
        // Normalize response: could be a single employee object or an array of employees.
        const employeesData = Array.isArray(data.data) ? data.data : [data.data];
        setReport(employeesData);
      } else {
        setReport([]);
      }
    } catch (err) {
      console.error(err);
      setReport([]);
    }

    setReportLoading(false);
  };

  const totalReportPages = Math.max(1, Math.ceil(report.length / EMP_PER_PAGE));

  const paginatedReport = report.slice(
    reportPage * EMP_PER_PAGE,
    reportPage * EMP_PER_PAGE + EMP_PER_PAGE
  );

  const goPrevReportPage = () => setReportPage((p) => Math.max(0, p - 1));
  const goNextReportPage = () =>
    setReportPage((p) => Math.min(totalReportPages - 1, p + 1));

  /* ---------------- EXCEL EXPORT ---------------- */

  const exportToExcel = (data, fileName) => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    // Convert JSON → Sheet
    const ws = XLSX.utils.json_to_sheet(data, { origin: "A3" });

    // Add Company Title (Row 1)
    XLSX.utils.sheet_add_aoa(ws, [["AYYA-STORE"]], { origin: "A1" });

    // Add empty row (spacing)
    XLSX.utils.sheet_add_aoa(ws, [[""]], { origin: "A2" });

    // Get column count
    const colCount = Object.keys(data[0] || {}).length;

    // Merge title across columns
    ws["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: colCount - 1 },
      },
    ];

    // Title Style
    ws["A1"].s = {
      font: {
        bold: true,
        sz: 16,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    };

    // Header Style (Row 3)
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 2, c: col });

      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true },
          alignment: { horizontal: "center" },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      }
    }

    // Center align all data
    for (let row = 3; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            alignment: {
              horizontal: "center",
            },
          };
        }
      }
    }

    // Set column width
    ws["!cols"] = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    // Export file
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const exportDailyReport = () => {
    const formatted = attendanceData.map((item) => ({
      Name: item.name,
      Branch: item.branch_name,
      Date: item.attendance_date,
      CheckIn: item.check_in,
      CheckOut: item.check_out,
      Status: item.type,
      WorkedHours: item.worked_hours,
    }));

    exportToExcel(formatted, "Daily_Attendance_Report");
  };

  const exportMonthlyReport = () => {
    const rows = [];

    report.forEach((emp) => {
      (emp.attendance || []).forEach((r) => {
        rows.push({
          Employee: emp.name,
          EmpID: emp.empid,
          Date: r.date,
          Day: r.day,
          CheckIn: r.check_in,
          CheckOut: r.check_out,
          Status: r.type,
        });
      });
    });

    exportToExcel(rows, "Monthly_Attendance_Report");
  };

  /* ---------------- PDF EXPORT ---------------- */
  /* Requires: npm install jspdf jspdf-autotable */

  const exportDailyReportPDF = () => {
    if (attendanceData.length === 0) {
      alert("No data to export");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("AYYA-STORE", 14, 15);
    doc.setFontSize(11);
    doc.text(`Daily Attendance Report - ${dateFilter}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Name", "Branch", "Date", "Check In", "Check Out", "Status", "Worked Hours"]],
      body: attendanceData.map((item) => [
        item.name,
        item.branch_name,
        item.attendance_date,
        formatTime(item.check_in),
        formatTime(item.check_out),
        item.type,
        item.worked_hours,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 14, right: 14 },
    });

    doc.save("Daily_Attendance_Report.pdf");
  };

  const exportMonthlyReportPDF = () => {
    if (report.length === 0) {
      alert("No data to export");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("AYYA-STORE", 14, 15);
    doc.setFontSize(11);
    doc.text(`Monthly Attendance Report - ${month}/${year}`, 14, 22);

    let startY = 30;

    report.forEach((emp) => {
      if (startY > 260) {
        doc.addPage();
        startY = 15;
      }

      doc.setFontSize(11);
      doc.text(`${emp.name} (${emp.empid})`, 14, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [["Date", "Day", "Check In", "Check Out", "Status"]],
        body: (emp.attendance || []).map((r) => [
          r.date,
          r.day,
          formatTime(r.check_in),
          formatTime(r.check_out),
          r.type,
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: 14, right: 14 },
      });

      startY = doc.lastAutoTable.finalY + 12;
    });

    doc.save("Monthly_Attendance_Report.pdf");
  };

  // FORMAT TIME
  const formatTime = (timeString) => {
    if (
      !timeString ||
      timeString === '00:00:00' ||
      timeString === '00:00' ||
      timeString === '0:0' ||
      timeString === '-:--:--' ||
      timeString.includes('0000')
    ) {
      return '--';
    }

    const [hour, minute] = timeString.split(':');
    let h = parseInt(hour, 10);

    if (isNaN(h)) return '--';

    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;

    return `${h}:${minute} ${ampm}`;
  };

  // FORMAT DATE
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const openModal = () => {
    setReport([]);
    setSelectedUser('');
    setReportPage(0);
    if (selectedBranch) {
      fetchEmployeesForBranch(selectedBranch);
    }
    setShowModal(true);
  };

  // GET USER INITIALS
  const getInitials = (name) => {
    if (!name) return 'UN';
    return name.substring(0, 2).toUpperCase();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setReport([]);
    setSelectedUser('');
    setReportPage(0);
    setMonth(new Date().getMonth() + 1);
    setYear(new Date().getFullYear());
  };

  // FORMAT WORKED HOURS
  const formatDuration = (timeString) => {
    if (!timeString || timeString === '00:00:00') return '--';

    const [hours, minutes] = timeString.split(':').map(Number);

    if (hours === 0 && minutes === 0) return '--';

    if (hours === 0) {
      return `${minutes} min`;
    }

    if (minutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${minutes} min`;
  };

  /* ---------------- GROUP BY BRANCH ---------------- */
  const groupByBranch = (list) => {
    const groups = {};

    list.forEach((record) => {
      const key = record.branch_id ?? 'unassigned';

      if (!groups[key]) {
        groups[key] = {
          branch_id: record.branch_id,
          branch_name: record.branch_name || 'Unassigned Branch',
          items: [],
        };
      }
      groups[key].items.push(record);
    });

    return Object.values(groups);
  };

  const renderAttendanceRow = (record, index) => (
    <tr key={`${record.name}-${record.attendance_date}-${index}`} className="table-row">
      {/* EMPLOYEE */}
      <td>
        <div className="employee-cell">
          <div className="avatar-circle">
            {getInitials(record.name)}
          </div>

          <span className="employee-name">{record.name}</span>
        </div>
      </td>

      {/* DATE */}
      <td>{formatDate(record.attendance_date)}</td>

      {/* CHECK IN */}
      <td>
        <div className="time-badge in">
          {record.type === 'ABSENT'
            ? '--'
            : formatTime(record.check_in)}
        </div>
      </td>

      {/* CHECK OUT */}
      <td>
        <div className="time-badge out">
          {record.type === 'ABSENT'
            ? '--'
            : formatTime(record.check_out)}
        </div>
      </td>

      {/* STATUS */}
      <td>
        <div className="status-flex">
          <span
            className={`status-pill ${record.type?.toLowerCase() === 'present'
              ? 'present'
              : 'absent'
              }`}
          >
            {record.type || 'N/A'}
          </span>

          {record.late_checkin === 1 && (
            <span
              className="late-indicator"
              title={`Late by ${record.late_checkin_time}`}
            >
              Late
            </span>
          )}
        </div>
      </td>
      <td>
        {record.late_checkin === 1
          ? formatDuration(record.late_checkin_time)
          : '--'}
      </td>

      {/* WORKED HOURS */}
      <td>
        <span className="hours-text">
          {formatDuration(record.worked_hours)}
        </span>
      </td>

      {/* SHORTFALL / OVERTIME */}
      <td>
        <span className="hours-text">
          {formatDuration(record.overtimed_hours)}
        </span>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="attendance-page loading-container">
        <div className="loader-pulse"></div>
        <p>Loading attendance records...</p>
      </div>
    );
  }

  return (
    <div className="attendance-page fade-in-up">
      {/* HEADER */}
      <div className="page-header glass-panel">
        <div className="header-content">
          <div className="permission-title-group">
            <Lottie animationData={animationData} loop={true} style={{ width: 70, height: 70 }} />
            <div>
              <h1>Attendance Records</h1>
              <p>Track and manage employee daily presence and work hours.</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="stat-badge">
              <span className="badge-label">Records</span>
              <span className="badge-value">{attendanceData.length}</span>
            </div>
          </div>
        </div>
        <br />
        <div className="header-actions">
          <button className="primary-btn" onClick={exportDailyReport}>
            Download Daily Excel
          </button>

          <button className="pdf-btn" onClick={exportDailyReportPDF}>
            Download Daily PDF
          </button>

          <button className="success-btn" onClick={openModal}>
            Monthly Report
          </button>
        </div>
      </div>

      {/* FILTER BAR — Company / Branch / Position / Date (replaces old inline-styled flex row) */}
      <div className="filter-bar">
        {/* COMPANY */}
        <div className="form-group">
          <label>Company</label>
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
        </div>

        {/* BRANCH */}
        <div className="form-group">
          <label>Branch</label>
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

        {/* POSITION */}
        <div className="form-group">
          <label>Position</label>
          <select
            className="branch-select"
            value={selectedPosition}
            onChange={handlePositionChange}
          // disabled={position.length === 0}
          >
            <option value="" disabled>
              Select Position
            </option>
            {position.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.position_name}
              </option>
            ))}
          </select>
        </div>

        {/* DATE */}
        <div className="form-group">
          <label>Date Filter</label>
          <input
            type="date"
            name="attendance_date"
            value={dateFilter}
            onChange={handleDate}
            required
          />
        </div>
      </div>

      <div className="attendance-toggle">

        <button
          className={userType === 'present' ? 'active-toggle' : ''}
          onClick={() => {
            setUserType('present');
            setLoading(true);
          }}
        >
          Employee Check-in List
        </button>

        <button
          className={userType === 'absent' ? 'active-toggle' : ''}
          onClick={() => {
            setUserType('absent');
            setLoading(true);
          }}
        >
          Employee Non Check-in List
        </button>

      </div>

      {/* TABLES GROUPED BY BRANCH */}
      {!selectedBranch ? (
        <div className="attendance-content glass-panel">
          <div className="table-responsive">
            <table className="elegant-table">
              <tbody>
                <tr>
                  <td className="empty-state">
                    Select a company and branch to view attendance.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : attendanceData.length === 0 ? (
        <div className="attendance-content glass-panel">
          <div className="table-responsive">
            <table className="elegant-table">
              <tbody>
                <tr>
                  <td className="empty-state">
                    No attendance records found for this period.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        groupByBranch(attendanceData).map((group) => (
          <div className="branch-section" key={group.branch_id ?? 'unassigned'}>

            <div className="attendance-content glass-panel">
              <div className="table-responsive">
                <table className="elegant-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                      <th>Late By</th>
                      <th>Worked Hours</th>
                      <th>Shortfall / Overtime</th>
                    </tr>
                  </thead>

                  <tbody>
                    {group.items.map((record, index) => renderAttendanceRow(record, index))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}

      {showModal && createPortal(
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-box modal-box--monthly" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h2>Monthly Attendance Report</h2>
              <button onClick={handleCloseModal}>✕</button>
            </div>

            <div className="modal-filters">

              {/* Employee */}
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select Employee</option>
                <option value="all">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.empid})
                  </option>
                ))}
              </select>

              {/* Month */}
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>

              {/* Year */}
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />

              <button className="primary-btn" onClick={fetchMonthlyReport} disabled={reportLoading}>
                {reportLoading ? 'Loading...' : 'Get Report'}
              </button>

              <button className="success-btn" onClick={exportMonthlyReport}>
                Excel
              </button>

              <button className="pdf-btn" onClick={exportMonthlyReportPDF}>
                PDF
              </button>
            </div>

            {/* Fixed-height scroll area so the popup never grows with the data */}
            <div className="modal-table modal-table--fixed">
              {reportLoading ? (
                <div className="modal-loading">Loading report...</div>
              ) : report.length === 0 ? (
                <div className="modal-empty">No data available</div>
              ) : (
                paginatedReport.map((emp) => (
                  <div key={emp.user_id ?? emp.empid} className="monthly-emp-block">
                    <div className="monthly-emp-header">
                      <span className="monthly-emp-name">{emp.name}</span>
                      <span className="monthly-emp-id">{emp.empid}</span>
                    </div>

                    <div className="monthly-emp-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Day</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {(emp.attendance || []).map((r, i) => (
                            <tr key={i}>
                              <td>{r.date}</td>
                              <td>{r.day}</td>
                              <td>{formatTime(r.check_in)}</td>
                              <td>{formatTime(r.check_out)}</td>
                              <td>{r.type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination stays outside the scroll area, so the popup height never shifts */}
            {report.length > EMP_PER_PAGE && (
              <div className="modal-pagination">
                <button onClick={goPrevReportPage} disabled={reportPage === 0}>
                  ‹ Prev
                </button>
                <span>
                  Page {reportPage + 1} of {totalReportPages}
                </span>
                <button
                  onClick={goNextReportPage}
                  disabled={reportPage >= totalReportPages - 1}
                >
                  Next ›
                </button>
              </div>
            )}

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AttendanceList;