import { useState, useCallback } from 'react';
import { Package, Image } from 'lucide-react';
import { BANNERS_PER_PAGE } from '../lib/constants';
import { getImgSrc } from '../lib/storage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Lightbox from '../components/Lightbox';
import ContactButtons from '../components/ContactButtons';
import Pagination from '../components/Pagination';

export default function StorefrontPage({ banners, bannerCategories, companyInfo }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxImage, setLightboxImage] = useState(null);

  const activeCats = bannerCategories.filter(c => c.active !== false);

  const filteredBanners = banners.filter(b => {
    if (!b.active) return false;
    if (!selectedCategory) return true;
    return b.category === selectedCategory;
  });

  const totalPages = Math.ceil(filteredBanners.length / BANNERS_PER_PAGE);
  const paginatedBanners = filteredBanners.slice(
    (currentPage - 1) * BANNERS_PER_PAGE,
    currentPage * BANNERS_PER_PAGE
  );

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const openLightbox = useCallback((src) => setLightboxImage(src), []);
  const closeLightbox = useCallback(() => setLightboxImage(null), []);

  return (
    <div className="app">
      <Header companyInfo={companyInfo} />
      <Lightbox image={lightboxImage} onClose={closeLightbox} />

      <main className="main-content">
        {/* Если категория не выбрана и есть активные категории */}
        {!selectedCategory && activeCats.length > 0 ? (
          <div className="categories-public-section">
            <div className="categories-public-grid">
              {activeCats.map(cat => (
                <div key={cat.id} className="category-public-card"
                  onClick={() => handleCategoryChange(cat.name)}>
                  {getImgSrc(cat)
                    ? <img src={getImgSrc(cat)} alt={cat.name} className="category-public-image" loading="lazy" />
                    : <div className="category-public-placeholder"><Package size={48} /></div>}
                  <div className="category-public-name">
                    <span>{cat.name}</span>
                    <small>{banners.filter(b => b.category === cat.name && b.active !== false).length} товаров</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <section className="banners-section">
            {selectedCategory && activeCats.length > 0 && (
              <div className="category-back-header">
                <button className="back-btn" onClick={() => handleCategoryChange(null)}>
                  &larr; Назад к категориям
                </button>
                <h2 className="category-title">{selectedCategory}</h2>
              </div>
            )}
            {paginatedBanners.length === 0
              ? <div className="empty-state"><Image size={60} /><p>Нет товаров в этой категории</p></div>
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
        )}
      </main>

      <Footer companyInfo={companyInfo} />
      <ContactButtons companyInfo={companyInfo} />
    </div>
  );
}
