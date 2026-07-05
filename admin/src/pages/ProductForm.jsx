import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI } from '../api/api';
import { Loader2, Upload, X } from 'lucide-react';
import '../styles/ProductForm.css';

const ProductForm = ({ mode = 'create' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Stationery',
    price: 0,
    stock: 0,
    madeFrom: '',
    ecoImpact: '',
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const categories = ['Stationery', 'Bags', 'Home Decor', 'Office', 'Storage', 'Gardening', 'Electronics', 'Other'];

  useEffect(() => {
    if (mode === 'edit' && id) {
      (async () => {
        setLoading(true);
        try {
          const res = await productAPI.getProducts();
          const product = (res || []).find((p) => p._id === id);
          if (product) {
            setFormData({
              name: product.name || '',
              description: product.description || '',
              category: product.category || 'Stationery',
              price: product.price || 0,
              stock: product.stock_quantity || product.stock || 0,
              madeFrom: product.madeFrom || product.made_from || '',
              ecoImpact: product.ecoImpact || product.eco_impact || '',
            });
            if (product.image_urls?.[0] || product.image) {
              setImagePreviews([product.image_urls?.[0] || product.image]);
            }
          }
        } catch (e) {
          console.error('Failed to load product', e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [mode, id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
    const MAX_IMAGES = 5;
    
    const errors = [];
    const validFiles = [];
    
    files.forEach(file => {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Only PNG and JPG files are allowed`);
        return;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size must be less than 5MB`);
        return;
      }
      
      validFiles.push(file);
    });
    
    // Check total images limit
    if (imageFiles.length + validFiles.length > MAX_IMAGES) {
      errors.push(`Maximum ${MAX_IMAGES} images allowed. You're adding ${validFiles.length} files.`);
      validFiles.length = MAX_IMAGES - imageFiles.length;
    }
    
    if (errors.length > 0) {
      alert('File validation errors:\n\n' + errors.join('\n'));
    }
    
    if (validFiles.length > 0) {
      validFiles.forEach(file => {
        setImageFiles(prev => [...prev, file]);
        setImagePreviews(prev => [...prev, URL.createObjectURL(file)]);
      });
    }
  };

  const removeImageAt = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Product name is required');
      return;
    }
    if (!formData.description.trim()) {
      alert('Description is required');
      return;
    }

    setActionLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      fd.append('category', formData.category);
      fd.append('price', formData.price);
      fd.append('stock', formData.stock);
      fd.append('madeFrom', formData.madeFrom);
      fd.append('ecoImpact', formData.ecoImpact);

      for (const file of imageFiles) {
        fd.append('image_urls', file);
      }

      if (mode === 'edit' && id) {
        await productAPI.updateProduct(id, fd);
      } else {
        await productAPI.createProduct(fd);
      }

      navigate('/products');
    } catch (err) {
      console.error('Save failed:', err);
      alert(err.response?.data?.message || 'Error saving product');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="spinner" size={40} />
      </div>
    );
  }

  return (
    <div className="product-form-wrapper">
      <div className="form-container">
        <div className="form-header">
          <h1>{mode === 'edit' ? 'Edit Product' : 'Add New Product'}</h1>
          <button 
            type="button" 
            onClick={() => navigate('/products')}
            className="close-btn"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          {/* Row 1: Name & Category */}
          <div className="form-row">
            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Price & Stock */}
          <div className="form-row">
            <div className="form-group">
              <label>Price (NPR)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Row 3: Made From & Eco Impact */}
          <div className="form-row">
            <div className="form-group">
              <label>Made From</label>
              <input
                type="text"
                name="madeFrom"
                value={formData.madeFrom}
                onChange={handleInputChange}
                placeholder="e.g., Recycled Paper"
              />
            </div>
            <div className="form-group">
              <label>Eco Impact</label>
              <input
                type="text"
                name="ecoImpact"
                value={formData.ecoImpact}
                onChange={handleInputChange}
                placeholder="e.g., Saves 2kg CO2"
              />
            </div>
          </div>

          {/* Row 4: Description */}
          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the product and its benefits"
              rows="4"
              required
            />
          </div>

          {/* Row 5: Images */}
          <div className="form-group full-width">
            <label>Product Images (PNG, JPG only • Max 5MB each • Up to 5 images)</label>
            <div className="upload-box">
              <input
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,image/png,image/jpeg,image/jpg"
                onChange={handleImageChange}
                id="imageInput"
              />
              <label htmlFor="imageInput" className="upload-label">
                <Upload size={24} />
                <span>Click to upload images</span>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="image-grid">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="image-item">
                    <img src={preview} alt={`Preview ${idx + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImageAt(idx)}
                      className="remove-btn"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="btn btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="btn btn-submit"
            >
              {actionLoading ? 'Saving...' : (mode === 'edit' ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
