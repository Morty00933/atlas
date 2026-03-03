import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Image, ArrowLeft, Package } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BANNERS_PER_PAGE } from '../lib/constants';
import { getImgSrc } from '../lib/storage';
import { formatDate, isExpired } from '../lib/utils';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Lightbox from '../components/Lightbox';
import ContactButtons from '../components/ContactButtons';
import Pagination from '../components/Pagination';

export default function ShowcasePage({ banners, bannerCategories, companyInfo }) {
  const { slug } = useParams();
  const [showcase, setShowcase] = useState(null);
  const [loadingShowcase, setLoadingShowcase] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, 'showcases'), where('slug', '==', slug));
        const snap = await getDocs(q);
        if (snap.empty) {
          setNotFound(true);
        } else {
          setShowcase({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
      }
      setLoadingShowcase(false);
    };
    load();
  }, [slug]);

  const openLightbox = useCallback((src) => setLightboxImage(src), []);
  const closeLightbox = useCallback(() => setLightboxImage(null), []);

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  if (loadingShowcase) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Загрузка витрины...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="app">
        <Header companyInfo={companyInfo} />
        <main className="main-content">
          <div className="showcase-unavailable">
            <h2>Витрина не найдена</h2>
            <p>Возможно, ссылка неверна или витрина была удалена.</p>
            <Link to="/" className="btn btn-primary"><ArrowLeft size={18} /> На главную</Link>
          </div>
        </main>
        <Footer companyInfo={companyInfo} />
      </div>
    );
  }

  if (showcase.active === false || isExpired(showcase.expiresAt)) {
    return (
      <div className="app">
        <Header companyInfo={companyInfo} />
        <main className="main-content">
          <div className="showcase-unavailable">
            <h2>Витрина больше не доступна</h2>
            <p>Срок действия этой витрины истёк.</p>
            <Link to="/" className="btn btn-primary"><ArrowLeft size={18} /> На главную</Link>
          </div>
        </main>
        <Footer companyInfo={companyInfo} />
      </div>
    );
  }

  // Все активные баннеры этой витрины
  const showcaseBanners = banners
    .filter(b => b.active &&
      ((showcase.categories || []).includes(b.category) || (showcase.bannerIds || []).includes(b.id))
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Категории витрины — все выбранные, без проверки наличия баннеров
  const showcaseCats = bannerCategories.filter(cat =>
    cat.active !== false &&
    (showcase.categories || []).includes(cat.name)
  );

  // Баннеры из bannerIds, чья категория не входит в showcase.categories
  const extraBanners = showcaseBanners.filter(b =>
    (showcase.bannerIds || []).includes(b.id) &&
    !(showcase.categories || []).includes(b.category)
  );
  const hasExtraCategory = extraBanners.length > 0;
  const hasCategories = showcaseCats.length > 0 || hasExtraCategory;

  // Баннеры для выбранной категории
  const filteredBanners = selectedCategory === '__extra__'
    ? extraBanners
    : selectedCategory
      ? showcaseBanners.filter(b => b.category === selectedCategory)
      : showcaseBanners;

  const totalPages = Math.ceil(filteredBanners.length / BANNERS_PER_PAGE);
  const paginatedBanners = filteredBanners.slice(
    (currentPage - 1) * BANNERS_PER_PAGE,
    currentPage * BANNERS_PER_PAGE
  );

  const renderBannerGrid = () => (
    <>
      <div className="banners-public-grid">
        {paginatedBanners.map(banner =>
          banner.link
            ? (
              <a key={banner.id} href={banner.link} className="banner-public-card"
                target={banner.link.startsWith('http') ? '_blank' : '_self'}
                rel={banner.link.startsWith('http') ? 'noopener noreferrer' : undefined}>
                <img src={getImgSrc(banner)} alt={banner.title || 'Баннер'} loading="lazy" />
              </a>
            ) : (
              <div key={banner.id} className="banner-public-card clickable"
                onClick={() => openLightbox(getImgSrc(banner))}>
                <img src={getImgSrc(banner)} alt={banner.title || 'Баннер'} loading="lazy" />
              </div>
            )
        )}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages}
        onPageChange={setCurrentPage} />
    </>
  );

  return (
    <div className="app">
      <Header companyInfo={companyInfo}
        rightContent={
          <Link to="/" className="btn btn-secondary"><ArrowLeft size={18} /> На главную</Link>
        }
      />

      <Lightbox image={lightboxImage} onClose={closeLightbox} />

      <main className="main-content">
        <div className="showcase-header">
          <h1 className="showcase-title">{showcase.name}</h1>
          <div className="showcase-notice">
            Витрина действует до: {formatDate(showcase.expiresAt)}
          </div>
        </div>

        {hasCategories ? (
          !selectedCategory ? (
            <div className="categories-public-section">
              <div className="categories-public-grid">
                {showcaseCats.map(cat => (
                  <div key={cat.id} className="category-public-card"
                    onClick={() => handleCategoryChange(cat.name)}>
                    {getImgSrc(cat)
                      ? <img src={getImgSrc(cat)} alt={cat.name} className="category-public-image" loading="lazy" />
                      : <div className="category-public-placeholder"><Package size={48} /></div>}
                    <div className="category-public-name">
                      <span>{cat.name}</span>
                      <small>{banners.filter(b => b.active && b.category === cat.name).length} товаров</small>
                    </div>
                  </div>
                ))}
                {hasExtraCategory && (
                  <div className="category-public-card"
                    onClick={() => handleCategoryChange('__extra__')}>
                    <div className="category-public-placeholder"><Package size={48} /></div>
                    <div className="category-public-name">
                      <span>Другое</span>
                      <small>{extraBanners.length} товаров</small>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <section className="banners-section">
              <div className="category-back-header">
                <button className="back-btn" onClick={() => handleCategoryChange(null)}>
                  &larr; Назад к категориям
                </button>
                <h2 className="category-title">
                  {selectedCategory === '__extra__' ? 'Другое' : selectedCategory}
                </h2>
              </div>
              {paginatedBanners.length === 0
                ? <div className="empty-state"><Image size={60} /><p>Нет товаров</p></div>
                : renderBannerGrid()
              }
            </section>
          )
        ) : (
          <section className="banners-section">
            {paginatedBanners.length === 0
              ? <div className="empty-state"><Image size={60} /><p>Нет товаров в этой витрине</p></div>
              : renderBannerGrid()
            }
          </section>
        )}
      </main>

      <Footer companyInfo={companyInfo} />
      <ContactButtons companyInfo={companyInfo} />
    </div>
  );
}
