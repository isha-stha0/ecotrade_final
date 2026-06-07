import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../api/api';
import {
  Loader2,
  Calendar,
  FileText,
  ChevronRight,
  Plus,
  Award,
  Download,
  Clock,
  Mail,
  Settings,
  Trash2,
  Play,
} from 'lucide-react';
import {
  BarChartComponent,
  LineChartComponent,
  PieChartComponent,
  AreaChartComponent,
  StatisticCard,
} from '../components/AdvancedCharts';
import { exportReportToCSV } from '../utils/robustCSVExport';

const Reports = () => {
  // Report data states
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for creating a new report
  const [reportType, setReportType] = useState('scrap_summary');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Scheduled reports states
  const [scheduledReports, setScheduledReports] = useState([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedulerLoading, setSchedulerLoading] = useState(false);

  // Scheduled report form
  const [scheduleFormData, setScheduleFormData] = useState({
    title: '',
    report_type: 'scrap_summary',
    schedule_type: 'daily',
    cron_pattern: '0 9 * * *',
    execution_time: '09:00',
    date_range_type: 'last_30_days',
    recipients: '',
    include_csv_attachment: true,
    include_charts: true,
  });

  // Selected report details inspector
  const [selectedReport, setSelectedReport] = useState(null);
  const [schedulerStatus, setSchedulerStatus] = useState(null);

  // Tab view
  const [activeTab, setActiveTab] = useState('manual'); // manual, scheduled

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReports();
      setReports(res || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchReports();
    })();
    return () => {
      mounted = false;
    };
  }, [fetchReports]);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        report_type: reportType,
        title: title || undefined,
        date_range_start: startDate || undefined,
        date_range_end: endDate || undefined,
      };
      const newRep = await adminAPI.generateReport(payload);
      setReports([newRep, ...reports]);
      setSelectedReport(newRep);
      setTitle('');
      setStartDate('');
      setEndDate('');
    } catch (err) {
      console.error('Error generating report:', err);
      alert(err.response?.data?.message || 'Error occurred while generating analytics report.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (selectedReport) {
      const success = exportReportToCSV(
        selectedReport.data,
        selectedReport.title || 'report'
      );
      if (success) {
        alert('Report exported successfully!');
      } else {
        alert('Error exporting report');
      }
    }
  };

  const renderReportData = (report) => {
    const data = report.data || {};
    
    switch (report.report_type) {
      case 'scrap_summary':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Pickup records captured between {new Date(data.start).toLocaleDateString()} and {new Date(data.end).toLocaleDateString()}.
            </span>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Submissions</th>
                    <th>Total Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stats?.length > 0 ? (
                    data.stats.map((row, i) => (
                      <tr key={i}>
                        <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{row._id || 'pending'}</td>
                        <td>{row.count}</td>
                        <td>{row.total_weight || 0} kg</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8' }}>No scraps submitted in slot.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'sales_summary':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Sales checkout revenues captured between {new Date(data.start).toLocaleDateString()} and {new Date(data.end).toLocaleDateString()}.
            </span>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order Status</th>
                    <th>Transactions</th>
                    <th>Revenues</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stats?.length > 0 ? (
                    data.stats.map((row, i) => (
                      <tr key={i}>
                        <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{row._id || 'pending'}</td>
                        <td>{row.count}</td>
                        <td style={{ color: '#10b981', fontWeight: 700 }}>Rs. {row.total_revenue || 0}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8' }}>No sales orders in slot.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'user_activity':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-main)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="card" style={{ background: 'var(--bg-card)', padding: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>New Signups In Period:</span>
                <h3 style={{ fontSize: '1.75rem', margin: '0.5rem 0 0 0' }}>{data.new_users_count || 0}</h3>
              </div>
              <div className="card" style={{ background: 'var(--bg-card)', padding: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Active Users in System:</span>
                <h3 style={{ fontSize: '1.75rem', margin: '0.5rem 0 0 0' }}>{data.total_active_users || 0}</h3>
              </div>
            </div>
          </div>
        );

      case 'collector_performance':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Collector ID</th>
                    <th>Assigned Jobs</th>
                    <th>Completions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stats?.length > 0 ? (
                    data.stats.map((row, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{row._id}</td>
                        <td>{row.total_assignments}</td>
                        <td>{row.completed}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8' }}>No dispatcher metrics in slot.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'recycling_impact':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              borderRadius: '12px',
              padding: '1.25rem'
            }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '12px', color: '#10b981' }}>
                <Award size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Environmental Saving</span>
                  <h3 style={{ fontSize: '1.75rem', margin: 0, color: 'var(--primary)' }}>
                  {data.total_kg_recycled || 0} kg Recycled
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Successfully processed through {data.total_completed_requests || 0} pickup requests!
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return <pre style={{ color: '#94a3b8', fontSize: '0.85rem', overflowX: 'auto' }}>{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Analytics & Reports</h1>
        <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Request custom aggregation logs and inspect system performance audits</p>
      </div>

      {/* Reports workspace layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.8fr',
        gap: '1.5rem'
      }} className="reports-layout">
        
        {/* Left: Generator Panel + History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Generator card */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} style={{ color: '#10b981' }} /> Generate Custom Report
            </h3>
            <form onSubmit={handleGenerateReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group">
                <label className="form-label">Report Category</label>
                <select
                  className="form-control"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  disabled={actionLoading}
                >
                  <option value="scrap_summary">Scrap Pickup Distribution</option>
                  <option value="sales_summary">Store Revenues Summary</option>
                  <option value="user_activity">User Registry Audits</option>
                  <option value="collector_performance">Collector Performance</option>
                  <option value="recycling_impact">Environmental Sustainability Impact</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Custom Title (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Q2 Sustainability Report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={actionLoading}
              >
                {actionLoading ? 'Compiling Metrics...' : 'Compile Report Log'}
              </button>

            </form>
          </div>

          {/* History card list */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Previous Report Logs</h3>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
                <Loader2 size={24} className="animate-spin" style={{ color: '#10b981' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {reports.length > 0 ? (
                  reports.map((rep) => {
                    const isSelected = selectedReport?._id === rep._id;
                    return (
                      <div
                        key={rep._id}
                        onClick={() => setSelectedReport(rep)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: `1px solid ${isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)'}`,
                          background: isSelected ? 'rgba(16, 185, 129, 0.05)' : 'rgba(14,20,36,0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        className="report-history-item"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                          <FileText size={18} style={{ color: isSelected ? '#10b981' : '#94a3b8', flexShrink: 0 }} />
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ 
                              fontSize: '0.85rem', 
                              fontWeight: 600, 
                              color: isSelected ? '#ffffff' : '#e2e8f0',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{rep.title || 'Analytics Log'}</span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              {new Date(rep.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} style={{ color: '#94a3b8' }} />
                      </div>
                    );
                  })
                ) : (
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    No reports generated yet.
                  </span>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right: Detailed Inspector display */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '400px' }}>
          {selectedReport ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Info Header */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{selectedReport.title || 'Analytics Snapshot'}</h2>
                  <button
                    onClick={handleExportCSV}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                    title="Export as CSV"
                  >
                    <Download size={16} />
                    CSV
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} />
                    <span>Compiled: {new Date(selectedReport.createdAt).toLocaleString()}</span>
                  </div>
                  <span>Compiled By: <strong>{selectedReport.generated_by?.full_name || 'System Administrator'}</strong></span>
                </div>
              </div>

              {/* Data Render Body */}
              <div>
                {renderReportData(selectedReport)}
              </div>

            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexGrow: 1,
              color: '#94a3b8',
              gap: '0.75rem',
              textAlign: 'center'
            }}>
              <FileText size={48} style={{ opacity: 0.3 }} />
              <div>
                <h4 style={{ margin: 0, color: '#ffffff' }}>No Report Selected</h4>
                <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                  Choose a previously compiled log from the history catalog or submit a configuration query to compile a new audit report.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      <style>{`
        .report-history-item:hover {
          border-color: rgba(16, 185, 129, 0.15) !important;
          background: rgba(16, 185, 129, 0.03) !important;
        }
        @media (max-width: 900px) {
          .reports-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;
