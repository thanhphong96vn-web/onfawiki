import React, { useState, useEffect, useRef } from 'react';
import QRCodeDropdown from './QRCodeDropdown';
import LanguageDropdown from './LanguageDropdown';
import ThemeToggle from './ThemeToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { getPages, getMenus } from '../utils/dataService';
import './Header.css';

function Header({ onPageNavigate }) {
  const { translate } = useLanguage();
  const [showQRDropdown, setShowQRDropdown] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const dropdownRef = useRef(null);
  const qrCodeWrapperRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // Đóng mobile menu khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        // Kiểm tra xem click có phải từ hamburger button không
        const hamburgerBtn = document.querySelector('.mobile-menu-btn');
        if (hamburgerBtn && hamburgerBtn.contains(event.target)) {
          return;
        }
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [showMobileMenu]);

  const toggleMobileDropdown = (menuId) => {
    setMobileDropdown(prev => {
      // Nếu menu này đang mở, đóng nó
      if (prev === menuId) {
        return null;
      } else {
        // Nếu menu này chưa mở, đóng menu khác và mở menu này
        return menuId;
      }
    });
  };

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      try {
        const query = searchQuery.toLowerCase().trim();
        const pagesData = await getPages();
        const menusData = await getMenus();
        
        // Đảm bảo là array
        const pages = Array.isArray(pagesData) ? pagesData : [];
        const menus = Array.isArray(menusData) ? menusData : [];

        const results = [];

        // Search in pages
        pages.forEach(page => {
      const titleMatch = page.title.toLowerCase().includes(query);
      const contentMatch = page.content.toLowerCase().includes(query);
      
      if (titleMatch || contentMatch) {
        results.push({
          id: page.id,
          title: page.title,
          type: 'page',
          matchType: titleMatch ? 'title' : 'content'
        });
      }
    });

    // Search in menus
    menus.forEach(menu => {
      const titleMatch = menu.title.toLowerCase().includes(query);
      
      if (titleMatch && !results.find(r => r.id === menu.id)) {
        results.push({
          id: menu.id,
          title: menu.title,
          type: menu.type === 'parent' ? 'menu' : 'page',
          matchType: 'title'
        });
      }

      // Search in menu children
      if (menu.children) {
        menu.children.forEach(child => {
          const childMatch = child.title.toLowerCase().includes(query);
          if (childMatch && !results.find(r => r.id === child.id)) {
            results.push({
              id: child.id,
              title: child.title,
              type: 'page',
              matchType: 'title',
              parentTitle: menu.title
            });
          }
        });
      }
    });

        setSearchResults(results);
      } catch (error) {
        console.error('Error performing search:', error);
        setSearchResults([]);
      }
    };

    performSearch();
  }, [searchQuery]);

  const handleSearchResultClick = (resultId) => {
    setShowMobileMenu(false);
    setSearchQuery('');
    if (onPageNavigate) {
      onPageNavigate(resultId);
    } else {
      window.location.hash = encodeURIComponent(resultId);
    }
  };

  return (
    <header className="main-header">
      <div className="header-container">
        {/* Logo */}
        <a href="https://onfa.io/" className="header-logo">
          <img src="/logo-onfa-scaled.png" alt="ONFA" className="onfa-logo" />
        </a>

        {/* Navigation Menu */}
        <nav className="header-nav" ref={dropdownRef}>
          {/* What is Onfa Dropdown */}
          <div className="nav-dropdown">
            <a 
              href="https://onfa.io/#whatis" 
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                setOpenDropdown(openDropdown === 'whatis' ? null : 'whatis');
              }}
            >
              {translate('ui_menu_what_is_onfa', 'Onfa là gì')}
              <svg className={`nav-arrow ${openDropdown === 'whatis' ? 'rotated' : ''}`} width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M2 3L4 5L6 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            {openDropdown === 'whatis' && (
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="https://onfa.io/#whatis" onClick={() => setOpenDropdown(null)}>{translate('ui_menu_overview', 'Tổng quan')}</a></li>
                <li><a className="dropdown-item" href="https://onfa.io/about/license" onClick={() => setOpenDropdown(null)}>{translate('ui_menu_license', 'Giấy phép')}</a></li>
                <li><a className="dropdown-item" href="https://onfa.io/about/team" onClick={() => setOpenDropdown(null)}>{translate('ui_menu_team', 'Đội ngũ')}</a></li>
                <li><a className="dropdown-item" href="https://drive.google.com/file/d/1B5myQk8TRo6saTMsA47raZmw7pZCVzBU/view?usp=sharing" target="_blank" rel="noopener noreferrer" onClick={() => setOpenDropdown(null)}>{translate('ui_menu_whitepaper', 'Sách trắng')}</a></li>
              </ul>
            )}
          </div>

          {/* Features Dropdown */}
          <div className="nav-dropdown">
            <a 
              href="#" 
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                setOpenDropdown(openDropdown === 'features' ? null : 'features');
              }}
            >
              {translate('ui_menu_features', 'Tính năng')}
              <svg className={`nav-arrow ${openDropdown === 'features' ? 'rotated' : ''}`} width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M2 3L4 5L6 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            {openDropdown === 'features' && (
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="https://onfa.io/crypto/token/onfa" onClick={() => setOpenDropdown(null)}>{translate('ui_menu_onfa_token', 'Token ONFA')}</a></li>
                <li><a className="dropdown-item" href="https://onfa.io/about/mtt" onClick={() => setOpenDropdown(null)}>{translate('ui_menu_metti_token', 'Token Metti')}</a></li>
                <li><a className="dropdown-item" href="https://onfa.io/about/oho" onClick={() => setOpenDropdown(null)}>{translate('ui_menu_onfa_hope', 'ONFA Hope')}</a></li>
              </ul>
            )}
          </div>

          {/* Benefits */}
          <a href="https://onfa.io/#benefits" className="nav-link">{translate('ui_menu_benefits', 'Lợi ích')}</a>

          {/* Affiliate */}
          <a href="https://onfa.io/about/affiliate" className="nav-link">{translate('ui_menu_affiliate', 'Đối tác')}</a>

          {/* Contact Us */}
          <a href="mailto:support@onfa.io" className="nav-link">{translate('ui_menu_contact_us', 'Liên hệ')}</a>
        </nav>

        {/* Right Side Actions */}
        <div className="header-actions">
          {/* Desktop Actions */}
          <div className="desktop-actions">
            <a href="https://onfa.io/account/login" className="header-btn login-btn">{translate('ui_header_login', 'Đăng nhập')}</a>
            <a href="https://onfa.io/account/register" className="header-btn register-btn">{translate('ui_header_register', 'Đăng ký')}</a>

            <div className="qr-code-wrapper" style={{ position: 'relative' }} ref={qrCodeWrapperRef}>
              <button 
                className="header-icon-btn qr-code-btn" 
                onClick={() => setShowQRDropdown(!showQRDropdown)}
              >
                <svg className="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M20.002 16.0996C20.499 16.0996 20.9023 16.5029 20.9023 17V21.5C20.9023 22.2732 20.2752 22.9004 19.502 22.9004H4.50195C3.72875 22.9004 3.10156 22.2732 3.10156 21.5V17C3.10156 16.5029 3.5049 16.0996 4.00195 16.0996C4.49901 16.0996 4.90234 16.5029 4.90234 17V21.0996H19.1016V17C19.1016 16.5029 19.5049 16.0996 20.002 16.0996ZM12.002 7.09961C12.499 7.09961 12.9023 7.50294 12.9023 8V13.8262L13.8652 12.8633C14.2167 12.5118 14.7872 12.5118 15.1387 12.8633C15.4901 13.2148 15.4901 13.7852 15.1387 14.1367L12.6387 16.6367C12.2872 16.9882 11.7167 16.9882 11.3652 16.6367L8.86523 14.1367L8.80371 14.0684C8.51526 13.7149 8.53568 13.1928 8.86523 12.8633C9.19479 12.5337 9.71681 12.5133 10.0703 12.8018L10.1387 12.8633L11.1016 13.8262V8C11.1016 7.50294 11.5049 7.09961 12.002 7.09961ZM19.502 1.09961C20.2752 1.09961 20.9023 1.7268 20.9023 2.5V7C20.9023 7.49706 20.499 7.90039 20.002 7.90039C19.5049 7.90039 19.1016 7.49706 19.1016 7V2.90039H4.90234V7C4.90234 7.49706 4.49901 7.90039 4.00195 7.90039C3.5049 7.90039 3.10156 7.49706 3.10156 7V2.5C3.10156 1.7268 3.72875 1.09961 4.50195 1.09961H19.502Z" fill="currentColor"></path>
                </svg>
              </button>
              <QRCodeDropdown 
                isOpen={showQRDropdown} 
                onClose={() => setShowQRDropdown(false)}
                buttonRef={qrCodeWrapperRef}
              />
            </div>

            <LanguageDropdown />
            <ThemeToggle />
          </div>

          {/* Mobile Actions */}
          <div className="mobile-actions">
            <a href="https://onfa.io/account/register" className="header-btn register-btn mobile-register-btn">{translate('ui_header_register', 'Đăng ký')}</a>
            <button 
              className="mobile-search-btn"
              onClick={() => setShowSearchPopup(true)}
              aria-label="Search"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <button 
              className="mobile-menu-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showMobileMenu ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Sidebar */}
        {showMobileMenu && (
          <div className="mobile-menu-overlay" onClick={() => {
            setShowMobileMenu(false);
            setSearchQuery('');
            setSearchResults([]);
          }}>
            <div className="mobile-menu-sidebar" ref={mobileMenuRef} onClick={(e) => e.stopPropagation()}>
              {/* Close Button */}
              <button 
                className="mobile-menu-close"
                onClick={() => {
                  setShowMobileMenu(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                aria-label="Close menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              {/* Login and Register Buttons */}
              <div className="mobile-menu-buttons">
                <a href="https://onfa.io/account/login" className="mobile-menu-btn-login" onClick={() => setShowMobileMenu(false)}>
                  {translate('ui_header_login', 'Đăng nhập')}
                </a>
                <a href="https://onfa.io/account/register" className="mobile-menu-btn-register" onClick={() => setShowMobileMenu(false)}>
                  {translate('ui_header_register', 'Đăng ký')}
                </a>
              </div>

              {/* Search Bar */}
              <div className="mobile-menu-search">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="m17 17-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input 
                  type="text" 
                  placeholder={translate('ui_search_placeholder', 'Tìm kiếm')}
                  className="mobile-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Search Results */}
              {searchQuery.trim() && (
                <div className="mobile-search-results">
                  {searchResults.length > 0 ? (
                    <div className="search-results-list">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="search-result-item"
                          onClick={() => handleSearchResultClick(result.id)}
                        >
                          <div className="search-result-title">{result.title}</div>
                          {result.parentTitle && (
                            <div className="search-result-parent">{result.parentTitle}</div>
                          )}
                          <div className="search-result-type">
                            {result.type === 'menu' ? translate('ui_menu', 'Menu') : translate('ui_page', 'Trang')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="search-no-results">
                      {translate('ui_no_results', 'Không tìm thấy kết quả')}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Menu (Header Navigation) */}
              {!searchQuery.trim() && (
              <nav className="mobile-nav">
                <div className="mobile-nav-item" onClick={() => toggleMobileDropdown('whatis')}>
                  <span className="mobile-nav-text">{translate('ui_menu_what_is_onfa', 'Onfa là gì')}</span>
                  <svg className={`mobile-nav-arrow ${mobileDropdown === 'whatis' ? 'expanded' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {mobileDropdown === 'whatis' && (
                  <div className="mobile-dropdown">
                    <a href="https://onfa.io/#whatis" className="mobile-dropdown-item" onClick={() => { setShowMobileMenu(false); setMobileDropdown(null); }}>{translate('ui_menu_overview', 'Tổng quan')}</a>
                    <a href="https://onfa.io/about/license" className="mobile-dropdown-item" onClick={() => { setShowMobileMenu(false); setMobileDropdown(null); }}>{translate('ui_menu_license', 'Giấy phép')}</a>
                    <a href="https://onfa.io/about/team" className="mobile-dropdown-item" onClick={() => { setShowMobileMenu(false); setMobileDropdown(null); }}>{translate('ui_menu_team', 'Đội ngũ')}</a>
                    <a href="https://drive.google.com/file/d/1B5myQk8TRo6saTMsA47raZmw7pZCVzBU/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="mobile-dropdown-item" onClick={() => { setShowMobileMenu(false); setMobileDropdown(null); }}>{translate('ui_menu_whitepaper', 'Sách trắng')}</a>
                  </div>
                )}

                <div className="mobile-nav-item" onClick={() => toggleMobileDropdown('features')}>
                  <span className="mobile-nav-text">{translate('ui_menu_features', 'Tính năng')}</span>
                  <svg className={`mobile-nav-arrow ${mobileDropdown === 'features' ? 'expanded' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {mobileDropdown === 'features' && (
                  <div className="mobile-dropdown">
                    <a href="https://onfa.io/crypto/token/onfa" className="mobile-dropdown-item" onClick={() => { setShowMobileMenu(false); setMobileDropdown(null); }}>{translate('ui_menu_onfa_token', 'Token ONFA')}</a>
                    <a href="https://onfa.io/about/mtt" className="mobile-dropdown-item" onClick={() => { setShowMobileMenu(false); setMobileDropdown(null); }}>{translate('ui_menu_metti_token', 'Token Metti')}</a>
                    <a href="https://onfa.io/about/oho" className="mobile-dropdown-item" onClick={() => { setShowMobileMenu(false); setMobileDropdown(null); }}>{translate('ui_menu_onfa_hope', 'ONFA Hope')}</a>
                  </div>
                )}

                <a href="https://onfa.io/#benefits" className="mobile-nav-item" onClick={() => setShowMobileMenu(false)}>
                  <span className="mobile-nav-text">{translate('ui_menu_benefits', 'Lợi ích')}</span>
                </a>

                <a href="https://onfa.io/about/affiliate" className="mobile-nav-item" onClick={() => setShowMobileMenu(false)}>
                  <span className="mobile-nav-text">{translate('ui_menu_affiliate', 'Đối tác')}</span>
                </a>

                <a href="mailto:support@onfa.io" className="mobile-nav-item" onClick={() => setShowMobileMenu(false)}>
                  <span className="mobile-nav-text">{translate('ui_menu_contact_us', 'Liên hệ')}</span>
                </a>
              </nav>
              )}
            </div>
          </div>
        )}

        {/* Search Popup Modal */}
        {showSearchPopup && (
          <div className="search-popup-overlay" onClick={() => setShowSearchPopup(false)}>
            <div className="search-popup" onClick={(e) => e.stopPropagation()}>
              <div className="search-popup-header">
                <h2 className="search-popup-title">{translate('ui_search', 'Tìm kiếm')}</h2>
                <button 
                  className="search-popup-close"
                  onClick={() => {
                    setShowSearchPopup(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  aria-label="Close search"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="search-popup-input-wrapper">
                <svg className="search-popup-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="m17 17-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input 
                  type="text" 
                  placeholder={translate('ui_search_placeholder', 'Tìm kiếm')}
                  className="search-popup-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Search Results */}
              {searchQuery.trim() && (
                <div className="search-popup-results">
                  {searchResults.length > 0 ? (
                    <div className="search-popup-results-list">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="search-popup-result-item"
                          onClick={() => {
                            handleSearchResultClick(result.id);
                            setShowSearchPopup(false);
                          }}
                        >
                          <div className="search-popup-result-title">{result.title}</div>
                          {result.parentTitle && (
                            <div className="search-popup-result-parent">{result.parentTitle}</div>
                          )}
                          <div className="search-popup-result-type">
                            {result.type === 'menu' ? translate('ui_menu', 'Menu') : translate('ui_page', 'Trang')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="search-popup-no-results">
                      {translate('ui_no_results', 'Không tìm thấy kết quả')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;

