import React, { useState } from "react";
import "./DailyRoster.css";

const employees = ["Yash", "Rahul", "Akash", "Rajan", "Neeraj", "Shubham"];

// November 2026 roster (from your screenshot)
const roster = {
  "2026-11-01": ["OFF", "OFF", "Night", "Day 3", "Day 2", "OFF"],
  "2026-11-02": ["Night", "Day 2", "OFF", "Day 2", "OFF", "Day 3"],
  "2026-11-03": ["Night", "Day 2", "OFF", "Day 2", "OFF", "Day 3"],
  "2026-11-04": ["Night", "Day 2", "Day 2", "OFF", "Day 3", "OFF"],
  "2026-11-05": ["Night", "OFF", "Day 2", "OFF", "Day 3", "Day 2"],
  "2026-11-06": ["Night", "OFF", "Day 2", "Day 3", "OFF", "Day 2"],
  "2026-11-07": ["OFF", "Night", "OFF", "Day 3", "Day 2", "OFF"],
  "2026-11-08": ["OFF", "Night", "OFF", "Day 2", "Day 1", "OFF"],
  "2026-11-09": ["Day 2", "Night", "Day 2", "OFF", "OFF", "Day 3"],
  "2026-11-10": ["Day 2", "Night", "Leave", "OFF", "Day 2", "Day 3"],
  "2026-11-11": ["Leave", "Night", "Day 2", "Day 3", "Day 1", "OFF"],
  "2026-11-12": ["Leave", "OFF", "Day 2", "Night", "OFF", "Day 3"],
  "2026-11-13": ["Leave", "Day 3", "OFF", "Night", "OFF", "Day 2"],
  "2026-11-14": ["Leave", "Day 3", "Day 2", "Night", "Leave", "OFF"],
  "2026-11-15": ["Leave", "OFF", "Day 3", "Night", "Leave", "Day 2"],
  "2026-11-16": ["Leave", "Day 3", "Day 2", "Night", "Leave", "Day 2"],
  "2026-11-17": ["OFF", "Day 2", "Day 3", "OFF", "Leave", "Night"],
  "2026-11-18": ["OFF", "Day 2", "Day 3", "OFF", "Leave", "Night"],
  "2026-11-19": ["Day 2", "OFF", "OFF", "Day 3", "Leave", "Night"],
  "2026-11-20": ["Day 2", "OFF", "OFF", "Day 2", "Day 3", "Night"],
  "2026-11-21": ["Day 2", "Day 2", "Day 3", "OFF", "OFF", "Night"],
  "2026-11-22": ["Day 2", "Day 2", "Day 3", "OFF", "Night", "OFF"],
  "2026-11-23": ["Day 3", "OFF", "OFF", "Day 2", "Night", "OFF"],
  "2026-11-24": ["OFF", "OFF", "Day 2", "Day 3", "Night", "Day 2"],
  "2026-11-25": ["OFF", "Day 2", "OFF", "Day 3", "Night", "Day 2"],
  "2026-11-26": ["Day 2", "Day 2", "OFF", "OFF", "Night", "Day 3"],
  "2026-11-27": ["OFF", "Day 2", "Night", "Day 3", "OFF", "Day 2"],
  "2026-11-28": ["Day 3", "Day 2", "Night", "OFF", "OFF", "OFF"],
  "2026-11-29": ["OFF", "OFF", "Night", "Day 2", "Day 3", "OFF"],
  "2026-11-30": ["OFF", "Day 2", "Night", "Day 2", "OFF", "Day 3"],
};

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getShiftClass(shift) {
  switch (shift) {
    case "OFF":
      return "shift-off";
    case "Leave":
      return "shift-leave";
    case "Night":
      return "shift-night";
    case "Day 1":
      return "shift-day1";
    case "Day 2":
      return "shift-day2";
    case "Day 3":
      return "shift-day3";
    default:
      return "shift-default";
  }
}

export default function DailyRoster() {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  const dailyShifts = roster[selectedDate];
  const isToday = selectedDate === getLocalDateString();

  const offCount = dailyShifts
    ? dailyShifts.filter((shift) => shift === "OFF").length
    : 0;

  const leaveCount = dailyShifts
    ? dailyShifts.filter((shift) => shift === "Leave").length
    : 0;

  const workingCount = dailyShifts
    ? dailyShifts.filter((shift) => shift !== "OFF" && shift !== "Leave").length
    : 0;

  const formattedDate = new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  function changeDate(days) {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + days);
    setSelectedDate(getLocalDateString(date));
  }

  return (
    <div className="roster-app">
      <div className="roster-header">
        <div className="roster-heading">
          <div className="roster-logo">📅</div>
          <div>
            <h1>Verification Team</h1>
            <p>Daily Shift Roster</p>
          </div>
        </div>

        {isToday && <span className="today-badge">● TODAY</span>}
      </div>

      <div className="roster-controls">
        <div className="date-input-group">
          <label htmlFor="rosterDate">Select Date</label>
          <input
            id="rosterDate"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="date-buttons">
          <button onClick={() => changeDate(-1)} className="nav-button">
            ← Previous
          </button>

          <button
            onClick={() => setSelectedDate(getLocalDateString())}
            className="today-button"
          >
            Today
          </button>

          <button onClick={() => changeDate(1)} className="nav-button">
            Next →
          </button>
        </div>
      </div>

      <div className="roster-date-title">
        <h2>{formattedDate}</h2>
        <p>Team schedule for selected date</p>
      </div>

      {dailyShifts ? (
        <>
          <div className="roster-stats">
            <div className="stat-card stat-working">
              <span className="stat-icon">👥</span>
              <div>
                <strong>{workingCount}</strong>
                <span>Working</span>
              </div>
            </div>

            <div className="stat-card stat-off">
              <span className="stat-icon">🏠</span>
              <div>
                <strong>{offCount}</strong>
                <span>OFF</span>
              </div>
            </div>

            <div className="stat-card stat-leave">
              <span className="stat-icon">📝</span>
              <div>
                <strong>{leaveCount}</strong>
                <span>Leave</span>
              </div>
            </div>
          </div>

          <div className="roster-grid">
            {employees.map((name, index) => {
              const shift = dailyShifts[index];

              return (
                <div className="employee-card" key={name}>
                  <div className="employee-name">{name}</div>
                  <div className={`employee-shift ${getShiftClass(shift)}`}>
                    {shift}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="roster-legend">
            <span><i className="legend-dot shift-day2" /> Day 2</span>
            <span><i className="legend-dot shift-day3" /> Day 3</span>
            <span><i className="legend-dot shift-night" /> Night</span>
            <span><i className="legend-dot shift-off" /> OFF</span>
            <span><i className="legend-dot shift-leave" /> Leave</span>
          </div>
        </>
      ) : (
        <div className="no-roster">
          <div className="no-roster-icon">📭</div>
          <h3>No roster found</h3>
          <p>
            No roster data is available for this date. Please select a date from
            November 2026.
          </p>
          <button
            className="today-button"
            onClick={() => setSelectedDate("2026-11-21")}
          >
            View November Roster
          </button>
        </div>
      )}
    </div>
  );
}
