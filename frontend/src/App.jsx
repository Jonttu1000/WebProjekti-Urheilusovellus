import { useState } from 'react';
import './App.css';

const NAV_CATEGORIES = [
  {
    id: 'kampanjat',
    name: 'KAMPANJAT',
    highlight: true,
    columns: [
      {
        title: 'Ajankohtaiset diilit',
        viewAll: 'Katso kaikki kampanjat',
        items: ['Viikon tarjoukset', 'Jäsentarjoukset (-20 €)', 'Kreatiini + PWO -paketit', 'Poistotuotteet'],
      },
    ],
    visualCards: [
      { title: 'WHEY & KREATIINI', badge: '-25%', tone: 'lime' },
      { title: 'PRE-WORKOUT BUNDLE', badge: 'UUTUUS', tone: 'dark' },
    ],
  },
  {
    id: 'lihaskasvu',
    name: 'Lihaskasvu',
    columns: [
      {
        title: 'Voima & massa',
        viewAll: 'Katso lihaskasvutuotteet',
        items: ['Kreatiini', 'Heraproteiini (Whey)', 'Isolaatti', 'Massanlisääjät'],
      },
      {
        title: 'Palautuminen',
        viewAll: 'Katso palautuminen',
        items: ['EAA & BCAA', 'Glutamiini', 'Palautusjuomat'],
      },
    ],
    visualCards: [
      { title: 'KREATIINI', badge: 'SUOSITUIN', tone: 'light' },
      { title: 'WHEY PROTEIN', badge: 'PROTEIINI', tone: 'light' },
    ],
  },
  {
    id: 'energia',
    name: 'Energia',
    columns: [
      {
        title: 'Ennen treeniä',
        viewAll: 'Katso energiatuotteet',
        items: ['Pre-workout (PWO)', 'Kofeiinitabletit', 'Beeta-alaniini', 'Sitrulliini'],
      },
    ],
    visualCards: [
      { title: 'PRE-WORKOUT', badge: 'TEHOA', tone: 'lime' },
      { title: 'ENERGIAJUOMAT', badge: '0 SOKERIA', tone: 'light' },
    ],
  },
  {
    id: 'lisaravinteet',
    name: 'Lisäravinteet',
    columns: [
      {
        title: 'Hyvinvointi',
        viewAll: 'Katso kaikki lisäravinteet',
        items: ['Monivitamiinit', 'Omega-3', 'Magnesium & sinkki', 'D-vitamiini'],
      },
    ],
    visualCards: [
      { title: 'VITAMIINIT', badge: 'PERUS', tone: 'light' },
      { title: 'OMEGA-3', badge: 'TERVEYS', tone: 'light' },
    ],
  },
  { id: 'varusteet', name: 'Shakerit & Varusteet', columns: [], visualCards: [] },
  { id: 'patukat', name: 'Patukat & Välipalat', columns: [], visualCards: [] },
];

