import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Upload, X, Package } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { uploadToStorage, deleteFromStorage, getImgSrc } from '../lib/storage';

export default function CategoriesTab({ banners, bannerCategories }) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCatModal, setDeleteCatModal] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const categoryImageInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { url, path } = await uploadToStorage(file, 'categories');
      if (editingCategory) {
        setEditingCategory({ ...editingCategory, imageUrl: url, imagePath: path });
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки изображения.');
    }
    setUploadingImage(false);
    e.target.value = '';
  };

  const saveCategory = async () => {
    if (!editingCategory?.name?.trim()) {
      alert('Введите название категории');
      return;
    }
    try {
      if (editingCategory.id && !editingCategory.isNew) {
        const { id, isNew, ...data } = editingCategory;
        await updateDoc(doc(db, 'bannerCategories', id), data);
      } else {
        const { id, isNew, ...data } = editingCategory;
        await addDoc(collection(db, 'bannerCategories'), {
          ...data, order: bannerCategories.length
        });
      }
      setEditingCategory(null);
    } catch (err) {
      alert('Ошибка сохранения категории');
    }
  };

  const toggleCategoryActive = async (cat) => {
    if (!cat?.id) return;
    await updateDoc(doc(db, 'bannerCategories', cat.id), { active: cat.active === false });
  };

  const deleteCategoryOnly = async () => {
    if (!deleteCatModal?.id) return;
    try {
      await deleteDoc(doc(db, 'bannerCategories', deleteCatModal.id));
      await deleteFromStorage(deleteCatModal.imagePath);
    } catch (err) { alert('Ошибка удаления'); }
    setDeleteCatModal(null);
  };

  const deleteCategoryWithBanners = async () => {
    if (!deleteCatModal?.id) return;
    try {
      const toDelete = banners.filter(b => b.category === deleteCatModal.name);
      const batch = writeBatch(db);
      toDelete.forEach(b => batch.delete(doc(db, 'banners', b.id)));
      batch.delete(doc(db, 'bannerCategories', deleteCatModal.id));
      await batch.commit();
      await Promise.all(toDelete.map(b => deleteFromStorage(b.imagePath)));
      await deleteFromStorage(deleteCatModal.imagePath);
    } catch (err) { alert('Ошибка удаления'); }
    setDeleteCatModal(null);
  };

  return (
    <div>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        Категории для главной страницы. Скрытые категории не видны посетителям.
      </p>
      <button className="btn btn-success"
        onClick={() => setEditingCategory({ name: '', imageUrl: '', isNew: true })}
        style={{ marginBottom: '1rem' }}>
        <Plus size={18} /> Добавить категорию
      </button>

      {/* Edit modal */}
      {editingCategory && (
        <div className="modal-overlay" onClick={() => setEditingCategory(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategory.isNew ? 'Новая категория' : 'Редактирование'}</h3>
              <button className="modal-close" onClick={() => setEditingCategory(null)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название *</label>
                <input value={editingCategory.name || ''}
                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="Например: Акции" />
              </div>
              <div className="form-group">
                <label>Картинка категории</label>
                <div className="image-upload-container">
                  {getImgSrc(editingCategory) && (
                    <img src={getImgSrc(editingCategory)} alt=""
                      className="image-upload-preview" style={{ maxHeight: '100px', width: 'auto' }} />
                  )}
                  <input type="file" accept="image/*" ref={categoryImageInputRef}
                    style={{ display: 'none' }}
                    onChange={handleImageUpload} />
                  <button type="button" className="image-upload-btn"
                    onClick={() => categoryImageInputRef.current?.click()}
                    disabled={uploadingImage}>
                    <Upload size={18} />
                    {uploadingImage ? 'Загрузка...' : 'Загрузить картинку'}
                  </button>
                  {getImgSrc(editingCategory) && (
                    <button type="button" className="btn btn-outline"
                      onClick={() => setEditingCategory({ ...editingCategory, imageUrl: '', image: '' })}
                      style={{ marginTop: '0.5rem' }}>
                      Удалить картинку
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditingCategory(null)}>Отмена</button>
              <button className="btn btn-success" onClick={saveCategory}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteCatModal && (
        <div className="modal-overlay" onClick={() => setDeleteCatModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Удалить &laquo;{deleteCatModal.name}&raquo;?</h3>
              <button className="modal-close" onClick={() => setDeleteCatModal(null)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: '#555' }}>
                В этой категории{' '}
                <strong>{banners.filter(b => b.category === deleteCatModal.name).length}</strong>{' '}
                баннеров. Выберите способ удаления:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button className="btn btn-outline"
                  style={{ textAlign: 'left', padding: '0.8rem 1rem' }}
                  onClick={deleteCategoryOnly}>
                  <strong>Удалить только категорию</strong><br />
                  <small style={{ color: '#666' }}>Баннеры останутся, но окажутся без категории</small>
                </button>
                <button className="btn btn-danger"
                  style={{ textAlign: 'left', padding: '0.8rem 1rem' }}
                  onClick={deleteCategoryWithBanners}>
                  <strong>Удалить категорию и все её баннеры</strong><br />
                  <small>
                    Будет удалено {banners.filter(b => b.category === deleteCatModal.name).length} баннеров
                  </small>
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteCatModal(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Category list */}
      {bannerCategories.length === 0
        ? <div className="empty-state"><Package size={60} /><p>Нет категорий. Создайте первую!</p></div>
        : (
          <div className="categories-admin-grid">
            {bannerCategories.map(cat => (
              <div key={cat.id} className={`category-admin-card ${cat.active === false ? 'inactive' : ''}`}>
                <div className="category-admin-image">
                  {getImgSrc(cat)
                    ? <img src={getImgSrc(cat)} alt={cat.name} loading="lazy" />
                    : <div className="no-image"><Package size={32} /></div>}
                  {cat.active === false && <div className="banner-inactive-badge">Скрыта</div>}
                </div>
                <div className="category-admin-info">
                  <strong>{cat.name}</strong>
                  <span className="category-count">
                    {banners.filter(b => b.category === cat.name).length} баннеров
                  </span>
                </div>
                <div className="category-admin-actions">
                  <button
                    className={`btn ${cat.active !== false ? 'btn-success' : 'btn-outline'}`}
                    onClick={() => toggleCategoryActive(cat)}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                    title={cat.active !== false ? 'Видна посетителям' : 'Скрыта от посетителей'}>
                    {cat.active !== false ? 'Вкл' : 'Выкл'}
                  </button>
                  <button className="btn btn-outline"
                    onClick={() => setEditingCategory({ ...cat, isNew: false })}><Edit2 size={16} /></button>
                  <button className="btn btn-danger"
                    onClick={() => setDeleteCatModal(cat)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
