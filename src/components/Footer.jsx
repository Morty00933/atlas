import { MapPin, Phone, Clock, Send, MessageCircle } from 'lucide-react';

export default function Footer({ companyInfo }) {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>{companyInfo.name}</h3>
          <p>{companyInfo.description}</p>
        </div>
        <div className="footer-section">
          <h3>Контакты</h3>
          <p><MapPin size={16} /> {companyInfo.address}</p>
          <p><Phone size={16} />
            <a href={`tel:${companyInfo.phone?.replace(/\D/g, '')}`}>{companyInfo.phone}</a>
          </p>
          <p><Clock size={16} /> {companyInfo.workHours}</p>
        </div>
        <div className="footer-section">
          <h3>Мессенджеры</h3>
          {companyInfo.telegram && (
            <p><Send size={16} />
              <a href={companyInfo.telegram} target="_blank" rel="noopener noreferrer">Telegram</a>
            </p>
          )}
          {companyInfo.whatsapp && (
            <p><MessageCircle size={16} />
              <a href={companyInfo.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </p>
          )}
          {companyInfo.max && (
            <p><MessageCircle size={16} />
              <a href={companyInfo.max} target="_blank" rel="noopener noreferrer">Max</a>
            </p>
          )}
        </div>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} {companyInfo.name}. Все права защищены.
      </div>
    </footer>
  );
}
