import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Lightbox({ image, onClose }) {
  useEffect(() => {
    if (!image) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}><X size={32} /></button>
      <img src={image} alt="" className="lightbox-image"
        onClick={e => e.stopPropagation()} />
    </div>
  );
}
