import { useState, useEffect } from 'react';
import { Settings, LogOut, Package, Image } from 'lucide-react';
import { BANNERS_PER_PAGE } from '../lib/constants';
import { getImgSrc } from '../lib/storage';
import Header from '../components/Header';
import Lightbox from '../components/Lightbox';
import Pagination from '../components/Pagination';
import AdminLogin from '../admin/AdminLogin';
import BannersTab from '../admin/BannersTab';
import CategoriesTab from '../admin/CategoriesTab';
import CompanyTab from '../admin/CompanyTab';
import ShowcasesTab from '../admin/ShowcasesTab';

export default function AdminPage({ banners, bannerCategories, companyInfo, setCompanyInfo }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('banners');
  const [selectedBannerCategory, setSelectedBannerCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('adminAuth');
    if (savedAuth === 'true') setIsAdmin(true);
  }, []);

  useEffect(() => { setCurrentPage(1); }, [selectedBannerCategory]);

  const handleLogin = () => {
    setIsAdmin(true);
    localStorage.setItem('adminAuth', 'true');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('adminAuth');
  };

  if (!isAdmin) {
    return (
      <div className="app">
        <Header companyInfo={companyInfo} />
        <main className="main-content">
          <AdminLogin onLogin={handleLogin} />
        </main>
      </div>
    );
  }

  // Фильтрация и пагинация для превью
  const filteredBanners = banners.filter(b => {
    if (!selectedBannerCategory) return true;
    return b.category === selectedBannerCategory;
  });

  const totalPages = Math.ceil(filteredBanners.length / BANNERS_PER_PAGE);
  const paginatedBanners = filteredBanners.slice(
    (currentPage - 1) * BANNERS_PER_PAGE,
    currentPage * BANNERS_PER_PAGE
  );

  const tabs = [
    { key: 'banners', label: 'Баннеры' },
    { key: 'banner-categories', label: 'Категории' },
    { key: 'showcases', label: 'Витрины' },
    { key: 'company', label: 'О компании' },
  ];

  return (
    <div className="app">
      <Header companyInfo={companyInfo}
        rightContent={
          <button className="btn btn-danger" onClick={handleLogout}>
            <LogOut size={18} /> Выйти
          </button>
        }
      />

      <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />

      <main className="main-content">
        <div className="admin-panel">
          <div className="admin-header">
            <h2 className="admin-title"><Settings size={24} /> Админ-панель</h2>
          </div>

          <div className="admin-tabs">
            {tabs.map(tab => (
              <button key={tab.key}
                className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'banners' && (
            <BannersTab banners={banners} bannerCategories={bannerCategories} />
          )}
          {activeTab === 'banner-categories' && (
            <CategoriesTab banners={banners} bannerCategories={bannerCategories} />
          )}
          {activeTab === 'showcases' && (
            <ShowcasesTab banners={banners} bannerCategories={bannerCategories} />
          )}
          {activeTab === 'company' && (
            <CompanyTab companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />
          )}
        </div>

        {/* Превью баннеров */}
        {bannerCategories.length > 0 && (
          <div className="banner-category-tabs">
            <div
              className={`banner-category-card ${!selectedBannerCategory ? 'active' : ''}`}
              onClick={() => setSelectedBannerCategory(null)}>
              <div className="category-card-icon"><Package size={24} /></div>
              <span>Все</span>
            </div>
            {bannerCategories.map(cat => (
              <div key={cat.id}
                className={`banner-category-card ${selectedBannerCategory === cat.name ? 'active' : ''} ${cat.active === false ? 'cat-hidden' : ''}`}
                onClick={() => setSelectedBannerCategory(cat.name)}>
                {getImgSrc(cat)
                  ? <img src={getImgSrc(cat)} alt={cat.name} className="category-card-image" loading="lazy" />
                  : <div className="category-card-icon"><Package size={24} /></div>}
                <span>{cat.name}{cat.active === false ? ' \ud83d\ude48' : ''}</span>
              </div>
            ))}
          </div>
        )}

        <section className="banners-section">
          {paginatedBanners.length === 0
            ? <div className="empty-state"><Image size={60} /><p>Нет баннеров в этой категории</p></div>
            : (<>
              <div className="banners-public-grid">
                {paginatedBanners.map(banner =>
                  banner.link
                    ? (
                      <a key={banner.id} href={banner.link} className={`banner-public-card ${!banner.active ? 'banner-card-inactive' : ''}`}
                        target={banner.link.startsWith('http') ? '_blank' : '_self'}
                        rel={banner.link.startsWith('http') ? 'noopener noreferrer' : undefined}>
                        <img src={getImgSrc(banner)} alt={banner.title || 'Баннер'} loading="lazy" />
                        {!banner.active && <div className="banner-inactive-badge">Скрыт</div>}
                      </a>
                    ) : (
                      <div key={banner.id} className={`banner-public-card clickable ${!banner.active ? 'banner-card-inactive' : ''}`}
                        onClick={() => setLightboxImage(getImgSrc(banner))}>
                        <img src={getImgSrc(banner)} alt={banner.title || 'Баннер'} loading="lazy" />
                        {!banner.active && <div className="banner-inactive-badge">Скрыт</div>}
                      </div>
                    )
                )}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages}
                onPageChange={setCurrentPage} />
            </>)}
        </section>
      </main>
    </div>
  );
}
