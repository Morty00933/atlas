import { Routes, Route } from 'react-router-dom';
import { useFirestoreData } from './hooks/useFirestoreData';
import StorefrontPage from './pages/StorefrontPage';
import AdminPage from './pages/AdminPage';
import ShowcasePage from './pages/ShowcasePage';
import './App.css';

function App() {
  const { banners, bannerCategories, companyInfo, setCompanyInfo, loading } = useFirestoreData();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        <StorefrontPage
          banners={banners}
          bannerCategories={bannerCategories}
          companyInfo={companyInfo}
        />
      } />
      <Route path="/admin" element={
        <AdminPage
          banners={banners}
          bannerCategories={bannerCategories}
          companyInfo={companyInfo}
          setCompanyInfo={setCompanyInfo}
        />
      } />
      <Route path="/v/:slug" element={
        <ShowcasePage
          banners={banners}
          bannerCategories={bannerCategories}
          companyInfo={companyInfo}
        />
      } />
    </Routes>
  );
}

export default App;
