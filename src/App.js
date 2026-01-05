import { useState, useEffect, useRef } from 'react';
import { getMenus, getPages, loadDataFromJSON } from './utils/dataService';
import { useLanguage } from './contexts/LanguageContext';
import PageContent from './components/PageContent';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import MenuIcon from './components/MenuIcon';
import Header from './components/Header';
import ShareModal from './components/ShareModal';
import './App.css';

function App() {
  const { translate } = useLanguage();
  const [menus, setMenus] = useState([]);
  const [pages, setPages] = useState([]);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [activePageId, setActivePageId] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    // Kiểm tra authentication từ localStorage
    const authenticated = localStorage.getItem('admin_authenticated') === 'true';
    const loginTime = localStorage.getItem('admin_login_time');
    
    // Kiểm tra nếu đã đăng nhập quá 24 giờ thì logout
    if (authenticated && loginTime) {
      const loginDate = new Date(loginTime);
      const now = new Date();
      const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_login_time');
        return false;
      }
    }
    
    return authenticated;
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [sidebarSearchResults, setSidebarSearchResults] = useState([]);
  const [filteredMenus, setFilteredMenus] = useState([]);
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);
  const isNavigatingFromClick = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let previousHash = window.location.hash;
    
    // Hàm để cập nhật activePageId từ URL hash
    const updateFromHash = () => {
      // Nếu đang navigate từ click, bỏ qua để tránh conflict
      if (isNavigatingFromClick.current) {
        return;
      }
      
      // Decode hash để xử lý ký tự đặc biệt và tiếng Việt
      const rawHash = window.location.hash.replace('#', '');
      const hash = decodeURIComponent(rawHash);
      const wasInAdmin = previousHash === '#admin';
      
      if (hash === 'admin') {
        // Nếu hash là 'admin', kiểm tra authentication
        if (isAdminAuthenticated) {
          setShowAdmin(true);
        } else {
          setShowAdmin(true); // Vẫn set showAdmin để hiển thị login form
        }
        setActivePageId(null);
      } else {
        // Nếu có hash khác hoặc không có hash, tắt admin và load page
        if (wasInAdmin) {
          // Nếu đang ở admin và chuyển về trang chính, reload data từ database
          loadData();
        }
        setShowAdmin(false);
        
        if (hash) {
          // Tìm page từ state pages đã được load
          const page = pages.find(p => p.id === hash);
          if (page) {
            // Chỉ update nếu hash khác với activePageId hiện tại để tránh re-render không cần thiết
            setActivePageId(prevId => prevId === hash ? prevId : hash);
          } else {
            // Nếu không tìm thấy page, thử tìm với raw hash (không decode)
            const pageWithRawHash = pages.find(p => p.id === rawHash);
            if (pageWithRawHash) {
              setActivePageId(rawHash);
            } else {
              // Nếu vẫn không tìm thấy, chỉ reset nếu đang ở một page khác
              setActivePageId(prevId => prevId === hash ? prevId : null);
            }
          }
        } else {
          // Nếu không có hash, load page đầu tiên
          const firstPage = pages[0];
          if (firstPage) {
            setActivePageId(firstPage.id);
            window.location.hash = encodeURIComponent(firstPage.id);
          } else {
            setActivePageId(null);
          }
        }
      }
      
      previousHash = window.location.hash;
    };
    
    // Listen cho hashchange event (khi back/forward button được click)
    const handleHashChange = () => {
      updateFromHash();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    // Load dữ liệu từ database (100% từ API)
    const initData = async () => {
      try {
        console.log('Initializing data load...');
        await loadData();
        if (isMounted) {
          console.log('Data loaded, updating hash...');
          // Load từ URL hash ban đầu sau khi data đã load
          updateFromHash();
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Nếu không load được, thử load lại một lần nữa
        if (isMounted) {
          try {
            await loadData();
            updateFromHash();
          } catch (retryError) {
            console.error('Retry failed:', retryError);
            // Nếu vẫn fail, set empty để UI hiển thị thông báo
            setMenus([]);
            setPages([]);
            setFilteredMenus([]);
          }
        }
      }
    };
    
    initData();
    
    return () => {
      isMounted = false;
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const loadData = async () => {
    try {
      const menusData = await getMenus();
      const pagesData = await getPages();
      console.log('Loading data - Menus:', menusData.length, 'Pages:', pagesData.length);
      setMenus(menusData);
      setPages(pagesData);
      setFilteredMenus(menusData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays nếu không load được
      setMenus([]);
      setPages([]);
      setFilteredMenus([]);
    }
  };

  // Sidebar search functionality
  useEffect(() => {
    if (!sidebarSearchQuery.trim()) {
      setFilteredMenus(menus);
      setSidebarSearchResults([]);
      return;
    }

    const query = sidebarSearchQuery.toLowerCase().trim();
    const results = [];
    const filtered = [];

    menus.forEach(menu => {
      const menuTitleMatch = menu.title.toLowerCase().includes(query);
      let hasMatchingChild = false;

      // Check children
      if (menu.children && menu.children.length > 0) {
        const matchingChildren = menu.children.filter(child => {
          const childMatch = child.title.toLowerCase().includes(query);
          if (childMatch) {
            results.push({
              id: child.id,
              title: child.title,
              type: 'page',
              parentTitle: menu.title,
              parentId: menu.id
            });
          }
          return childMatch;
        });
        hasMatchingChild = matchingChildren.length > 0;
      }

      // Include menu if title matches or has matching children
      if (menuTitleMatch || hasMatchingChild) {
        filtered.push({
          ...menu,
          children: menu.children ? menu.children.filter(child => 
            child.title.toLowerCase().includes(query)
          ) : []
        });
      }
    });

    setFilteredMenus(filtered);
    setSidebarSearchResults(results);
  }, [sidebarSearchQuery, menus]);

  const handleSidebarSearchResultClick = (resultId) => {
    setSidebarSearchQuery('');
    isNavigatingFromClick.current = true;
    setActivePageId(resultId);
    window.location.hash = encodeURIComponent(resultId);
    setTimeout(() => {
      isNavigatingFromClick.current = false;
    }, 100);
  };

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => {
      // Nếu menu này đang mở, đóng nó
      if (prev[menuId]) {
        return {
          ...prev,
          [menuId]: false
        };
      } else {
        // Nếu menu này chưa mở, đóng tất cả menu khác và mở menu này
        return {
          [menuId]: true
        };
      }
    });
  };

  const handleMenuClick = (menuId, e) => {
    // Nếu là menu cha, chỉ toggle expand và không load page
    const menu = menus.find(m => m.id === menuId);
    if (menu && menu.type === 'parent') {
      e?.preventDefault();
      e?.stopPropagation();
      toggleMenu(menuId);
      return; // Dừng lại, không load page
    } else {
      // Nếu là menu đơn, load page từ state
      const page = pages.find(p => p.id === menuId);
      if (page) {
        // Đánh dấu là đang navigate từ click
        isNavigatingFromClick.current = true;
        // Set activePageId và hash cùng lúc (encode để xử lý ký tự đặc biệt)
        setActivePageId(menuId);
        window.location.hash = encodeURIComponent(menuId);
        // Reset flag sau một chút
        setTimeout(() => {
          isNavigatingFromClick.current = false;
        }, 100);
      }
    }
  };

  const handleChildClick = (childId, e) => {
    e.stopPropagation();
    const page = pages.find(p => p.id === childId);
    if (page) {
      // Đánh dấu là đang navigate từ click
      isNavigatingFromClick.current = true;
      // Set activePageId và hash cùng lúc (encode để xử lý ký tự đặc biệt)
      setActivePageId(childId);
      window.location.hash = encodeURIComponent(childId);
      // Reset flag sau một chút
      setTimeout(() => {
        isNavigatingFromClick.current = false;
      }, 100);
    }
  };

  const handleDataChange = async () => {
    // Nếu đang ở admin dashboard, giữ nguyên hash #admin và không redirect
    const currentHash = window.location.hash;
    const isInAdmin = currentHash === '#admin';
    
    // Force reload data from database
    await loadData();
    
    // Nếu đang ở admin, không thay đổi hash hoặc activePageId
    if (isInAdmin) {
      // Đảm bảo hash vẫn là #admin
      if (currentHash !== '#admin') {
        window.location.hash = 'admin';
      }
      return;
    }
    
    // Reload active page if it still exists (chỉ khi không ở admin)
    if (activePageId) {
      const page = pages.find(p => p.id === activePageId);
      if (!page) {
        // If page was deleted, load first available page
        const firstPage = pages[0];
        if (firstPage) {
          setActivePageId(firstPage.id);
          window.location.hash = encodeURIComponent(firstPage.id);
        } else {
          setActivePageId(null);
        }
      } else {
        // Update active page to refresh content
        const currentId = activePageId;
        setActivePageId(null);
        setTimeout(() => {
          setActivePageId(currentId);
        }, 0);
      }
    } else {
      // If no active page, load first available page
      const firstPage = pages[0];
      if (firstPage) {
        setActivePageId(firstPage.id);
        window.location.hash = encodeURIComponent(firstPage.id);
      }
    }
  };

  const handleCloseAdmin = async () => {
    setShowAdmin(false);
    // Reload data khi quay về từ admin
    await loadData();
    // Quay về trang đầu tiên hoặc trang trước đó
    const firstPage = pages[0];
    if (firstPage) {
      setActivePageId(firstPage.id);
      window.location.hash = encodeURIComponent(firstPage.id);
    } else {
      window.location.hash = '';
      setActivePageId(null);
    }
  };

  const activePage = activePageId ? pages.find(p => p.id === activePageId) : null;

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_login_time');
    setIsAdminAuthenticated(false);
    setShowAdmin(false);
    window.location.hash = '';
  };

  if (showAdmin) {
    if (!isAdminAuthenticated) {
      return <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />;
    }
    return <AdminDashboard onDataChange={handleDataChange} onClose={handleCloseAdmin} onLogout={handleAdminLogout} />;
  }

  const handlePageNavigate = (pageId) => {
    isNavigatingFromClick.current = true;
    setActivePageId(pageId);
    window.location.hash = encodeURIComponent(pageId);
    setTimeout(() => {
      isNavigatingFromClick.current = false;
    }, 100);
  };

  return (
    <div className="onfa-wiki">
      <Header onPageNavigate={handlePageNavigate} />

      <div className="wiki-container">
        {/* Mobile Sidebar Menu Button */}
        <button 
          className="mobile-sidebar-toggle"
          onClick={() => setShowSidebarMenu(!showSidebarMenu)}
          aria-label="Toggle sidebar menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {showSidebarMenu ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>

        {/* Mobile Sidebar Menu Overlay */}
        {showSidebarMenu && (
          <div className="mobile-sidebar-overlay" onClick={() => setShowSidebarMenu(false)}>
            <aside className="mobile-sidebar-menu" onClick={(e) => e.stopPropagation()}>
              <button 
                className="mobile-sidebar-close"
                onClick={() => setShowSidebarMenu(false)}
                aria-label="Close sidebar"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              {/* Search Box */}
              <div className="mobile-sidebar-search">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="m17 17-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input 
                  type="text" 
                  placeholder={translate('ui_search', 'Tìm')}
                  className="mobile-sidebar-search-input"
                  value={sidebarSearchQuery}
                  onChange={(e) => setSidebarSearchQuery(e.target.value)}
                />
              </div>

              {/* Search Results */}
              {sidebarSearchQuery.trim() && sidebarSearchResults.length > 0 && (
                <div className="mobile-sidebar-search-results">
                  {sidebarSearchResults.map((result) => (
                    <div
                      key={result.id}
                      className="mobile-sidebar-search-result-item"
                      onClick={() => {
                        handleSidebarSearchResultClick(result.id);
                        setShowSidebarMenu(false);
                      }}
                    >
                      <div className="mobile-sidebar-search-result-title">{result.title}</div>
                      {result.parentTitle && (
                        <div className="mobile-sidebar-search-result-parent">{result.parentTitle}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Sidebar Menu Navigation */}
              {!sidebarSearchQuery.trim() && (
                <nav className="mobile-sidebar-nav">
                  {filteredMenus && filteredMenus.length > 0 ? (
                    filteredMenus.map(menu => (
                      <div key={menu.id} className="mobile-sidebar-nav-section">
                        {menu.type === 'parent' ? (
                          <>
                            <div 
                              className={`mobile-sidebar-nav-item ${expandedMenus[menu.id] ? 'expanded' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuClick(menu.id, e);
                              }}
                            >
                              <div className="mobile-sidebar-nav-item-content">
                                <MenuIcon type={menu.icon} className="mobile-sidebar-nav-icon" />
                                <span className="mobile-sidebar-nav-text">{translate(`menu_${menu.id}`, menu.title)}</span>
                              </div>
                              <svg 
                                className={`mobile-sidebar-nav-arrow ${expandedMenus[menu.id] ? 'expanded' : ''}`} 
                                width="12" height="12" viewBox="0 0 12 12" fill="none"
                              >
                                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            {expandedMenus[menu.id] && menu.children && (
                              <div className="mobile-sidebar-nav-children">
                                {menu.children.map(child => (
                                  <div
                                    key={child.id}
                                    className={`mobile-sidebar-nav-child ${activePageId === child.id ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleChildClick(child.id, e);
                                      setShowSidebarMenu(false);
                                    }}
                                  >
                                    {translate(`menu_${child.id}`, child.title)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div
                            className={`mobile-sidebar-nav-item ${activePageId === menu.id ? 'active' : ''}`}
                            onClick={() => {
                              handleMenuClick(menu.id);
                              setShowSidebarMenu(false);
                            }}
                          >
                            <div className="mobile-sidebar-nav-item-content">
                              <MenuIcon type={menu.icon} className="mobile-sidebar-nav-icon" />
                              <span className="mobile-sidebar-nav-text">{translate(`menu_${menu.id}`, menu.title)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="mobile-sidebar-nav-item">
                      <span className="mobile-sidebar-nav-text">{translate('ui_no_menu', 'Không có menu')}</span>
                    </div>
                  )}
                </nav>
              )}
            </aside>
          </div>
        )}

        {/* Left Sidebar (Desktop) */}
        <aside className="sidebar-left">
          <nav className="sidebar-nav">
            <button 
              className="nav-back-button"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  // Nếu không có lịch sử, điều hướng về trang chủ hoặc xóa hash
                  window.location.hash = '';
                  setActivePageId(null);
                }
              }}
            >
            <svg className="bn-svg w-[30px] h-[30px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M11.071 19.192L4 12.122l.025-.026L4 12.071 11.071 5l2.121 2.121-4.974 4.975 4.974 4.975-2.12 2.121zm7 0L11 12.122l.025-.026-.025-.025L18.071 5l2.121 2.121-4.975 4.975 4.975 4.975-2.12 2.121z" fill="currentColor"></path></svg>
            </button>

            {filteredMenus && filteredMenus.length > 0 ? (
              filteredMenus.map(menu => (
                <div key={menu.id} className="nav-section">
                  {menu.type === 'parent' ? (
                    <>
                      <div 
                        className={`nav-parent ${expandedMenus[menu.id] ? 'expanded' : ''}`}
                        onClick={(e) => handleMenuClick(menu.id, e)}
                      >
                        <div className="nav-parent-content">
                          <MenuIcon type={menu.icon} />
                          <span className="nav-parent-text">{translate(`menu_${menu.id}`, menu.title)}</span>
                        </div>
                        <svg 
                          className={`nav-arrow ${expandedMenus[menu.id] ? 'expanded' : ''}`} 
                          width="12" height="12" viewBox="0 0 12 12" fill="none"
                        >
                          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      {expandedMenus[menu.id] && menu.children && (
                        <div className="nav-children">
                          {menu.children.map(child => (
                            <div 
                              key={child.id}
                              className={`nav-child ${activePageId === child.id ? 'active' : ''}`}
                              onClick={(e) => handleChildClick(child.id, e)}
                            >
                              {translate(`menu_${child.id}`, child.title)}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div 
                      className={`nav-item ${activePageId === menu.id ? 'active' : ''}`}
                      onClick={() => handleMenuClick(menu.id)}
                    >
                      <MenuIcon type={menu.icon} />
                      <span>{translate(`menu_${menu.id}`, menu.title)}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: '16px', color: '#848e9c', fontSize: '14px' }}>
                Không có menu nào
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <PageContent 
            page={activePage} 
            onPageChange={(pageId) => {
              setActivePageId(pageId);
              window.location.hash = encodeURIComponent(pageId);
            }}
          />
        </main>

        {/* Right Sidebar */}
        <aside className="sidebar-right">
          <div className="right-section">
            <div className="share-container max-w-[130px]">
              <button className="share-button" onClick={() => setShowShareModal(true)}>
              <svg className="bn-svg !w-4 !h-4 text-PrimaryText" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18 2.1a3.9 3.9 0 11-3.236 6.079L9.9 11.016v1.967l4.864 2.837a3.9 3.9 0 11-.636 1.713L8.97 14.524a3.9 3.9 0 110-5.05l5.157-3.008A3.9 3.9 0 0118 2.1zm0 13.8a2.1 2.1 0 100 4.199 2.1 2.1 0 000-4.199zm-12-6a2.1 2.1 0 100 4.2 2.1 2.1 0 000-4.2zm12-6A2.1 2.1 0 1018 8.1 2.1 2.1 0 0018 3.9z" fill="currentColor"></path></svg>
                <span>{translate('ui_share', 'Chia sẻ')}</span>
                <div className="gift-icon-small">
                  <img src="/share-bonus.gif" alt="Gift" className="gift-gif" />
                </div>
              </button>
            </div>
          </div>
          
          <div className="right-section">
            <div className="search-box">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="m17 17-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input 
                type="text" 
                placeholder={translate('ui_search', 'Tìm')} 
                className="search-input"
                value={sidebarSearchQuery}
                onChange={(e) => setSidebarSearchQuery(e.target.value)}
              />
            </div>
            {sidebarSearchQuery.trim() && sidebarSearchResults.length > 0 && (
              <div className="sidebar-search-results">
                {sidebarSearchResults.map((result) => (
                  <div
                    key={result.id}
                    className="sidebar-search-result-item"
                    onClick={() => handleSidebarSearchResultClick(result.id)}
                  >
                    <div className="sidebar-search-result-title">{result.title}</div>
                    {result.parentTitle && (
                      <div className="sidebar-search-result-parent">{result.parentTitle}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {sidebarSearchQuery.trim() && filteredMenus.length === 0 && (
              <div className="sidebar-search-no-results">
                {translate('ui_no_results', 'Không tìm thấy kết quả')}
              </div>
            )}
          </div>

          <div className="right-section">
            <div className="promo-box">
              <div className="promo-gift-icon">
                <svg xmlns="http://www.w3.org/2000/svg" class="bn-svg flex-shrink-0 ablet:!w-[76px] tablet:!h-[76px] desktop:!w-[78px] desktop:!h-[78px]" viewBox="0 0 58 58"><path fill="#F8D33A" d="M24.721 15.959 3.631 27.976 29 42.433l21.09-12.019L24.72 15.96ZM50.097 30.413 24.722 15.958 29 13.52l25.376 14.456-4.279 2.437Z"></path><path fill="#F0B90B" d="M29 58V42.432L3.626 27.976v15.569L29.001 58Z"></path><path fill="#DA3300" fill-rule="evenodd" d="m15.795 47.194-1.467-9.126c0-.892.657-1.238 1.467-.771.81.466 1.467 1.565 1.467 2.456l-1.467 7.44ZM14.69 46.802l-4.235-9.469a2.006 2.006 0 0 1-.083-.984c.092-.455.407-.727.877-.67.748.09 1.607.973 1.917 1.975l1.525 9.146v.002ZM7.395 38.582l6.36 8.37-4.286-9.46c-.573-.953-1.502-1.494-2.077-1.193a.811.811 0 0 0-.395.562c-.102.459.03 1.103.398 1.72ZM13.136 47.623l-7.51-5.995c-.66-.68-1.014-1.654-.877-2.317.018-.087.046-.17.083-.25.31-.647 1.17-.544 1.917.228l6.391 8.334h-.004ZM18.462 50.684l7.51 2.64c.747.088 1.104-.653.799-1.654a3.395 3.395 0 0 0-.986-1.511 1.82 1.82 0 0 0-.935-.476l-6.391.99.003.011ZM23.522 45.148c-.487-.422-1.03-.594-1.413-.394l-4.285 4.538 6.36-1.062c.575-.302.575-1.324 0-2.282-.176-.3-.4-.57-.662-.8ZM16.9 48.06v.01l4.236-4.602c.31-.646-.045-1.795-.799-2.567a3.672 3.672 0 0 0-.182-.173c-.702-.612-1.453-.652-1.739-.057l-1.525 7.394.01-.004ZM15.795 48.67c-.852-.49-1.542-.126-1.542.812v.12l3.074 1.745v-.099c.01-.938-.676-2.088-1.532-2.578ZM26.202 54.732l-7.527-2.71.434.342 8.566 4.876v-.051c0-.892-.663-1.992-1.473-2.457ZM3.915 43.544v.17l8.403 4.786.585.211-7.528-5.939c-.802-.466-1.46-.12-1.46.772Z" clip-rule="evenodd"></path><g filter="url(#a)"><path fill="#fff" d="M7.357 27.976v-3.14c0-.652.174-1.293.503-1.858a3.719 3.719 0 0 1 1.373-1.357l16.055-9.148a7.506 7.506 0 0 1 7.426 0l16.051 9.148c.57.325 1.044.793 1.373 1.358.329.564.502 1.205.501 1.858v3.139L29.001 40.312 7.357 27.976Z"></path></g><path fill="#fff" d="m50.097 25.224-1.864-1.062-.373.213v2.13l2.237-1.281Z"></path><path fill="#D0980B" d="M29.001 58V42.432l21.09-12.019v15.568L29.002 58Z"></path><path fill="#5C34AD" d="M38.807 40.682 35.041 48.3l.545-7.49c.407-1.428 1.457-2.607 2.347-2.642.89-.035 1.281 1.089.874 2.514ZM41.32 45.231l-5.476 3.69 4.24-7.25c.917-1.031 1.937-1.07 2.279-.088.342.982-.125 2.61-1.042 3.648ZM41.255 47.722l-5.451 2.764 3.106 1.87 3.104-1.767a4.98 4.98 0 0 0 .117-.35c.402-1.425.011-2.551-.876-2.517ZM34.938 52.086l.052 2.501 1.598-.91-1.65-1.591ZM33.568 55.398l.192-2.616-1.729 3.492 1.537-.876ZM29 58l.813-.464 3.143-5.374L29 54.827v3.172ZM29 52.62l3.995-2.027-3.98-2.398h-.02L29 52.62ZM33.714 41.912l.15 7.08-3.474-3.342c-.341-.984.125-2.617 1.042-3.65.917-1.034 1.94-1.07 2.282-.088ZM35.041 50.806c.29-.643.24-1.291-.11-1.447-.351-.155-.87.24-1.16.884-.288.643-.239 1.291.112 1.447.35.155.869-.24 1.158-.884Z"></path><path fill="#D0980B" d="M50.098 45.981V30.413l4.279-2.437v15.569l-4.28 2.436Z"></path><path fill="#F8D33A" d="m50.097 16.893-2.237 1.27-25.379-14.45 2.237-1.269L29 0l25.376 14.457-4.279 2.436ZM22.483 3.715 3.629 14.458 29 28.913 47.855 18.17 22.483 3.715Z"></path><path fill="#F0B90B" fill-rule="evenodd" d="m45.25 17.137 1.928-1.094 3.686-2.099L29.001 1.488l-3.69 2.106-1.927 1.094L7.14 13.944 29 26.398l16.245-9.256-21-11.964L45.25 17.137Z" clip-rule="evenodd"></path><path fill="#F0B90B" d="m40.67 22.266-2.238 1.27L13.057 9.077l2.236-1.27 4.28-2.437 25.375 14.457-4.279 2.438Z"></path><path fill="#F0B90B" d="m17.332 22.266 2.237 1.27L44.945 9.077l-2.237-1.27-4.28-2.437-25.376 14.457 4.28 2.438ZM29 37.068v-8.155L3.626 14.458v8.154l25.376 14.456Z"></path><path fill="#D0980B" d="M29.001 37.068v-8.155l25.376-14.455v8.154L29 37.068Z"></path><path fill="#F8D33A" d="m19.367 52.533-6.391-3.65.078-29.055 6.517 3.714-.204 28.991Z"></path><path fill="#F0B90B" d="m38.583 52.533 6.392-3.65-.079-29.055-6.517 3.714.204 28.991Z"></path><path fill="#D0980B" d="m15.75 11.412 6.811 3.031 2.716-1.587-6.926-7.188-2.876 1.428c-.043.023-.086.045-.128.069-1.733.974-1.473 3.558.403 4.247Z"></path><path fill="#F8D33A" d="m25.615 5.169 3.386 5.575-6.439 3.7L19.846 10c-1.171-2.127-2.12-3.419-4.474-2.798l6.462-3.255a2.868 2.868 0 0 1 2.14-.153 2.846 2.846 0 0 1 1.641 1.375Z"></path><path fill="#D0980B" d="m42.294 11.412-6.79 3.031-2.237-1.27 6.426-7.505 2.876 1.428c.043.023.086.045.128.069 1.735.974 1.473 3.558-.403 4.247Z"></path><path fill="#F8D33A" d="M32.43 5.168 29 10.743l6.519 3.714 2.7-4.617c1.171-2.126 2.1-3.26 4.46-2.639l-6.462-3.255a2.868 2.868 0 0 0-2.145-.155 2.845 2.845 0 0 0-1.643 1.377Z"></path><path fill="#F0B90B" d="m29 18.17 6.52-3.713L29 10.743l-6.519 3.714 6.52 3.712Z"></path><path fill="#F8D33A" d="m29.001 18.17 6.519-3.713 4.847-.686a3.59 3.59 0 0 1 2.894.88 3.544 3.544 0 0 1 1.171 2.77 3.527 3.527 0 0 1-.556 1.76 3.558 3.558 0 0 1-1.372 1.244l-3.006 1.539a4.208 4.208 0 0 1-3.994-.089L29 18.17Z"></path><path fill="#D0980B" d="m29.001 18.17 5.694-1.621a3.59 3.59 0 0 1 2.894.88 3.544 3.544 0 0 1 1.171 2.77c-.053 1.27-.86 2.65-2.617 2.016l-7.142-4.046Z"></path><path fill="#F8D33A" d="m29.097 18.17-6.517-3.713-4.85-.686a3.59 3.59 0 0 0-2.892.88 3.541 3.541 0 0 0-1.172 2.77c.026.626.219 1.233.558 1.76.339.528.812.957 1.372 1.244l3 1.534a4.207 4.207 0 0 0 3.995-.089l6.506-3.7Z"></path><path fill="#D0980B" d="m29.097 18.17-5.694-1.621a3.59 3.59 0 0 0-2.893.88 3.544 3.544 0 0 0-1.172 2.77c.053 1.27.861 2.65 2.619 2.016l7.14-4.046Z"></path><path fill="#E4435A" d="m51.88 38.88.944-6.216.94 5.187a2.029 2.029 0 0 1-.94 1.635c-.526.28-.943.009-.943-.605ZM47.419 38.18l4.053-5.45-2.723 6.302c-.368.639-.964.964-1.332.726-.368-.238-.367-.935.002-1.577ZM46.124 32.929l4.792-1.494-4.792 3.736c-.529.284-.941.013-.941-.607a2.033 2.033 0 0 1 .94-1.635ZM53.814 30.625c.347-.647.318-1.336-.066-1.54-.384-.203-.977.156-1.324.803-.347.646-.318 1.336.066 1.539.384.204.977-.156 1.324-.802Z"></path><defs><filter id="a" width="46.214" height="31.753" x="5.891" y="10.025" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"></feColorMatrix><feOffset></feOffset><feGaussianBlur stdDeviation=".733"></feGaussianBlur><feComposite in2="hardAlpha" operator="out"></feComposite><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"></feColorMatrix><feBlend in2="BackgroundImageFix" result="effect1_dropShadow_97_22103"></feBlend><feBlend in="SourceGraphic" in2="effect1_dropShadow_97_22103" result="shape"></feBlend></filter></defs></svg>
              </div>
              <div className="promo-content">
                <div className="promo-text">
                  <div className="promo-subtitle">{translate('ui_register_promo', 'Đăng ký ngay - Nhận nhiều quà tặng hấp dẫn cho người mới (dành cho người dùng đã xác minh)')}</div>
                </div>
                <a href="https://onfa.io/account/register" className="promo-button">{translate('ui_register_now', 'Đăng ký ngay')}</a>
              </div>
            </div>
          </div>

          <div className="right-section">
            <div className="related-articles">
              <h3 className="related-title">{translate('ui_related_articles', 'Bài viết liên quan')}</h3>
              <ul className="related-list">
                {pages.slice(0, 4).map(page => (
                  <li key={page.id} className="related-item">
                    <a 
                      href={`#${page.id}`}
                      className="related-link"
                      onClick={(e) => {
                        e.preventDefault();
                        setActivePageId(page.id);
                        window.location.hash = encodeURIComponent(page.id);
                      }}
                    >
                      {translate(`page_${page.id}_title`, page.title)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
      
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </div>
  );
}

export default App;
