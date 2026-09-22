import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { useAuth } from "../context/AuthContext";
import { useCategoryNav } from "../lib/useCategoryNav";
import { useProducts } from "../lib/useProducts";
import { searchProducts } from "../lib/search";
import { formatPrice } from "../lib/format";
import { IconSearch, IconUser, IconHeart, IconCart, IconMenu } from "./icons";

export function Header() {
  const { cartCount, wishlist, openDrawer } = useStore();
  const { user } = useAuth();
  const navCategories = useCategoryNav();
  const products = useProducts();
  const navigate = useNavigate();
  const [openCats, setOpenCats] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (openSearch) searchInputRef.current?.focus();
  }, [openSearch]);

  const suggestions = useMemo(
    () => searchProducts(products ?? [], query, 6),
    [products, query]
  );
  const showSuggest = openSearch && query.trim().length > 0;

  const closeSearch = () => { setOpenSearch(false); setQuery(""); setActive(-1); };
  const goToResults = () => {
    const q = query.trim();
    if (!q) return;
    closeSearch();
    navigate(`/category/all?q=${encodeURIComponent(q)}`);
  };
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && suggestions[active]) { closeSearch(); navigate(`/product/${suggestions[active].id}`); return; }
    goToResults();
  };
  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
  };

  useEffect(() => {
    if (!openCats && !openSearch) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpenCats(false); setOpenSearch(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCats, openSearch]);

  return (
    <>
      <div className="topbar">
        <div className="container">
          <span className="topbar-full">Authentic products only · Professional advice in-store &amp; online</span>
          <span className="topbar-short">Authentic products · Cash on delivery</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container">
          <div className="nav">
            <div className="nav-left">
              <button
                className="icon-btn nav-toggle"
                type="button"
                aria-expanded={openCats}
                aria-controls="catbar"
                aria-label="Open menu"
                onClick={() => setOpenCats((v) => !v)}
              >
                <IconMenu />
              </button>
              <nav className="nav-links" aria-label="Primary">
                <Link to="/category/all">Shop</Link>
                <Link to="/brands">Our Brands</Link>
                <button
                  type="button"
                  className="nav-link-btn"
                  aria-expanded={openCats}
                  aria-controls="catbar"
                  onClick={() => setOpenCats((v) => !v)}
                >
                  Categories
                </button>
              </nav>
            </div>

            <Link className="brand" to="/" aria-label="BHC Bingo — home">
              <img className="brand-logo" src="/img/logo.png" alt="" width={343} height={283} />
              <span className="brand-name">BINGO</span>
            </Link>

            <div className="nav-actions">
              <button className="icon-btn nav-search" type="button" aria-label="Search" aria-expanded={openSearch} onClick={() => setOpenSearch((v) => !v)}>
                <IconSearch />
              </button>
              <Link className="icon-btn nav-account" to="/account" aria-label={user ? "My account (signed in)" : "Account"} title={user ? user.email : "Sign in"}>
                <IconUser />
                {user ? <span className="nav-account-dot" aria-hidden="true" /> : null}
              </Link>
              <Link className="icon-btn nav-wishlist" to="/wishlist" aria-label={`Wishlist, ${wishlist.length} items`}>
                <IconHeart size={22} />
                {wishlist.length > 0 ? <span className="badge" key={wishlist.length} aria-hidden="true">{wishlist.length}</span> : null}
              </Link>
              <button className="icon-btn" type="button" onClick={openDrawer} aria-label={`Shopping cart, ${cartCount} items`} aria-haspopup="dialog">
                <IconCart />
                {cartCount > 0 ? <span className="badge" key={cartCount} aria-hidden="true">{cartCount}</span> : null}
              </button>
            </div>
          </div>

          <div className="header-search-wrap">
            <form className={`header-search${openSearch ? " open" : ""}`} role="search" onSubmit={submitSearch}>
              <span className="search-icon"><IconSearch /></span>
              <label htmlFor="site-search" className="visually-hidden">Search products</label>
              <input
                ref={searchInputRef}
                id="site-search" type="search" name="q" placeholder="Search products, brands…"
                autoComplete="off" tabIndex={openSearch ? 0 : -1}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(-1); }}
                onKeyDown={onSearchKey}
                role="combobox" aria-expanded={showSuggest} aria-controls="search-suggest" aria-autocomplete="list"
              />
            </form>
            {showSuggest ? (
              <div className="search-suggest" id="search-suggest" role="listbox">
                {suggestions.length > 0 ? (
                  <>
                    {suggestions.map((p, i) => (
                      <Link
                        key={p.id}
                        className={`search-suggest-item${i === active ? " active" : ""}`}
                        to={`/product/${p.id}`}
                        role="option"
                        aria-selected={i === active}
                        onMouseEnter={() => setActive(i)}
                        onClick={closeSearch}
                      >
                        <span className="ss-thumb"><img src={p.image} alt="" loading="lazy" /></span>
                        <span className="ss-text">
                          <span className="ss-title">{p.title}</span>
                          <span className="ss-meta"><span className="ss-brand">{p.brand}</span> · {formatPrice(p.priceMillimes)}</span>
                        </span>
                      </Link>
                    ))}
                    <button type="button" className="search-suggest-all" onClick={goToResults}>
                      See all results for “{query.trim()}”
                    </button>
                  </>
                ) : (
                  <p className="search-suggest-empty">No matches for “{query.trim()}”. Press Enter to search everything.</p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className={`catmenu${openCats ? " open" : ""}`}>
          <div className="catmenu-overlay" onClick={() => setOpenCats(false)} aria-hidden="true" />
          <nav className="catmenu-panel" id="catbar" aria-label="Product categories" aria-hidden={!openCats}>
            <div className="catmenu-head">
              <span className="catmenu-title">Shop by category</span>
              <button className="catmenu-close" type="button" onClick={() => setOpenCats(false)} aria-label="Close menu">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <ul className="catnav">
              {navCategories.map((c) => (
                <li key={c.slug}>
                  <NavLink to={`/category/${c.slug}`} onClick={() => setOpenCats(false)}>{c.name}</NavLink>
                </li>
              ))}
              <li><NavLink to="/brands" onClick={() => setOpenCats(false)}>Our Brands</NavLink></li>
              <li><NavLink to="/category/promotions" onClick={() => setOpenCats(false)}>Promotions</NavLink></li>
              <li className="catnav-sep"><NavLink to="/wishlist" onClick={() => setOpenCats(false)}>Wishlist</NavLink></li>
              <li><NavLink to="/account" onClick={() => setOpenCats(false)}>My Account</NavLink></li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
