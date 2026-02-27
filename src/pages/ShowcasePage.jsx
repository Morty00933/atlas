import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Image, ArrowLeft } from 'lucide-react';
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

  // Загрузка
  if (loadingShowcase) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Загрузка витрины...</p>
      </div>
    );
  }

  // Не найдена
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

  // Истекла или выключена
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

  // Фильтруем баннеры для этой витрины
  const showcaseBanners = banners
    .filter(b => b.active &&
      ((showcase.categories || []).includes(b.category) || (showcase.bannerIds || []).includes(b.id))
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const totalPages = Math.ceil(showcaseBanners.length / BANNERS_PER_PAGE);
  const paginatedBanners = showcaseBanners.slice(
    (currentPage - 1) * BANNERS_PER_PAGE,
    currentPage * BANNERS_PER_PAGE
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
        {/* Заголовок витрины */}
        <div className="showcase-header">
          <h1 className="showcase-title">{showcase.name}</h1>
          <div className="showcase-notice">
            Витрина действует до: {formatDate(showcase.expiresAt)}
          </div>
        </div>

        {/* Баннеры */}
        <section className="banners-section">
          {paginatedBanners.length === 0
            ? <div className="empty-state"><Image size={60} /><p>Нет товаров в этой витрине</p></div>
            : (<>
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
            </>)}
        </section>
      </main>

      <Footer companyInfo={companyInfo} />
      <ContactButtons companyInfo={companyInfo} />
    </div>
  );
}