const FEATURED_CARDS = [
  { title: 'KREATIINI', subtitle: 'Voimaa & tehoa', badge: 'TOP', tone: 'lime' },
  { title: 'PRE-WORKOUT', subtitle: 'Fokus & energia', badge: 'PWO', tone: 'dark' },
  { title: 'SHEIKKERIT', subtitle: 'Treenikassiin', badge: 'VARUSTE', tone: 'light' },
  { title: 'HERAPROTEIINI', subtitle: 'Palautumiseen', badge: 'WHEY', tone: 'light' },
  { title: 'EAA & BCAA', subtitle: 'Treenin aikana', badge: 'AMINO', tone: 'light' },
  { title: 'PAKETIT', subtitle: 'Säästä enemmän', badge: 'DIILI', tone: 'lime' },
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const selectedCategory = NAV_CATEGORIES.find(
      (cat) => cat.id === activeCategory && (cat.columns.length > 0 || cat.visualCards.length > 0)
  );

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Haku Aktiivissa:', searchQuery);
  };

  return (
      <div className="page-shell" onMouseLeave={() => setActiveCategory(null)}>
        <div className="top-trust-bar">
          <div className="container trust-inner">
            <span>AKTIIVI — KREATIINIT, PRE-WORKOUT JA TREENIVARUSTEET</span>
            <div className="trust-links">
              <a href="#diilit">Kampanjat</a>
              <a href="#loyalty">Loyalty-edut</a>
              <a href="#tuki">Asiakaspalvelu</a>
            </div>
          </div>
        </div>

        <header className="main-header">
          <div className="container header-row">
            <a href="#top" className="brand-logo">
              <span className="brand-mark">A</span>
              <span className="brand-text">
              <strong>AKTIIVI</strong>
              <small>SPORTS &amp; NUTRITION</small>
            </span>
            </a>

            <form className="header-search" onSubmit={handleSearch}>
              <span className="search-loupe" aria-hidden="true">🔍</span>
              <input
                  type="text"
                  placeholder="Etsi Aktiivista (esim. kreatiini, pre-workout, whey)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <div className="header-tools">
              <button type="button" className="tool-btn">
                <span aria-hidden="true">👤</span>
                <span>Kirjaudu</span>
              </button>

              <button
                  type="button"
                  className="tool-btn icon-only"
                  onClick={() => setFavoritesCount((f) => f + 1)}
                  title="Suosikit"
                  aria-label="Suosikit"
              >
                <span className="tool-icon" aria-hidden="true">♡</span>
                {favoritesCount > 0 && <span className="mini-pill">{favoritesCount}</span>}
              </button>

              <button
                  type="button"
                  className="tool-btn icon-only"
                  onClick={() => setCartCount((c) => c + 1)}
                  title="Ostoskori"
                  aria-label="Ostoskori"
              >
                <span className="tool-icon" aria-hidden="true">🛒</span>
                <span className="cart-counter">{cartCount}</span>
              </button>
            </div>
          </div>

          <nav className="nav-strip" aria-label="Tuotekategoriat">
            <div className="container nav-items">
              {NAV_CATEGORIES.map((cat) => (
                  <button
                      key={cat.id}
                      type="button"
                      className={`nav-cat-btn ${cat.highlight ? 'nav-cat-highlight' : ''} ${
                          activeCategory === cat.id ? 'is-open' : ''
                      }`}
                      onMouseEnter={() => setActiveCategory(cat.id)}
                      onClick={() =>
                          setActiveCategory(activeCategory === cat.id ? null : cat.id)
                      }
                  >
                    {cat.name}
                  </button>
              ))}
            </div>
          </nav>

          {selectedCategory && (
              <div className="dropdown-panel">
                <div className="container dropdown-grid">
                  <div className="dropdown-links-col">
                    {selectedCategory.columns.map((col) => (
                        <div key={col.title} className="link-group">
                          <h4>{col.title}</h4>
                          <a href={`#${col.title}`} className="group-all">
                            {col.viewAll} &rsaquo;
                          </a>
                          <ul>
                            {col.items.map((item) => (
                                <li key={item}>
                                  <a href={`#${item}`}>{item}</a>
                                </li>
                            ))}
                          </ul>
                        </div>
                    ))}
                  </div>

                  {selectedCategory.visualCards.length > 0 && (
                      <div className="dropdown-cards-col">
                        {selectedCategory.visualCards.map((card) => (
                            <a
                                key={card.title}
                                href={`#${card.title}`}
                                className={`visual-tile tile-${card.tone}`}
                            >
                              <span className="tile-tag">{card.badge}</span>
                              <strong>{card.title}</strong>
                            </a>
                        ))}
                      </div>
                  )}
                </div>
              </div>
          )}
        </header>

        <div className="announcement-bar">
          <div className="container">
            AKTIIVI TREENIVIIKKO &amp; LOYALTY-PISTEET KÄYNNISSÄ — <a href="#kampanjat">Katso diilit</a>
          </div>
        </div>

        <main className="container content-area">
          <section className="promo-hero">
            <article className="hero-panel panel-dark">
              <span className="tag-lime">AKTIIVI JÄSENTARJOUS!</span>
              <h2>
                <span className="text-red">20€</span> bonuskuponki
              </h2>
              <p>jokaisesta 100€ ostoksesta + kerää loyalty-pisteitä</p>
              <a href="#ostoksille" className="btn-light">
                Ostoksille &rarr;
              </a>
            </article>

            <article className="hero-panel panel-accent">
              <span className="tag-lime">VIIKON DIILI</span>
              <h3>100% Creatine Monohydrate 500g</h3>
              <div className="price-line">
                <span className="price-now">19,90€</span>
                <span className="price-off">-33%</span>
                <span className="price-was">Aiempi hinta 29,90€</span>
              </div>
              <a href="#osta" className="btn-light">
                Osta tästä &rarr;
              </a>
            </article>
          </section>

          <section className="showcase-section" aria-label="Suositut kategoriat">
            <div className="section-heading">
              <h2>Suositut tuoteryhmät Aktiivissa</h2>
              <a href="#kaikki">Katso kaikki tuotteet &rsaquo;</a>
            </div>

            <div className="showcase-grid">
              {FEATURED_CARDS.map((card) => (
                  <a
                      key={card.title}
                      href={`#${card.title}`}
                      className={`showcase-card card-${card.tone}`}
                  >
                    <span className="card-chip">{card.badge}</span>
                    <strong>{card.title}</strong>
                    <span>{card.subtitle}</span>
                  </a>
              ))}
            </div>
          </section>
        </main>
      </div>
  );
}
