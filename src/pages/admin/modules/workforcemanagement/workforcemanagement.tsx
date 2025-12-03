import { useNavigate } from "react-router-dom";
import { getEncryptedRoute } from "@/utils/routeCache";
import "./workforcemanagement.css";

const stats = [
  { label: "Ticket", value: "9856", icon: "doc" },
  { label: "Tons", value: "5,901.750", icon: "scale" },
];

const reports = [
  { label: "Day Wise Report", type: "day" as const },
  { label: "Date Wise Report", type: "date" as const },
];

export default function WorkforceManagement() {
  const navigate = useNavigate();
  const { encWorkforceManagement, encDateReport, encDayReport } = getEncryptedRoute();

  const handleReportClick = (type: "day" | "date") => {
    if (type === "date") {
      navigate(`/${encWorkforceManagement}/${encDateReport}`);
      return;
    }
    navigate(`/${encWorkforceManagement}/${encDayReport}`);
  };

  return (
    <div className="wf-shell">
      <div className="wf-content">
        <div className="wf-left-col">
          <section className="wf-section">
            <h2>Input Waste Statistics</h2>
            <div className="wf-stat-grid">
              {stats.map((stat) => (
                <article key={stat.label}>
                  <span className={`icon-${stat.icon}`} aria-hidden="true" />
                  <p className="label">{stat.label}</p>
                  <p className="value">{stat.value}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="wf-section">
            <h2>Reports</h2>
            <div className="wf-report-grid">
              {reports.map((report) => (
                <article key={report.label} onClick={() => handleReportClick(report.type)}>
                  <span className="icon-report" aria-hidden="true" />
                  <p className="label">{report.label}</p>
                  <p className="cta">Click Here</p>
                </article>
              ))}
            </div>
          </section>

          <section className="wf-section">
            <h2>Multimedia</h2>
            <article className="wf-media-card">
              <span className="icon-media" aria-hidden="true" />
              <div>
                <p className="label">Plant</p>
                <p className="cta">Live Stream</p>
              </div>
            </article>
          </section>

          <footer className="wf-footer">Copyright © 2024-2025 ZIGMA</footer>
        </div>

        <div className="wf-right-col">
          <div className="wf-map-card">
            <div className="wf-logo">
              <div className="emblem-circle" />
              <div className="emblem-leaf-green" />
            </div>
            <div className="wf-map">
              <svg viewBox="0 0 400 360" role="presentation">
                <path
                  d="M50 320l20-60 40-30 10-40 45-25 10-30 45-25 40-10 15-40 50-20 30 10 10 45-20 50 10 20 20-5 5 30-25 45-40 15-20 40-35 15-20-5-40 25-30-10-40 20-30-40z"
                  fill="#e8f7df"
                  stroke="#45a047"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                <circle cx="150" cy="160" r="10" fill="#e32" />
              </svg>
            </div>
            <div className="wf-region">
              <p>UTTAR PRADESH</p>
              <p>उत्तर प्रदेश</p>
            </div>
            <p className="wf-rights">All Rights Reserved.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
