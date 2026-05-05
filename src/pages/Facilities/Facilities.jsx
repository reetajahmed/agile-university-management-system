import React, { useState, useEffect } from "react";
import { 
  getCurrentUser, getRooms, getBookings, getIssues, getEquipment,
  deleteRoom, deleteBooking, updateIssueStatus, deleteEquipment 
} from "./facilitiesService";
import { RoomsTab, BookingsTab, IssuesTab, EquipmentTab } from "./FacilitiesTabs";
import "../../styles/facilities.css";

export default function Facilities() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("rooms");
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [issues, setIssues] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [r, b, i, e] = await Promise.all([
        getRooms(), getBookings(), getIssues(), getEquipment()
      ]);
      setRooms(r);
      setBookings(b);
      setIssues(i);
      setEquipment(e);
    } catch (err) {
      console.error("Failed to load facilities data:", err);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { key: "rooms", label: "🏫 Rooms" },
    { key: "bookings", label: "📅 Bookings" },
    { key: "issues", label: "🔧 Issues" },
    ...(isAdmin ? [{ key: "equipment", label: "🖥️ Equipment" }] : []),
  ];

  return (
    <div className="fac-container">
      <div className="fac-header">
        <h1 className="fac-title">Facilities Management</h1>
        {currentUser && (
          <span style={{ fontSize: 13, color: "#6B7280", background: "#EFF6FF", padding: "6px 14px", borderRadius: 99, border: "1px solid #BFDBFE" }}>
            Logged in as: <strong style={{ color: "#2563EB" }}>{currentUser.name}</strong> ({currentUser.role})
          </span>
        )}
      </div>

      {!loading && (
        <div className="fac-stats">
          <div className="fac-stat-card">
            <div className="fac-stat-number">{rooms.length}</div>
            <div className="fac-stat-label">Total Rooms</div>
          </div>
          <div className="fac-stat-card">
            <div className="fac-stat-number">{bookings.length}</div>
            <div className="fac-stat-label">Bookings</div>
          </div>
          <div className="fac-stat-card">
            <div className="fac-stat-number" style={{ color: "#F59E0B" }}>
              {issues.filter(i => i.status === "Open").length}
            </div>
            <div className="fac-stat-label">Open Issues</div>
          </div>
          {isAdmin && (
            <div className="fac-stat-card">
              <div className="fac-stat-number" style={{ color: "#10B981" }}>{equipment.length}</div>
              <div className="fac-stat-label">Equipment Items</div>
            </div>
          )}
        </div>
      )}

      <div className="fac-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`fac-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="fac-loading">Loading facilities data...</div>
      ) : (
        <>
          {activeTab === "rooms" && (
            <RoomsTab rooms={rooms} currentUser={currentUser} isAdmin={isAdmin} onRefresh={loadAll} />
          )}
          {activeTab === "bookings" && (
            <BookingsTab bookings={bookings} currentUser={currentUser} isAdmin={isAdmin} onRefresh={loadAll} />
          )}
          {activeTab === "issues" && (
            <IssuesTab issues={issues} rooms={rooms} currentUser={currentUser} isAdmin={isAdmin} onRefresh={loadAll} />
          )}
          {activeTab === "equipment" && isAdmin && (
            <EquipmentTab equipment={equipment} rooms={rooms} isAdmin={isAdmin} onRefresh={loadAll} />
          )}
        </>
      )}
    </div>
  );
}