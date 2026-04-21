import Link from 'next/link';

export default function Header({ activePage, onNavigate }) {
  return (
    <header>
      <div className="header-top">
        <span className="site-name" onClick={() => onNavigate('home')}>
          Shamik Deshmukh
        </span>
        <nav>
          <a
            href="#"
            id="nav-home"
            className={activePage === 'home' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
          >
            Home
          </a>
          <a
            href="#"
            id="nav-about"
            className={activePage === 'about' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); onNavigate('about'); }}
          >
            About
          </a>
          <a
            href="#"
            id="nav-contact"
            className={activePage === 'contact' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); onNavigate('contact'); }}
          >
            Contact
          </a>
        </nav>
      </div>
      <hr className="header-divider" />
      <div className="header-sub">
        <span className="tagline">Fashion and Commercial Photographer, Mumbai</span>
        <div className="social-links">
          <a href="https://www.behance.net/shamikdeshmukh" target="_blank" rel="noopener noreferrer">
            Behance
          </a>
          <a href="#">Instagram</a>
        </div>
      </div>
    </header>
  );
}
