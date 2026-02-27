import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Upload, X, Image, GripVertical, Copy, FolderInput } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { uploadToStorage, deleteFromStorage, getImgSrc } from '../lib/storage';

export default function BannersTab({ banners, bannerCategories }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingBanner, setEditingBanner] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [selectedBanners, setSelectedBanners] = useState([]);
  const [bulkCategoryModal, setBulkCategoryModal] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const [draggedBanner, setDraggedBanner] = useState(null);

  const bannerFileInputRef = useRef(null);
  const multipleFilesInputRef = useRef(null);

  const filteredBanners = banners.filter(b => {
    if (!selectedCategory) return true;
    return b.category === selectedCategory;
  });

  // Image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { url, path } = await uploadToStorage(file, 'banners');
      if (editingBanner) {
        setEditingBanner({ ...editingBanner, imageUrl: url, imagePath: path });
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки изображения.');
    }
    setUploadingImage(false);
    e.target.value = '';
  };

  // Multi-file upload
  const handleMultipleFilesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadProgress({ done: 0, total: files.length });
    let ok = 0, fail = 0;

    for (const file of files) {
      try {
        const { url, path } = await uploadToStorage(file, 'banners');
        await addDoc(collection(db, 'banners'), {
          title: file.name.replace(/\.[^/.]+$/, ''),
          imageUrl: url,
          imagePath: path,
          category: selectedCategory || '',
          link: '',
          active: true,
          order: banners.length + ok
        });
        ok++;
      } catch (err) {
        console.error(err);
        fail++;
      }
      setUploadProgress({ done: ok + fail, total: files.length });
    }

    setUploadProgress(null);
    e.target.value = '';
    if (fail > 0) alert(`Загружено: ${ok}, ошибок: ${fail}`);
  };

  // Banner CRUD
  const saveBanner = async () => {
    if (!editingBanner) return;
    if (!getImgSrc(editingBanner)) {
      alert('Добавьте изображение для баннера');
      return;
    }
    try {
      if (editingBanner.id && !editingBanner.isNew) {
        const { id, isNew, ...data } = editingBanner;
        await updateDoc(doc(db, 'banners', id), data);
      } else {
        const { id, isNew, ...data } = editingBanner;
        await addDoc(collection(db, 'banners'), { ...data, order: banners.length });
      }
      setEditingBanner(null);
    } catch (err) {
      console.error(err);
      alert('Ошибка сохранения');
    }
  };

  const deleteBanner = async (banner) => {
    if (!banner?.id) return;
    if (!window.confirm('Удалить баннер?')) return;
    try {
      await deleteDoc(doc(db, 'banners', banner.id));
      await deleteFromStorage(banner.imagePath);
    } catch (err) {
      console.error(err);
      alert('Ошибка удаления');
    }
  };

  const deleteSelectedBanners = async () => {
    if (!selectedBanners.length) return;
    if (!window.confirm(`Удалить ${selectedBanners.length} баннеров?`)) return;
    try {
      const batch = writeBatch(db);
      selectedBanners.forEach(id => batch.delete(doc(db, 'banners', id)));
      await batch.commit();
      const toDelete = banners.filter(b => selectedBanners.includes(b.id));
      await Promise.all(toDelete.map(b => deleteFromStorage(b.imagePath)));
      setSelectedBanners([]);
    } catch (err) {
      console.error(err);
      alert('Ошибка удаления');
    }
  };

  const changeBulkCategory = async () => {
    if (!selectedBanners.length) return;
    try {
      const batch = writeBatch(db);
      selectedBanners.forEach(id =>
        batch.update(doc(db, 'banners', id), { category: bulkCategory })
      );
      await batch.commit();
      setSelectedBanners([]);
      setBulkCategoryModal(false);
      setBulkCategory('');
    } catch (err) {
      alert('Ошибка изменения категорий');
    }
  };

  const copyBanner = async (banner) => {
    try {
      const { id, ...data } = banner;
      await addDoc(collection(db, 'banners'), {
        ...data,
        title: `${data.title || 'Баннер'} (копия)`,
        order: banners.length
      });
    } catch (err) {
      alert('Ошибка копирования');
    }
  };

  const toggleBannerActive = async (banner) => {
    if (!banner?.id) return;
    await updateDoc(doc(db, 'banners', banner.id), { active: !banner.active });
  };

  const toggleBannerSelection = (id) => {
    setSelectedBanners(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllBanners = () => {
    setSelectedBanners(
      selectedBanners.length === filteredBanners.length
        ? []
        : filteredBanners.map(b => b.id)
    );
  };

  // Drag & Drop
  const handleDragStart = (e, banner) => {
    setDraggedBanner(banner);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e, targetBanner) => {
    e.preventDefault();
    if (!draggedBanner || draggedBanner.id === targetBanner.id) {
      setDraggedBanner(null);
      return;
    }
    const list = [...filteredBanners];
    const from = list.findIndex(b => b.id === draggedBanner.id);
    const to = list.findIndex(b => b.id === targetBanner.id);
    list.splice(from, 1);
    list.splice(to, 0, draggedBanner);
    try {
      const batch = writeBatch(db);
      list.forEach((b, i) => batch.update(doc(db, 'banners', b.id), { order: i }));
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
    setDraggedBanner(null);
  };

  return (
    <div>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        Изображения загружаются в Firebase Storage. Перетаскивайте для сортировки.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-success" onClick={() =>
          setEditingBanner({ title: '', imageUrl: '', link: '', category: selectedCategory || '', active: true, isNew: true })
        }><Plus size={18} /> Добавить</button>

        <button className="btn btn-primary"
          onClick={() => multipleFilesInputRef.current?.click()}
          disabled={uploadProgress !== null}>
          <Upload size={18} />
          {uploadProgress
            ? `Загрузка ${uploadProgress.done}/${uploadProgress.total}...`
            : 'Загрузить несколько'}
        </button>
        <input type="file" accept="image/*" multiple ref={multipleFilesInputRef}
          style={{ display: 'none' }} onChange={handleMultipleFilesUpload} />

        {selectedBanners.length > 0 && (<>
          <button className="btn btn-outline" onClick={() => setBulkCategoryModal(true)}>
            <FolderInput size={18} /> Категория ({selectedBanners.length})
          </button>
          <button className="btn btn-danger" onClick={deleteSelectedBanners}>
            <Trash2 size={18} /> Удалить ({selectedBanners.length})
          </button>
        </>)}
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={selectedCategory || ''}
          onChange={e => setSelectedCategory(e.target.value || null)}
          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd' }}>
          <option value="">Все категории</option>
          {bannerCategories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox"
            checked={selectedBanners.length === filteredBanners.length && filteredBanners.length > 0}
            onChange={selectAllBanners} />
          Выбрать все
        </label>
      </div>

      {/* Banner edit modal */}
      {editingBanner && (
        <div className="modal-overlay" onClick={() => setEditingBanner(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingBanner.isNew ? 'Новый баннер' : 'Редактирование'}</h3>
              <button className="modal-close" onClick={() => setEditingBanner(null)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название (для админки)</label>
                <input value={editingBanner.title || ''}
                  onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  placeholder="Название баннера" />
              </div>
              <div className="form-group">
                <label>Категория</label>
                <select value={editingBanner.category || ''}
                  onChange={e => setEditingBanner({ ...editingBanner, category: e.target.value })}>
                  <option value="">Без категории</option>
                  {bannerCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Ссылка (необязательно)</label>
                <input value={editingBanner.link || ''}
                  onChange={e => setEditingBanner({ ...editingBanner, link: e.target.value })}
                  placeholder="https://example.com" />
              </div>
              <div className="form-group">
                <label>Изображение *</label>
                <div className="image-upload-container">
                  {getImgSrc(editingBanner) && (
                    <img src={getImgSrc(editingBanner)} alt=""
                      className="image-upload-preview" style={{ maxHeight: '200px', width: 'auto' }} />
                  )}
                  <input type="file" accept="image/*" ref={bannerFileInputRef}
                    style={{ display: 'none' }} onChange={handleImageUpload} />
                  <button type="button" className="image-upload-btn"
                    onClick={() => bannerFileInputRef.current?.click()}
                    disabled={uploadingImage}>
                    <Upload size={18} />
                    {uploadingImage ? 'Загрузка в Storage...' : 'Загрузить файл'}
                  </button>
                </div>
              </div>
              <div className="form-group checkbox-group">
                <input type="checkbox" checked={editingBanner.active}
                  onChange={e => setEditingBanner({ ...editingBanner, active: e.target.checked })} />
                <label>Активен</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditingBanner(null)}>Отмена</button>
              <button className="btn btn-success" onClick={saveBanner}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk category modal */}
      {bulkCategoryModal && (
        <div className="modal-overlay" onClick={() => setBulkCategoryModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Изменить категорию ({selectedBanners.length} баннеров)</h3>
              <button className="modal-close" onClick={() => setBulkCategoryModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Новая категория</label>
                <select value={bulkCategory} onChange={e => setBulkCategory(e.target.value)}>
                  <option value="">Без категории</option>
                  {bannerCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setBulkCategoryModal(false)}>Отмена</button>
              <button className="btn btn-success" onClick={changeBulkCategory}>Применить</button>
            </div>
          </div>
        </div>
      )}

      {/* Banner list */}
      {filteredBanners.length === 0
        ? <div className="empty-state"><Image size={60} /><p>Нет баннеров. Загрузите первый!</p></div>
        : (
          <div className="banners-admin-grid">
            {filteredBanners.map(banner => (
              <div key={banner.id}
                className={`banner-admin-item ${!banner.active ? 'inactive' : ''} ${selectedBanners.includes(banner.id) ? 'selected' : ''} ${draggedBanner?.id === banner.id ? 'dragging' : ''}`}
                draggable
                onDragStart={e => handleDragStart(e, banner)}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, banner)}>
                <div className="banner-admin-drag"><GripVertical size={16} /></div>
                <div className="banner-select-checkbox">
                  <input type="checkbox"
                    checked={selectedBanners.includes(banner.id)}
                    onChange={() => toggleBannerSelection(banner.id)}
                    onClick={e => e.stopPropagation()} />
                </div>
                <div className="banner-admin-preview">
                  {getImgSrc(banner)
                    ? <img src={getImgSrc(banner)} alt={banner.title} loading="lazy" />
                    : <div className="no-image">Нет изображения</div>}
                  {!banner.active && <div className="banner-inactive-badge">Скрыт</div>}
                </div>
                <div className="banner-admin-info">
                  <strong>{banner.title || 'Без названия'}</strong>
                  {banner.category && <small>Категория: {banner.category}</small>}
                </div>
                <div className="banner-admin-actions">
                  <button className="btn btn-outline" onClick={() => copyBanner(banner)} title="Копировать"><Copy size={16} /></button>
                  <button className="btn btn-outline" onClick={() => setEditingBanner({ ...banner, isNew: false })} title="Редактировать"><Edit2 size={16} /></button>
                  <button className={`btn ${banner.active ? 'btn-success' : 'btn-outline'}`}
                    onClick={() => toggleBannerActive(banner)}
                    style={{ padding: '0.3rem 0.5rem' }}>
                    {banner.active ? 'Вкл' : 'Выкл'}
                  </button>
                  <button className="btn btn-danger" onClick={() => deleteBanner(banner)} title="Удалить"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
