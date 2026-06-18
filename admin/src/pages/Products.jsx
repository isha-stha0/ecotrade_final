import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI, adminAPI } from '../api/api';
import { Loader2, Plus, Edit, Trash2, Tag, Database, Search, MoreHorizontal } from 'lucide-react';
import { orderAPI } from '../api/api';
import '../styles/Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Modal states
  const [showFormModal, setShowFormModal] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Stationery');
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(10);
  const [madeFrom, setMadeFrom] = useState('');
  const [ecoImpact, setEcoImpact] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productAPI.getProducts();
      setProducts(res || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchProducts();
    })();
  }, [fetchProducts]);

  // Creating a new product is now handled via the sidebar link (/products/new)

  const handleOpenEditModal = (p) => {
    // navigate to edit page
    navigate(`/products/${p._id}/edit`);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('stock', stock);
      formData.append('madeFrom', madeFrom);
      formData.append('ecoImpact', ecoImpact);
      if (imageFile) {
        formData.append('image_urls', imageFile);
      }

      // If modal is used as an edit fallback, ensure payload handling on server side
      await productAPI.createProduct(formData);

      fetchProducts();
      setShowFormModal(false);
    } catch (err) {
      console.error('Error saving product:', err);
      showToast(err.response?.data?.message || 'Error occurred while saving product data.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This action is irreversible.')) return;
    setActionLoading(true);
    try {
      await productAPI.deleteProduct(id);
      fetchProducts();
      showToast('Product deleted', 'success');
    } catch (err) {
      console.error('Error deleting product:', err);
      showToast('Failed to delete product', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Sell modal state
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellProduct, setSellProduct] = useState(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellLoading, setSellLoading] = useState(false);

  // Sub-navbar + quick edit states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [quickEditMode, setQuickEditMode] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [inlineSavingId, setInlineSavingId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleInlineChange = (id, field, value) => {
    setEditValues((ev) => ({ ...ev, [id]: { ...(ev[id] || {}), [field]: value } }));
  };

  const saveInlineEdit = async (id) => {
    const values = editValues[id];
    if (!values) return;
    setInlineSavingId(id);
    try {
      const formData = new FormData();
      if (values.name !== undefined) formData.append('name', values.name);
      if (values.description !== undefined) formData.append('description', values.description);
      if (values.price !== undefined) formData.append('price', values.price);
      if (values.stock !== undefined) formData.append('stock', values.stock);
      if (values.category !== undefined) formData.append('category', values.category);
      if (values.madeFrom !== undefined) formData.append('madeFrom', values.madeFrom);
      if (values.ecoImpact !== undefined) formData.append('ecoImpact', values.ecoImpact);

      await productAPI.updateProduct(id, formData);
      showToast('Product updated', 'success');
      fetchProducts();
    } catch (err) {
      console.error('Inline update failed', err);
      showToast('Failed to update product', 'error');
    } finally {
      setInlineSavingId(null);
    }
  };

  const cancelInlineEdit = (id) => {
    setEditValues((ev) => {
      const copy = { ...ev };
      delete copy[id];
      return copy;
    });
  };

  // Lightweight local toasts (keeps UX non-blocking)
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'success', ms = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  };

  const openSellModal = (product) => {
    setSellProduct(product);
    setSellQuantity(1);
    setShowSellModal(true);
  };

  const handleConfirmSell = async () => {
    if (!sellProduct) return;
    if (sellQuantity <= 0) {
      showToast('Quantity must be at least 1', 'error');
      return;
    }
    setSellLoading(true);
    try {
      // Backend expects items: [{ product: id, quantity }]
      const payload = { items: [{ product: sellProduct._id, quantity: parseInt(sellQuantity, 10) }], paymentMethod: 'cash_on_delivery' };
      await orderAPI.placeOrder(payload);
      setShowSellModal(false);
      fetchProducts();
      showToast('Sale recorded successfully', 'success');
    } catch (err) {
      console.error('Error placing quick sale:', err);
      showToast(err.response?.data?.message || 'Failed to record sale', 'error');
    } finally {
      setSellLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm('Seed sample eco-products to database? This will skip existing entries.')) return;
    setActionLoading(true);
    try {
      await adminAPI.seedProducts();
      fetchProducts();
      showToast('Sample products seeded', 'success');
    } catch (err) {
      console.error('Error seeding products:', err);
      showToast('Failed to seed sample products', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // derive filtered products from search and category
  const filteredProducts = products.filter((p) => {
    const q = searchTerm.trim().toLowerCase();
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (!q) return true;
    return (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Eco-Products Store</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Manage product listings, monitor stock levels, and customize environmental attributes</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleSeedDatabase}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            disabled={actionLoading || loading}
          >
            <Database size={16} /> Seed Samples
          </button>
        </div>
      </div>

      {/* Sub-navbar */}
      <div className="card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 280, flex: 1 }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input className="form-control" placeholder="Search products by name, description or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div style={{ minWidth: 160 }}>
          <select className="form-control" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Stationery">Stationery</option>
            <option value="Bags">Bags</option>
            <option value="Home Decor">Home Decor</option>
            <option value="Office">Office</option>
            <option value="Storage">Storage</option>
            <option value="Gardening">Gardening</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
          <button className={`btn ${quickEditMode ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setQuickEditMode((s) => !s)}>{quickEditMode ? 'Exit Quick Edit' : 'Quick Edit'}</button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setDropdownOpen((s) => !s)} className="btn btn-primary" aria-expanded={dropdownOpen} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MoreHorizontal size={14} /> Options
            </button>
            {dropdownOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', zIndex: 40, minWidth: 180 }}>
                <button className="dropdown-item" style={{ width: '100%', padding: '0.6rem 0.8rem', textAlign: 'left' }} onClick={() => { setDropdownOpen(false); navigate('/products/bulk'); }}>Bulk Upload</button>
                <button className="dropdown-item" style={{ width: '100%', padding: '0.6rem 0.8rem', textAlign: 'left' }} onClick={() => { setDropdownOpen(false); handleSeedDatabase(); }}>Seed Samples</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={36} style={{ color: 'var(--primary)' }} />
        </div>
      ) : (
        <div>
          {products.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((p) => (
                <div key={p._id} className="product-card">
                  
                  {/* Image Display */}
                  <div className="product-image">
                    {p.image_urls?.[0] || p.image ? (
                      <img 
                        src={p.image_urls?.[0] || p.image} 
                        alt={p.name} 
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <Tag size={32} />
                        <span style={{ fontSize: '0.8rem' }}>No image</span>
                      </div>
                    )}
                    <div className="product-category-badge">
                      {p.category}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="product-details">
                    {quickEditMode ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input className="form-control" value={editValues[p._id]?.name ?? p.name} onChange={(e) => handleInlineChange(p._id, 'name', e.target.value)} />
                        <input className="form-control" value={editValues[p._id]?.description ?? p.description} onChange={(e) => handleInlineChange(p._id, 'description', e.target.value)} />
                      </div>
                    ) : (
                      <>
                        <h3 className="product-name">{p.name}</h3>
                        <p className="product-description">{p.description}</p>
                      </>
                    )}
                    
                    <div className="product-price-section">
                      {quickEditMode ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
                          <input className="form-control" style={{ width: 120 }} value={editValues[p._id]?.price ?? p.price} onChange={(e) => handleInlineChange(p._id, 'price', e.target.value)} />
                          <input className="form-control" style={{ width: 100 }} value={editValues[p._id]?.stock ?? p.stock_quantity ?? p.stock ?? 0} onChange={(e) => handleInlineChange(p._id, 'stock', e.target.value)} />
                        </div>
                      ) : (
                        <>
                          <span className="product-price">Rs. {p.price}</span>
                          <span className={`product-stock ${(p.stock_quantity || p.stock) <= 5 ? 'low' : ''}`}>Stock: {p.stock_quantity || p.stock || 0}</span>
                        </>
                      )}
                    </div>

                    <div className="product-eco-info">
                      {p.madeFrom && <span>Material: <strong>{p.madeFrom}</strong></span>}
                      {p.ecoImpact && <span>Impact: <strong>{p.ecoImpact}</strong></span>}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="product-actions">
                    {quickEditMode ? (
                      <>
                        <button className="btn btn-primary btn-save" onClick={() => saveInlineEdit(p._id)} disabled={inlineSavingId === p._id}>{inlineSavingId === p._id ? 'Saving...' : 'Save'}</button>
                        <button className="btn btn-secondary btn-cancel" onClick={() => cancelInlineEdit(p._id)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleOpenEditModal(p)}
                          className="btn btn-secondary btn-edit"
                          disabled={actionLoading}
                        >
                          <Edit size={14} style={{ marginRight: '0.25rem' }} /> Edit
                        </button>
                        <button 
                          onClick={() => openSellModal(p)}
                          className="btn btn-primary btn-sell"
                        >
                          Sell
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p._id)}
                          className="btn btn-danger btn-delete"
                          disabled={actionLoading}
                          title="Delete product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="products-empty card">
              No products available. Add one using the button above or seed the database sample catalog.
            </div>
          )}
        </div>
      )}

      {/* Edit / Create Form Modal */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <form onSubmit={handleSaveProduct}>
              <div className="modal-header">
                <h3 style={{ margin: 0 }}>Add / Edit Eco-Product</h3>
                <button 
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
                >
                  &times;
                </button>
              </div>
                <div className="modal-body modal-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                
                {/* Left Side fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Recycled Journal Notebook"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Stationery">Stationery</option>
                      <option value="Bags">Bags</option>
                      <option value="Home Decor">Home Decor</option>
                      <option value="Office">Office</option>
                      <option value="Storage">Storage</option>
                      <option value="Gardening">Gardening</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Price (Rs.)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={price}
                        onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Stock Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        value={stock}
                        onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows="3"
                      placeholder="Product details, features..."
                      style={{ resize: 'none' }}
                      required
                    />
                  </div>
                </div>

                {/* Right Side fields (Eco details + Upload) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Made From (Recycled Source)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={madeFrom}
                      onChange={(e) => setMadeFrom(e.target.value)}
                      placeholder="e.g. 100% Recycled Newspaper"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Environmental Impact Statement</label>
                    <input
                      type="text"
                      className="form-control"
                      value={ecoImpact}
                      onChange={(e) => setEcoImpact(e.target.value)}
                      placeholder="e.g. Reduces landfill waste by 1.2kg"
                    />
                  </div>

                  {/* Image Attachment with preview */}
                  <div className="form-group">
                    <label className="form-label">Product Image File</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                      id="product_image_picker"
                    />
                      <label 
                      htmlFor="product_image_picker"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '140px',
                        border: '2px dashed var(--border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        backgroundColor: 'var(--bg-card)'
                      }}
                      className="image-upload-area"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                          <Plus size={24} />
                          <span style={{ fontSize: '0.8rem' }}>Upload Attachment</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => setShowFormModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Save Product Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Sell Modal */}
      {showSellModal && sellProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Quick Sell: {sellProduct.name}</h3>
              <button onClick={() => setShowSellModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input type="number" className="form-control" value={sellQuantity} onChange={(e) => setSellQuantity(e.target.value)} min="1" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowSellModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleConfirmSell} disabled={sellLoading}>{sellLoading ? 'Processing...' : 'Confirm Sell'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .modal-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .image-upload-area:hover {
          border-color: #10b981 !important;
        }
      `}</style>
      {/* Toast container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;

