import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { defaultCompanyInfo } from '../lib/constants';
import { saveCache, loadCache } from '../lib/cache';

export function useFirestoreData() {
  const [banners, setBanners] = useState(() => loadCache('banners') || []);
  const [bannerCategories, setBannerCategories] = useState(() => loadCache('categories') || []);
  const [companyInfo, setCompanyInfo] = useState(() => ({
    ...defaultCompanyInfo,
    ...(loadCache('company') || {})
  }));
  const [loading, setLoading] = useState(true);

  // Если есть кэш — сразу скрываем спиннер
  useEffect(() => {
    const hasCachedData =
      loadCache('banners') !== null || loadCache('categories') !== null;
    if (hasCachedData) setLoading(false);
  }, []);

  // Firebase подписки
  useEffect(() => {
    let doneA = false, doneB = false;
    const check = () => { if (doneA && doneB) setLoading(false); };

    const unsubBanners = onSnapshot(collection(db, 'banners'), (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setBanners(data);
      saveCache('banners', data);
      doneA = true; check();
    }, () => { doneA = true; check(); });

    const unsubCats = onSnapshot(collection(db, 'bannerCategories'), (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setBannerCategories(data);
      saveCache('categories', data);
      doneB = true; check();
    }, () => { doneB = true; check(); });

    const unsubCompany = onSnapshot(collection(db, 'companyInfo'), (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setCompanyInfo({ ...defaultCompanyInfo, ...data });
        saveCache('company', data);
      }
    });

    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
      unsubBanners(); unsubCats(); unsubCompany(); clearTimeout(timeout);
    };
  }, []);

  return { banners, bannerCategories, companyInfo, setCompanyInfo, loading };
}
