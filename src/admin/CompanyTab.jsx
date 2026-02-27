import { useRef } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';

export default function CompanyTab({ companyInfo, setCompanyInfo }) {
  const timeout = useRef(null);

  const saveDebounced = (info) => {
    setCompanyInfo(info);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(async () => {
      try {
        const snap = await getDocs(collection(db, 'companyInfo'));
        if (snap.empty) {
          await addDoc(collection(db, 'companyInfo'), info);
        } else {
          await updateDoc(doc(db, 'companyInfo', snap.docs[0].id), info);
        }
      } catch (err) {
        console.error(err);
      }
    }, 1000);
  };

  return (
    <div className="company-form">
      <div className="form-group">
        <label>Название компании</label>
        <input value={companyInfo.name || ''}
          onChange={e => saveDebounced({ ...companyInfo, name: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Телефон</label>
        <input value={companyInfo.phone || ''}
          onChange={e => saveDebounced({ ...companyInfo, phone: e.target.value })}
          placeholder="8 937 151 87 58" />
      </div>
      <div className="form-group">
        <label>Адрес</label>
        <input value={companyInfo.address || ''}
          onChange={e => saveDebounced({ ...companyInfo, address: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Часы работы</label>
        <input value={companyInfo.workHours || ''}
          onChange={e => saveDebounced({ ...companyInfo, workHours: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Telegram (ссылка)</label>
        <input value={companyInfo.telegram || ''}
          onChange={e => saveDebounced({ ...companyInfo, telegram: e.target.value })}
          placeholder="https://t.me/tk_atlas" />
      </div>
      <div className="form-group">
        <label>WhatsApp (ссылка)</label>
        <input value={companyInfo.whatsapp || ''}
          onChange={e => saveDebounced({ ...companyInfo, whatsapp: e.target.value })}
          placeholder="https://chat.whatsapp.com/..." />
      </div>
      <div className="form-group">
        <label>Max (ссылка)</label>
        <input value={companyInfo.max || ''}
          onChange={e => saveDebounced({ ...companyInfo, max: e.target.value })}
          placeholder="https://max.ru/join/..." />
      </div>
      <div className="form-group full-width">
        <label>Описание</label>
        <textarea rows={3} value={companyInfo.description || ''}
          onChange={e => saveDebounced({ ...companyInfo, description: e.target.value })} />
      </div>
    </div>
  );
}
