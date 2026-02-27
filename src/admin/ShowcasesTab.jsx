import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Copy, Link, Eye, EyeOff } from 'lucide-react';
import { db } from '../config/firebase';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, getDocs, Timestamp
} from 'firebase/firestore';
import { transliterate, formatDate, isExpired } from '../lib/utils';
import { getImgSrc } from '../lib/storage';

export default function ShowcasesTab({ banners, bannerCategories }) {
  const [showcases, setShowcases] = useState([]);
  const [editing, setEditing] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);

  // Подписка на витрины
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'showcases'), (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.createdAt?.toDate?.()?.getTime() || 0;
          const tb = b.createdAt?.toDate?.()?.getTime() || 0;
          return tb - ta;
        });
      setShowcases(data);
    });
    return unsub;
  }, []);

  // Статус витрины
  const getStatus = (s) => {
    if (s.active === false) return { label: 'Выключена', cls: 'status-disabled' };
    if (isExpired(s.expiresAt)) return { label: 'Истекла', cls: 'status-expired' };
    return { label: 'Активна', cls: 'status-active' };
  };

  // Посчитать баннеры в витрине
  const countShowcaseBanners = (s) => {
    return banners.filter(b => b.active &&
      ((s.categories || []).includes(b.category) || (s.bannerIds || []).includes(b.id))
    ).length;
  };

  // Автогенерация slug
  const autoSlug = (name) => transliterate(name || '');

  // Проверка уникальности slug
  const checkSlugUnique = async (slug, excludeId) => {
    const q2 = query(collection(db, 'showcases'), where('slug', '==', slug));
    const snap = await getDocs(q2);
    return snap.docs.every(d => d.id === excludeId);
  };

  // Сохранить витрину
  const save = async () => {
    if (!editing) return;
    if (!editing.name?.trim()) {
      alert('Введите название витрины');
      return;
    }
    if (!editing.slug?.trim()) {
      alert('Введите slug (адрес) витрины');
      return;
    }

    // Проверка slug
    const slugClean = editing.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const unique = await checkSlugUnique(slugClean, editing.id);
    if (!unique) {
      alert(`Slug "${slugClean}" уже используется. Выберите другой.`);
      return;
    }

    if (!(editing.categories?.length > 0 || editing.bannerIds?.length > 0)) {
      alert('Выберите хотя бы одну категорию или баннер');
      return;
    }

    try {
      const data = {
        name: editing.name.trim(),
        slug: slugClean,
        categories: editing.categories || [],
        bannerIds: editing.bannerIds || [],
        expiresAt: Timestamp.fromDate(new Date(editing.expiresAtStr || Date.now() + 7 * 86400000)),
        active: editing.active !== false,
      };

      if (editing.id && !editing.isNew) {
        await updateDoc(doc(db, 'showcases', editing.id), data);
      } else {
        data.createdAt = Timestamp.now();
        await addDoc(collection(db, 'showcases'), data);
      }
      setEditing(null);
    } catch (err) {
      console.error(err);
      alert('Ошибка сохранения');
    }
  };

  // Удалить витрину
  const remove = async (s) => {
    if (!window.confirm(`Удалить витрину "${s.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'showcases', s.id));
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  // Копировать ссылку
  const copyLink = (slug) => {
    const url = `${window.location.origin}/v/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback(slug);
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  };

  // Дата для input[type=date]
  const toDateStr = (ts) => {
    if (!ts) return '';
    const d = ts instanceof Date ? ts : ts.toDate?.() || new Date(ts);
    return d.toISOString().split('T')[0];
  };

  // Открыть редактирование
  const openEdit = (s) => {
    setEditing({
      ...s,
      isNew: false,
      expiresAtStr: toDateStr(s.expiresAt),
      categories: s.categories || [],
      bannerIds: s.bannerIds || [],
    });
  };

  // Открыть создание
  const openCreate = () => {
    const defaultExpiry = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    setEditing({
      name: '',
      slug: '',
      categories: [],
      bannerIds: [],
      active: true,
      isNew: true,
      expiresAtStr: defaultExpiry,
    });
  };

  // Toggle категории в выборе
  const toggleCategory = (catName) => {
    if (!editing) return;
    const cats = editing.categories || [];
    setEditing({
      ...editing,
      categories: cats.includes(catName)
        ? cats.filter(c => c !== catName)
        : [...cats, catName]
    });
  };

  // Toggle баннера в выборе
  const toggleBanner = (bannerId) => {
    if (!editing) return;
    const ids = editing.bannerIds || [];
    setEditing({
      ...editing,
      bannerIds: ids.includes(bannerId)
        ? ids.filter(id => id !== bannerId)
        : [...ids, bannerId]
    });
  };

  // Баннеры сгруппированные по категории (для выбора)
  const bannersByCategory = {};
  banners.forEach(b => {
    const cat = b.category || 'Без категории';
    if (!bannersByCategory[cat]) bannersByCategory[cat] = [];
    bannersByCategory[cat].push(b);
  });

  // Превью баннеров в витрине
  const previewBanners = editing
    ? banners.filter(b => b.active &&
        ((editing.categories || []).includes(b.category) || (editing.bannerIds || []).includes(b.id))
      )
    : [];

  return (
    <div>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        Создавайте временные витрины-ссылки с выбранными товарами. Поделитесь ссылкой с клиентами.
      </p>

      <button className="btn btn-success" onClick={openCreate} style={{ marginBottom: '1rem' }}>
        <Plus size={18} /> Создать витрину
      </button>

      {/* Edit/Create modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal showcase-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing.isNew ? 'Новая витрина' : 'Редактирование витрины'}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              {/* Название */}
              <div className="form-group">
                <label>Название *</label>
                <input value={editing.name || ''}
                  onChange={e => {
                    const name = e.target.value;
                    setEditing({
                      ...editing,
                      name,
                      slug: editing.slugManual ? editing.slug : autoSlug(name)
                    });
                  }}
                  placeholder="Например: Семена весна 2026" />
              </div>

              {/* Slug */}
              <div className="form-group">
                <label>Адрес (slug) *</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ color: '#888', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>/v/</span>
                  <input value={editing.slug || ''}
                    onChange={e => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''), slugManual: true })}
                    placeholder="semena-vesna" style={{ flex: 1 }} />
                </div>
                {editing.slug && (
                  <small style={{ color: '#888' }}>
                    Ссылка: {window.location.origin}/v/{editing.slug}
                  </small>
                )}
              </div>

              {/* Срок действия */}
              <div className="form-group">
                <label>Действует до</label>
                <input type="date" value={editing.expiresAtStr || ''}
                  onChange={e => setEditing({ ...editing, expiresAtStr: e.target.value })} />
              </div>

              {/* Активность */}
              <div className="form-group checkbox-group">
                <input type="checkbox" checked={editing.active !== false}
                  onChange={e => setEditing({ ...editing, active: e.target.checked })} />
                <label>Активна</label>
              </div>

              {/* Выбор категорий */}
              <div className="form-group">
                <label>Категории</label>
                <div className="showcase-categories-select">
                  {bannerCategories.map(cat => (
                    <label key={cat.id} className="showcase-checkbox-item">
                      <input type="checkbox"
                        checked={(editing.categories || []).includes(cat.name)}
                        onChange={() => toggleCategory(cat.name)} />
                      <span>{cat.name}</span>
                      <small>({banners.filter(b => b.category === cat.name && b.active).length})</small>
                    </label>
                  ))}
                </div>
              </div>

              {/* Выбор отдельных баннеров */}
              <div className="form-group">
                <label>Дополнительные баннеры (поштучно)</label>
                <div className="showcase-banners-select">
                  {Object.entries(bannersByCategory).map(([catName, catBanners]) => (
                    <details key={catName} className="showcase-banner-group">
                      <summary>{catName} ({catBanners.length})</summary>
                      <div className="showcase-banner-list">
                        {catBanners.map(b => (
                          <label key={b.id} className="showcase-banner-item">
                            <input type="checkbox"
                              checked={(editing.bannerIds || []).includes(b.id)}
                              onChange={() => toggleBanner(b.id)}
                              disabled={(editing.categories || []).includes(b.category)} />
                            {getImgSrc(b) && (
                              <img src={getImgSrc(b)} alt="" className="showcase-banner-thumb" />
                            )}
                            <span>{b.title || 'Без названия'}</span>
                            {(editing.categories || []).includes(b.category) && (
                              <small style={{ color: '#888' }}>(уже в категории)</small>
                            )}
                          </label>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              {/* Превью */}
              {previewBanners.length > 0 && (
                <div className="form-group">
                  <label>Превью ({previewBanners.length} товаров)</label>
                  <div className="showcase-preview-grid">
                    {previewBanners.slice(0, 8).map(b => (
                      <div key={b.id} className="showcase-preview-item">
                        <img src={getImgSrc(b)} alt={b.title} />
                      </div>
                    ))}
                    {previewBanners.length > 8 && (
                      <div className="showcase-preview-more">
                        +{previewBanners.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditing(null)}>Отмена</button>
              <button className="btn btn-success" onClick={save}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Список витрин */}
      {showcases.length === 0
        ? (
          <div className="empty-state">
            <Link size={60} />
            <p>Нет витрин. Создайте первую!</p>
          </div>
        )
        : (
          <div className="showcases-list">
            {showcases.map(s => {
              const status = getStatus(s);
              return (
                <div key={s.id} className={`showcase-card ${status.cls}`}>
                  <div className="showcase-card-header">
                    <h4>{s.name}</h4>
                    <span className={`showcase-status ${status.cls}`}>{status.label}</span>
                  </div>
                  <div className="showcase-card-info">
                    <p className="showcase-card-url">
                      <Link size={14} /> /v/{s.slug}
                    </p>
                    <p className="showcase-card-meta">
                      {countShowcaseBanners(s)} товаров &bull; до {formatDate(s.expiresAt)}
                    </p>
                    {(s.categories || []).length > 0 && (
                      <p className="showcase-card-cats">
                        Категории: {s.categories.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="showcase-card-actions">
                    <button className="btn btn-outline" onClick={() => copyLink(s.slug)}
                      title="Копировать ссылку">
                      <Copy size={16} />
                      {copyFeedback === s.slug ? 'Скопировано!' : 'Ссылка'}
                    </button>
                    <button className="btn btn-outline" onClick={() => openEdit(s)}
                      title="Редактировать"><Edit2 size={16} /></button>
                    <button className="btn btn-danger" onClick={() => remove(s)}
                      title="Удалить"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
