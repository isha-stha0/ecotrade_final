import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI } from '../api/api';
import { Loader2 } from 'lucide-react';

const ProductForm = ({ mode = 'create' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Stationery');
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [madeFrom, setMadeFrom] = useState('');
  const [ecoImpact, setEcoImpact] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    if (mode === 'edit' && id) {
      (async () => {
        setLoading(true);
        try {
          const res = await productAPI.getProducts();
          const product = (res || []).find((p) => p._id === id) || null;
          if (product) {
            setName(product.name || '');
            setDescription(product.description || '');
            setCategory(product.category || 'Stationery');
            setPrice(product.price || 0);
            setStock(product.stock_quantity || product.stock || 0);
            setMadeFrom(product.madeFrom || product.made_from || '');
            setEcoImpact(product.ecoImpact || product.eco_impact || '');
            setImagePreview(product.image_urls?.[0] || product.image || '');
          }
        } catch (e) {
          console.error('Failed to load product for edit', e);
        } finally { setLoading(false); }
      })();
    }
  }, [mode, id]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageFiles((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImageAt = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
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
  // append all images to image_urls so backend's upload.array('image_urls') handles them
  for (const f of imageFiles) formData.append('image_urls', f);

      if (mode === 'edit' && id) {
        await productAPI.updateProduct(id, formData);
      } else {
        await productAPI.createProduct(formData);
      }

      navigate('/products');
    } catch (err) {
      console.error('Save product failed', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}><Loader2 className="animate-spin" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{mode === 'edit' ? 'Edit Product' : 'Add New Product'}</h1>
      </div>
      <form onSubmit={handleSubmit} className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label">Name</label>
            <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Category</label>
            <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Stationery</option>
              <option>Bags</option>
              <option>Home Decor</option>
              <option>Office</option>
              <option>Storage</option>
              <option>Gardening</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="form-label">Price</label>
            <input type="number" className="form-control" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>
          <div>
            <label className="form-label">Stock</label>
            <input type="number" className="form-control" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="form-label">Made From</label>
            <input className="form-control" value={madeFrom} onChange={(e) => setMadeFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Environmental Impact</label>
            <input className="form-control" value={ecoImpact} onChange={(e) => setEcoImpact(e.target.value)} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Product Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreview && <img src={imagePreview} alt="preview" style={{ width: 140, height: 100, objectFit: 'cover', marginTop: 8 }} />}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button className="btn btn-secondary" type="button" onClick={() => navigate('/products')}>Cancel</button>
          <button className="btn btn-primary" type="submit" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save Product'}</button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
