export default function Header({ companyInfo, rightContent }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <img src="/logo.jpg" alt="Атлас" className="logo-img"
            onError={e => { e.target.style.display = 'none'; }} />
          <span>{companyInfo.name || 'Атлас'}</span>
        </div>
        {rightContent && (
          <div className="header-actions">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
}
