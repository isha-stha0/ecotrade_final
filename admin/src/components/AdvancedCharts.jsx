import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

/**
 * BarChart Component - Display categorical data with bars
 */
export const BarChartComponent = ({ data, dataKey, nameKey = '_id', height = 300, colors = ['#10b981'] }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey={nameKey}
          stroke="#94a3b8"
          style={{ fontSize: '0.8rem' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#94a3b8" style={{ fontSize: '0.8rem' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#e2e8f0',
          }}
          cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8' }} />
        <Bar dataKey={dataKey} fill={colors[0]} radius={[8, 8, 0, 0]} name={dataKey} />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * LineChart Component - Display trends over time
 */
export const LineChartComponent = ({ data, dataKey, nameKey = 'date', height = 300, colors = ['#6366f1'] }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey={nameKey}
          stroke="#94a3b8"
          style={{ fontSize: '0.8rem' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#94a3b8" style={{ fontSize: '0.8rem' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '8px',
            color: '#e2e8f0',
          }}
          cursor={{ stroke: 'rgba(99, 102, 241, 0.2)' }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8' }} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={colors[0]}
          dot={{ fill: colors[0], r: 4 }}
          activeDot={{ r: 6 }}
          name={dataKey}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * PieChart Component - Display part-to-whole relationships
 */
export const PieChartComponent = ({ data, dataKey = 'count', nameKey = '_id', height = 300 }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No data available</div>;
  }

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#0ea5e9', '#ec4899', '#8b5cf6', '#f97316', '#14b8a6'];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, value }) => `${name}: ${value}`}
          labelStyle={{ fontSize: '0.75rem', fill: '#e2e8f0' }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#e2e8f0',
          }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

/**
 * AreaChart Component - Display stacked area data
 */
export const AreaChartComponent = ({ data, dataKeys, nameKey = 'date', height = 300 }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No data available</div>;
  }

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#0ea5e9', '#ec4899'];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey={nameKey}
          stroke="#94a3b8"
          style={{ fontSize: '0.8rem' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#94a3b8" style={{ fontSize: '0.8rem' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#e2e8f0',
          }}
          cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8' }} />
        {dataKeys.map((key, idx) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="1"
            stroke={COLORS[idx % COLORS.length]}
            fill={COLORS[idx % COLORS.length]}
            opacity={0.6}
            name={key}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

/**
 * StatisticCard Component - Display a single statistic
 */
export const StatisticCard = ({ label, value, icon: Icon, color = '#10b981', trend = null }) => {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {trend && (
            <span style={{ fontSize: '0.85rem', color: trend > 0 ? '#10b981' : '#ef4444' }}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          background: `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.1)`,
          color: color,
          padding: '1rem',
          borderRadius: '12px',
        }}
      >
        <Icon size={24} />
      </div>
    </div>
  );
};

export default {
  BarChartComponent,
  LineChartComponent,
  PieChartComponent,
  AreaChartComponent,
  StatisticCard,
};
