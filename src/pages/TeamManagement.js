import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave } from "react-icons/fi";
import "../styles/TeamManagement.css";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  /* ================= FETCH TEAMS ================= */

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/teams/team-list`);
      const data = await res.json();

      if (data.success) {
        setTeams(data.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  /* ================= MODAL HELPERS ================= */

  const openAddModal = () => {
    setEditingId(null);
    setTeamName("");
    setError("");
    setShowModal(true);
  };

  const openEditModal = (team) => {
    setEditingId(team.id);
    setTeamName(team.name);
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setTeamName("");
    setError("");
  };

  /* ================= ADD / UPDATE ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!teamName.trim()) {
      setError("Team name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = editingId
        ? `${BASE_URL}/teams/team-updte/${editingId}`
        : `${BASE_URL}/teams/team-store`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: teamName }),
      });

      const data = await res.json();

      if (res.ok) {
        closeModal();
        fetchTeams();
      } else {
        setError(data.message || "Error occurred");
      }
    } catch (err) {
      console.error(err);
      setError("Server error");
    }

    setSaving(false);
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete?")) return;

    try {
      const res = await fetch(`${BASE_URL}/teams/team-delete/${id}`);
      const data = await res.json();

      if (res.ok) {
        fetchTeams();
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="team-page">
      {/* HEADER: title on the left, Add Team button on top right */}
      <div className="team-header">
        <div className="team-title">
          <h1>Team Management</h1>
          <p>{teams.length} {teams.length === 1 ? "team" : "teams"}</p>
        </div>

        <button type="button" className="btn-add-team" onClick={openAddModal}>
          <FiPlus /> Add Team
        </button>
      </div>

      {/* LIST */}
      <div className="team-card">
        <div className="team-list">
          {loading ? (
            <p className="team-empty">Loading...</p>
          ) : teams.length === 0 ? (
            <p className="team-empty">No teams found</p>
          ) : (
            teams.map((team) => (
              <div key={team.id} className="team-item">
                <span className="team-name">{team.name}</span>

                <div className="actions">
                  <button
                    className="btn-team-edit"
                    onClick={() => openEditModal(team)}
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    className="btn-team-delete"
                    onClick={() => handleDelete(team.id)}
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="team-modal-overlay">
          <div className="team-modal-box">
            <div className="team-modal-header">
              <h2>{editingId ? "Edit Team" : "Add Team"}</h2>
              <button className="team-modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="team-modal-body">
                {error && <div className="team-modal-error">{error}</div>}

                <label>Team Name</label>
                <input
                  type="text"
                  placeholder="Enter team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="team-modal-footer">
                <button
                  type="button"
                  className="btn-team-cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-team-save" disabled={saving}>
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <FiSave /> {editingId ? "Update" : "Save"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;