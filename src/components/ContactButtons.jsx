import { useState, useEffect } from 'react';
import { Phone, MessageCircle, Send, ChevronUp } from 'lucide-react';

export default function ContactButtons({ companyInfo }) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="contact-buttons">
      {showScrollTop && (
        <button className="contact-btn scroll-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ChevronUp size={24} />
        </button>
      )}
      <a href={`tel:${companyInfo.phone?.replace(/\D/g, '')}`} className="contact-btn phone">
        <Phone size={24} />
      </a>
      {companyInfo.whatsapp && (
        <a href={companyInfo.whatsapp} target="_blank" rel="noopener noreferrer"
          className="contact-btn whatsapp"><MessageCircle size={24} /></a>
      )}
      {companyInfo.telegram && (
        <a href={companyInfo.telegram} target="_blank" rel="noopener noreferrer"
          className="contact-btn telegram"><Send size={24} /></a>
      )}
      {companyInfo.max && (
        <a href={companyInfo.max} target="_blank" rel="noopener noreferrer"
          className="contact-btn max"><MessageCircle size={24} /></a>
      )}
    </div>
  );
}
