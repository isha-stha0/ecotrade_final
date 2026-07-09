import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../api/api';
import {
  Archive,
  Battery,
  BookOpen,
  Box,
  Circle,
  Coins,
  Cpu,
  Edit,
  Factory,
  FileText,
  Leaf,
  Loader2,
  Package,
  Plus,
  Recycle,
  Search,
  Shirt,
  ShoppingBag,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Wine,
} from 'lucide-react';

const emptyForm = {
  name: '',
  description: '',
  points_per_kg: 10,
  price_per_kg: 0,
  icon_url: 'category',
  is_active: true,
};

const iconOptions = [
  { value: 'category', label: 'General', Icon: Package },
  { value: 'description', label: 'Paper', Icon: FileText },
  { value: 'recycling', label: 'Recycle', Icon: Recycle },
  { value: 'wine_bar', label: 'Glass', Icon: Wine },
  { value: 'inventory_2', label: 'Box / Metal', Icon: Box },
  { value: 'devices', label: 'Electronics', Icon: Cpu },
  { value: 'plastic', label: 'Plastic', Icon: Archive },
  { value: 'battery', label: 'Battery', Icon: Battery },
  { value: 'clothes', label: 'Clothes', Icon: Shirt },
  { value: 'phone', label: 'Phone', Icon: Smartphone },
  { value: 'books', label: 'Books', Icon: BookOpen },
  { value: 'bag', label: 'Bag', Icon: ShoppingBag },
  { value: 'leaf', label: 'Organic', Icon: Leaf },
  { value: 'factory', label: 'Industrial', Icon: Factory },
  { value: 'coins', label: 'High Value', Icon: Coins },
  { value: 'other', label: 'Other', Icon: Circle },
];

const getCategoryIcon = (value) => {
  return iconOptions.find((option) => option.value === value)?.Icon || Package;
};

const ScrapCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [iconSearch, setIconSearch] = useState('');
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', ms = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((items) => [...items, { id, message, type }]);
    setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), ms);
  };

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getScrapCategories();
      setCategories(data.categories || data || []);
    } catch (err) {
      console.error('Failed to fetch scrap categories', err);
      showToast(err.response?.data?.message || 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((category) =>
      [category.name, category.description, category.icon_url]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [categories, search]);

  const activeCount = categories.filter((category) => category.is_active).length;
  const averagePoints = categories.length
    ? Math.round(categories.reduce((sum, category) => sum + (category.points_per_kg || 0), 0) / categories.length)
    : 0;
  const filteredIcons = iconOptions.filter((option) =>
    option.label.toLowerCase().includes(iconSearch.trim().toLowerCase())
  );

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setIconSearch('');
  };

  const startEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name || '',
      description: category.description || '',
      points_per_kg: category.points_per_kg || 0,
      price_per_kg: category.price_per_kg || 0,
      icon_url: category.icon_url || 'category',
      is_active: category.is_active !== false,
    });
    setIconSearch('');
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      points_per_kg: Math.max(0, parseInt(form.points_per_kg, 10) || 0),
      price_per_kg: Math.max(0, parseFloat(form.price_per_kg) || 0),
    };

    try {
      if (editing) {
        await adminAPI.updateScrapCategory(editing._id, payload);
        showToast('Category updated');
      } else {
        await adminAPI.createScrapCategory(payload);
        showToast('Category created');
      }
      resetForm();
      loadCategories();
    } catch (err) {
      console.error('Failed to save category', err);
      showToast(err.response?.data?.message || 'Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category) => {
    try {
      await adminAPI.updateScrapCategory(category._id, { is_active: !category.is_active });
      showToast(category.is_active ? 'Category hidden from users' : 'Category shown to users');
      loadCategories();
    } catch (err) {
      console.error('Failed to update category status', err);
      showToast('Failed to update category status', 'error');
    }
  };

  const deleteCategory = async (category) => {
    if (!window.confirm(`Remove "${category.name}"? Categories used by scrap requests will be deactivated instead.`)) return;
    try {
      await adminAPI.deleteScrapCategory(category._id);
      showToast('Category removed or deactivated');
      loadCategories();
    } catch (err) {
      console.error('Failed to delete category', err);
      showToast(err.response?.data?.message || 'Failed to delete category', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Scrap Categories</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            Manage every material category used in scrap requests and control EcoPoint rates shown to users.
          </p>
        </div>
        <button className="btn btn-primary" onClick={resetForm} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> New Category
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <div className="card"><strong>{categories.length}</strong><small style={{ display: 'block', color: 'var(--text-muted)' }}>Total categories</small></div>
        <div className="card"><strong>{activeCount}</strong><small style={{ display: 'block', color: 'var(--text-muted)' }}>Visible to users</small></div>
        <div className="card"><strong>{averagePoints}</strong><small style={{ display: 'block', color: 'var(--text-muted)' }}>Average pts/kg</small></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: '1rem', alignItems: 'start' }} className="category-layout">
        <form className="card" onSubmit={saveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>{editing ? 'Edit Category' : 'Add Category'}</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
              Points per kg are used for reward estimates and awards.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input className="form-control" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Paper, Plastic, Metal..." required />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows="3" placeholder="What materials belong in this category?" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Points / kg</label>
              <input className="form-control" type="number" min="0" value={form.points_per_kg} onChange={(e) => updateForm('points_per_kg', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Price / kg</label>
              <input className="form-control" type="number" min="0" step="0.01" value={form.price_per_kg} onChange={(e) => updateForm('price_per_kg', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                className="form-control"
                placeholder="Search icon store..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
              />
            </div>
            <div className="icon-store">
              {filteredIcons.map((option) => {
                const Icon = option.Icon;
                const selected = form.icon_url === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className="icon-store-item"
                    aria-pressed={selected}
                    title={option.label}
                    onClick={() => updateForm('icon_url', option.value)}
                  >
                    <Icon size={18} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-main)' }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => updateForm('is_active', e.target.checked)} />
            Show this category to users
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            {editing && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>}
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Category'}</button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input className="form-control" placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 size={34} style={{ color: 'var(--primary)' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              No scrap categories found. Submit a scrap request or create a category to start the list.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {filtered.map((category) => (
                <div key={category._id} className="card" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.9rem', alignItems: 'center' }}>
                  {(() => {
                    const Icon = getCategoryIcon(category.icon_url);
                    return (
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', display: 'grid', placeItems: 'center', color: '#10b981' }}>
                        <Icon size={22} />
                      </div>
                    );
                  })()}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--text-h)' }}>{category.name}</strong>
                      <span className={`badge ${category.is_active ? 'badge-success' : 'badge-pending'}`}>{category.is_active ? 'Active' : 'Hidden'}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{iconOptions.find((option) => option.value === category.icon_url)?.label || 'General'}</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 3 }}>
                      {category.points_per_kg || 0} pts/kg{category.price_per_kg ? ` • Rs. ${category.price_per_kg}/kg` : ''}
                    </div>
                    {category.description && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {category.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="action-icon-btn" title={category.is_active ? 'Hide from users' : 'Show to users'} onClick={() => toggleActive(category)}>
                      {category.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button className="action-icon-btn" title="Edit category" onClick={() => startEdit(category)}>
                      <Edit size={16} />
                    </button>
                    <button className="action-icon-btn action-icon-danger" title="Delete category" onClick={() => deleteCategory(category)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .category-layout {
            grid-template-columns: 1fr !important;
          }
        }
        .icon-store {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
          gap: 0.5rem;
          max-height: 190px;
          overflow: auto;
          padding: 0.35rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.01);
        }
        .icon-store-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          min-height: 72px;
          padding: 0.55rem 0.35rem;
          color: var(--text-muted);
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.75rem;
        }
        .icon-store-item:hover,
        .icon-store-item[aria-pressed="true"] {
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.45);
          background: rgba(16, 185, 129, 0.08);
        }
      `}</style>

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>{toast.message}</div>
        ))}
      </div>
    </div>
  );
};

export default ScrapCategories;
