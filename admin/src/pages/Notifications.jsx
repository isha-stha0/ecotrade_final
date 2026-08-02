import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationAPI } from '../api/api';

const formatDate = (value) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await notificationAPI.getMine()); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const unread = items.filter((item) => !item.is_read).length;
  return <div className="notifications-page">
    <div className="notifications-page-heading"><div><span className="directory-eyebrow">Activity centre</span><h1>All notifications</h1><p>Every order, pickup, and delivery update sent to your admin account.</p></div><button className="btn btn-primary" disabled={!unread} onClick={async () => { await notificationAPI.markAllRead(); await load(); }}><CheckCheck size={17} /> Mark all as read</button></div>
    <div className="notifications-summary"><Bell size={20} /><strong>{unread}</strong><span>unread notification{unread === 1 ? '' : 's'}</span></div>
    <div className="notifications-full-list">{loading ? <p className="text-muted">Loading notifications…</p> : items.length === 0 ? <div className="notification-empty"><Bell size={26} /><strong>No notifications yet</strong><span>New activity will appear here.</span></div> : items.map((item) => <button key={item._id} onClick={async () => { if (!item.is_read) { await notificationAPI.markRead(item._id); await load(); } }} className={`notification-full-item ${item.is_read ? '' : 'is-unread'}`}><span className="notification-item-dot" /><span><strong>{item.title}</strong><p>{item.message}</p><small>{formatDate(item.createdAt)}</small></span></button>)}</div>
  </div>;
}
