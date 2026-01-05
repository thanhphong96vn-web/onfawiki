import React, { useState, useEffect, useRef, useMemo } from 'react';
import RichTextEditor from './RichTextEditor';
import MenuIcon from './MenuIcon';
import { getMenus, getPages, createPage, updatePage, deletePage, createMenu, updateMenu, deleteMenu, loadDataFromJSON, exportDataToJSON, importDataFromJSON, clearCache, syncDataToJSON } from '../utils/dataService';
import './AdminDashboard.css';

function AdminDashboard({ onDataChange, onClose, onLogout }) {
  const [menus, setMenus] = useState([]);
  const [pages, setPages] = useState([]);
  const [activeTab, setActiveTab] = useState('pages');
  const [editingPage, setEditingPage] = useState(null);
  const [editingMenu, setEditingMenu] = useState(null);
  const [pagesCurrentPage, setPagesCurrentPage] = useState(1);
  const [menusCurrentPage, setMenusCurrentPage] = useState(1);
  const pagesPerPage = 8;
  const menusPerPage = 5;
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    publishDate: new Date().toISOString().split('T')[0],
    parentId: '',
    menuTitle: '',
    menuIcon: '',
    menuType: 'single'
  });

  const fileInputRef = useRef(null);
  const iconFileInputRef = useRef(null);
  const formSectionRef = useRef(null);
  const listSectionRef = useRef(null);

  useEffect(() => {
    // Load dữ liệu từ database (100% từ API)
    loadData();

    // Listen for data saved events để tự động reload
    const handleDataSaved = async (event) => {
      if (event.detail && event.detail.success === true) {
        // Reload data sau khi save thành công
        await loadData();
      }
    };

    window.addEventListener('dataSavedToJSON', handleDataSaved);

    return () => {
      window.removeEventListener('dataSavedToJSON', handleDataSaved);
    };
  }, []);

  // Đồng bộ chiều cao giữa form section và list section
  useEffect(() => {
    const syncHeights = () => {
      if (formSectionRef.current && listSectionRef.current) {
        const formHeight = formSectionRef.current.offsetHeight;
        listSectionRef.current.style.height = `${formHeight}px`;
      }
    };

    // Sync ngay lập tức
    syncHeights();

    // Sync khi resize hoặc khi data thay đổi
    window.addEventListener('resize', syncHeights);
    const interval = setInterval(syncHeights, 100);

    return () => {
      window.removeEventListener('resize', syncHeights);
      clearInterval(interval);
    };
  }, [pages, menus, activeTab]);


  const loadData = async () => {
    try {
      const menusData = await getMenus();
      const pagesData = await getPages();
      console.log('AdminDashboard loadData - Menus:', menusData.length, menusData);
      console.log('AdminDashboard loadData - Parent menus:', menusData.filter(m => m.type === 'parent'));
      setMenus(menusData);
      setPages(pagesData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays nếu không load được
      setMenus([]);
      setPages([]);
    }
  };

  const handlePageSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPage) {
        await updatePage(editingPage.id, {
          title: formData.title,
          content: formData.content,
          publishDate: formData.publishDate,
          parentId: formData.parentId || null
        });
      } else {
        await createPage({
          id: formData.title.toLowerCase().replace(/\s+/g, '-'),
          title: formData.title,
          content: formData.content,
          publishDate: formData.publishDate,
          parentId: formData.parentId || null
        });
      }
      
      resetForm();
      await loadData();
      
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error('Error saving page:', error);
      alert('❌ Lỗi khi lưu trang: ' + error.message);
    }
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const menuData = {
        title: formData.menuTitle,
        icon: formData.menuIcon,
        type: formData.menuType
      };
      
      console.log('Creating/Updating menu with data:', menuData);
      
      if (editingMenu) {
        await updateMenu(editingMenu.id, menuData);
      } else {
        await createMenu({
          id: formData.menuTitle.toLowerCase().replace(/\s+/g, '-'),
          ...menuData,
          children: []
        });
      }
      
      resetForm();
      await loadData();
      
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error('Error saving menu:', error);
      alert('❌ Lỗi khi lưu menu: ' + error.message);
    }
  };

  const handleEditPage = (page) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      content: page.content,
      publishDate: page.publishDate,
      parentId: page.parentId || '',
      menuTitle: '',
      menuIcon: 'guide',
      menuType: 'single'
    });
    setActiveTab('pages');
  };

  const handleEditMenu = (menu) => {
    setEditingMenu(menu);
    setFormData({
      title: '',
      content: '',
      publishDate: new Date().toISOString().split('T')[0],
      parentId: '',
      menuTitle: menu.title,
      menuIcon: menu.icon,
      menuType: menu.type
    });
    setActiveTab('menus');
  };

  const handleDeletePage = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa trang này?')) {
      deletePage(id);
      loadData();
      // Điều chỉnh pagination nếu trang hiện tại trở thành trống
      setTimeout(() => {
        const newTotalPages = Math.ceil((pages.length - 1) / pagesPerPage);
        if (pagesCurrentPage > newTotalPages && newTotalPages > 0) {
          setPagesCurrentPage(newTotalPages);
        }
      }, 100);
      if (onDataChange) onDataChange();
    }
  };

  const handleDeleteMenu = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa menu này? Tất cả các trang con sẽ bị xóa.')) {
      deleteMenu(id);
      loadData();
      // Điều chỉnh pagination nếu trang hiện tại trở thành trống
      setTimeout(() => {
        const newTotalPages = Math.ceil((menus.length - 1) / menusPerPage);
        if (menusCurrentPage > newTotalPages && newTotalPages > 0) {
          setMenusCurrentPage(newTotalPages);
        }
      }, 100);
      if (onDataChange) onDataChange();
    }
  };

  const resetForm = () => {
    setEditingPage(null);
    setEditingMenu(null);
    setFormData({
      title: '',
      content: '',
      publishDate: new Date().toISOString().split('T')[0],
      parentId: '',
      menuTitle: '',
      menuIcon: '',
      menuType: 'single'
    });
  };

  // Tính toán lại parentMenus mỗi khi menus thay đổi
  const parentMenus = useMemo(() => {
    const filtered = menus.filter(m => m.type === 'parent');
    console.log('Calculating parentMenus:', filtered.length, filtered);
    return filtered;
  }, [menus]);

  // Tính toán pagination cho pages
  const pagesTotalPages = Math.ceil(pages.length / pagesPerPage);
  const pagesStartIndex = (pagesCurrentPage - 1) * pagesPerPage;
  const pagesEndIndex = pagesStartIndex + pagesPerPage;
  const paginatedPages = pages.slice(pagesStartIndex, pagesEndIndex);

  // Tính toán pagination cho menus
  const menusTotalPages = Math.ceil(menus.length / menusPerPage);
  const menusStartIndex = (menusCurrentPage - 1) * menusPerPage;
  const menusEndIndex = menusStartIndex + menusPerPage;
  const paginatedMenus = menus.slice(menusStartIndex, menusEndIndex);

  // Reset về trang 1 khi chuyển tab hoặc khi data thay đổi
  useEffect(() => {
    setPagesCurrentPage(1);
    setMenusCurrentPage(1);
  }, [activeTab]);

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo-onfa-scaled.png" alt="ONFA" style={{ height: '40px', width: 'auto' }} />
        </a>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            className="export-btn" 
            onClick={async () => {
              try {
                // Lấy data từ localStorage
                const data = JSON.parse(localStorage.getItem('wiki_pages_data') || '{"menus":[],"pages":[]}');
                
                // Export file để download
                exportDataToJSON();
                
                // Đồng thời gửi lên server để lưu vào JSON file (nếu server đang chạy)
                try {
                  const response = await fetch('http://localhost:3001/api/save-data', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                  });
                  
                  if (response.ok) {
                    alert('✅ Đã export và lưu vào file JSON!\n\n📥 File wiki-data.json đã được tải về\n💾 File public/data/wiki-data.json đã được cập nhật\n\n🚀 Để deploy:\n1. File JSON đã sẵn sàng trong public/data/wiki-data.json\n2. Deploy lại website');
                  } else {
                    alert('✅ Đã export file JSON!\n\n📥 File wiki-data.json đã được tải về\n\n🚀 Để deploy:\n1. Mở file wiki-data.json vừa tải về\n2. Copy nội dung\n3. Paste vào file public/data/wiki-data.json\n4. Deploy lại website\n\n⚠️ Lưu ý: Server API không chạy, cần copy thủ công');
                  }
                } catch (apiError) {
                  alert('✅ Đã export file JSON!\n\n📥 File wiki-data.json đã được tải về\n\n🚀 Để deploy:\n1. Mở file wiki-data.json vừa tải về\n2. Copy nội dung\n3. Paste vào file public/data/wiki-data.json\n4. Deploy lại website\n\n⚠️ Lưu ý: Server API không chạy, cần copy thủ công');
                }
              } catch (error) {
                console.error('Export error:', error);
                alert('❌ Lỗi khi export: ' + error.message);
              }
            }}
            style={{ 
              padding: '8px 16px', 
              background: '#f0b90b', 
              color: '#1e2026', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            Export JSON để Deploy
          </button>
          <button 
            className="sync-btn" 
            onClick={async () => {
              try {
                await syncDataToJSON();
                alert('✅ Đã sync vào file JSON thành công!\n\nFile public/data/wiki-data.json đã được cập nhật.');
              } catch (error) {
                alert('❌ Sync thất bại: ' + error.message + '\n\n💡 Hãy chạy: npm run dev để bật server API');
              }
            }}
            style={{ 
              padding: '8px 16px', 
              background: '#2b3139', 
              color: '#eaecef', 
              border: '1px solid #3a3f47', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            Sync vào JSON
          </button>
          <button 
            className="import-btn" 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              padding: '8px 16px', 
              background: '#2b3139', 
              color: '#eaecef', 
              border: '1px solid #3a3f47', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  await importDataFromJSON(file);
                  loadData();
                  alert('✅ Import thành công!\n\nDữ liệu đã được khôi phục từ file JSON.');
                  if (onDataChange) {
                    onDataChange();
                  }
                } catch (error) {
                  alert('❌ Import thất bại: ' + error.message);
                }
                // Reset input
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }
            }}
          />
          {onLogout && (
            <button 
              onClick={onLogout}
              style={{ 
                padding: '8px 16px', 
                background: '#2b3139', 
                color: '#eaecef', 
                border: '1px solid #3a3f47', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#3a3f47';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#2b3139';
              }}
            >
              Đăng xuất
            </button>
          )}
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'pages' ? 'active' : ''}
          onClick={() => {
            setActiveTab('pages');
            setPagesCurrentPage(1);
            // Reload data khi chuyển tab để đảm bảo menus được cập nhật
            loadData();
          }}
        >
          Quản lý Trang
        </button>
        <button 
          className={activeTab === 'menus' ? 'active' : ''}
          onClick={() => {
            setActiveTab('menus');
            setMenusCurrentPage(1);
            // Reload data khi chuyển tab để đảm bảo menus được cập nhật
            loadData();
          }}
        >
          Quản lý Menu
        </button>
      </div>

      {activeTab === 'pages' && (
        <div className="admin-content">
          <div className="admin-form-section" ref={formSectionRef}>
            <h2>{editingPage ? 'Sửa Trang' : 'Tạo Trang Mới'}</h2>
            <form onSubmit={handlePageSubmit}>
              <div className="form-group">
                <label>Tiêu đề</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Menu cha (tùy chọn)</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                >
                  <option value="">Không có menu cha</option>
                  {parentMenus.map(menu => (
                    <option key={menu.id} value={menu.id}>{menu.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Ngày xuất bản</label>
                <input
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nội dung</label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Nhập nội dung hoặc copy/paste từ Word..."
                />
              </div>

              <div className="form-actions">
                <button type="submit">{editingPage ? 'Cập nhật' : 'Tạo mới'}</button>
                {editingPage && (
                  <button type="button" onClick={resetForm}>Hủy</button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-list-section" ref={listSectionRef}>
            <h2>Danh sách Trang ({pages.length})</h2>
            <div className="items-list">
              {paginatedPages.map(page => (
                <div key={page.id} className="item-card">
                  <div className="item-info">
                    <h3>{page.title}</h3>
                    <p className="item-meta">ID: {page.id} | Ngày: {page.publishDate}</p>
                    {page.parentId && (
                      <p className="item-meta">Menu cha: {menus.find(m => m.id === page.parentId)?.title || page.parentId}</p>
                    )}
                  </div>
                  <div className="item-actions">
                    <button onClick={() => handleEditPage(page)}>Sửa</button>
                    <button onClick={() => handleDeletePage(page.id)} className="delete-btn">Xóa</button>
                  </div>
                </div>
              ))}
              {paginatedPages.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#848e9c' }}>
                  Không có trang nào
                </div>
              )}
            </div>
            {pagesTotalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPagesCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={pagesCurrentPage === 1}
                  className="pagination-btn"
                >
                  Trước
                </button>
                <span className="pagination-info">
                  Trang {pagesCurrentPage} / {pagesTotalPages}
                </span>
                <button
                  onClick={() => setPagesCurrentPage(prev => Math.min(pagesTotalPages, prev + 1))}
                  disabled={pagesCurrentPage === pagesTotalPages}
                  className="pagination-btn"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'menus' && (
        <div className="admin-content">
          <div className="admin-form-section" ref={formSectionRef}>
            <h2>{editingMenu ? 'Sửa Menu' : 'Tạo Menu Mới'}</h2>
            <form onSubmit={handleMenuSubmit}>
              <div className="form-group">
                <label>Tiêu đề Menu</label>
                <input
                  type="text"
                  value={formData.menuTitle}
                  onChange={(e) => setFormData({ ...formData, menuTitle: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Icon (SVG Code, URL hình ảnh, hoặc Upload)</label>
                
                {/* Preview icon */}
                {formData.menuIcon && (
                  <div style={{ 
                    marginBottom: '12px', 
                    padding: '12px', 
                    background: '#252932', 
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ color: '#848e9c', fontSize: '12px' }}>Preview:</span>
                    <MenuIcon type={formData.menuIcon} className="nav-icon" />
                  </div>
                )}

                {/* Upload file button */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => iconFileInputRef.current?.click()}
                    style={{
                      padding: '8px 16px',
                      background: '#2b3139',
                      border: '1px solid #3a3f47',
                      borderRadius: '6px',
                      color: '#eaecef',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Upload hình ảnh
                  </button>
                  <input
                    ref={iconFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64 = event.target.result;
                          setFormData({ ...formData, menuIcon: base64 });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>

                {/* Input URL hoặc SVG */}
                <textarea
                  value={formData.menuIcon}
                  onChange={(e) => setFormData({ ...formData, menuIcon: e.target.value })}
                  placeholder="Dán mã SVG, URL hình ảnh (http://...), hoặc upload file ở trên"
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#2b3139',
                    border: '1px solid #3a3f47',
                    borderRadius: '6px',
                    color: '#eaecef',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    resize: 'vertical'
                  }}
                />
                <small style={{ color: '#848e9c', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Có thể: SVG code, URL hình ảnh, base64 image, hoặc icon có sẵn: user, wallet, star, guide, clock
                </small>
              </div>

              <div className="form-group">
                <label>Loại Menu</label>
                <select
                  value={formData.menuType}
                  onChange={(e) => setFormData({ ...formData, menuType: e.target.value })}
                >
                  <option value="single">Menu đơn</option>
                  <option value="parent">Menu có con</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit">{editingMenu ? 'Cập nhật' : 'Tạo mới'}</button>
                {editingMenu && (
                  <button type="button" onClick={resetForm}>Hủy</button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-list-section" ref={listSectionRef}>
            <h2>Danh sách Menu ({menus.length})</h2>
            <div className="items-list">
              {paginatedMenus.map(menu => (
                <div key={menu.id} className="item-card">
                  <div className="item-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <MenuIcon type={menu.icon} className="nav-icon" />
                      <h3>{menu.title}</h3>
                    </div>
                    <p className="item-meta">ID: {menu.id} | Loại: {menu.type}</p>
                    {menu.children && menu.children.length > 0 && (
                      <p className="item-meta">Số menu con: {menu.children.length}</p>
                    )}
                  </div>
                  <div className="item-actions">
                    <button onClick={() => handleEditMenu(menu)}>Sửa</button>
                    <button onClick={() => handleDeleteMenu(menu.id)} className="delete-btn">Xóa</button>
                  </div>
                </div>
              ))}
              {paginatedMenus.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#848e9c' }}>
                  Không có menu nào
                </div>
              )}
            </div>
            {menusTotalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setMenusCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={menusCurrentPage === 1}
                  className="pagination-btn"
                >
                  Trước
                </button>
                <span className="pagination-info">
                  Trang {menusCurrentPage} / {menusTotalPages}
                </span>
                <button
                  onClick={() => setMenusCurrentPage(prev => Math.min(menusTotalPages, prev + 1))}
                  disabled={menusCurrentPage === menusTotalPages}
                  className="pagination-btn"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

