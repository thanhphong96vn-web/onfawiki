// Data service để quản lý pages và menu với MongoDB (100% từ database)

// API base URL - tự động detect environment
const getApiBaseUrl = () => {
  // Trong production (Vercel) hoặc không phải localhost, sử dụng relative URL
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api';
  }
  // Trong development (localhost), sử dụng localhost
  return 'http://localhost:3001/api';
};

// Function to clear cache (không còn dùng nữa nhưng giữ lại để tương thích)
export const clearCache = () => {
  // Không làm gì vì không còn cache
};

// Cấu trúc dữ liệu mặc định
const defaultData = {
  menus: [
    {
      id: 'account-functions',
      title: 'Chức năng Tài khoản',
      icon: 'user',
      type: 'parent',
      children: [
        { id: 'verify-identity', title: 'Xác minh danh tính', parentId: 'account-functions' },
        { id: '2fa', title: 'Xác thực 2 yếu tố', parentId: 'account-functions' },
        { id: 'account-guide', title: 'Hướng dẫn về Chức năng Tài khoản', parentId: 'account-functions' }
      ]
    },
    {
      id: 'wallet',
      title: 'Ví',
      icon: 'wallet',
      type: 'single'
    },
    {
      id: 'reward-center',
      title: 'Trung tâm Phần thưởng',
      icon: 'star',
      type: 'parent',
      children: []
    },
    {
      id: 'guide',
      title: 'Hướng dẫn',
      icon: 'guide',
      type: 'single'
    },
    {
      id: 'onfa-wallet',
      title: 'Ví ONFA',
      icon: 'wallet',
      type: 'parent',
      children: []
    },
    {
      id: 'onfa-junior',
      title: 'ONFA Junior',
      icon: 'clock',
      type: 'single'
    }
  ],
  pages: [
    {
      id: 'verify-identity',
      title: 'Xác minh danh tính',
      content: '<h2>Xác minh danh tính</h2><p>Nội dung về xác minh danh tính...</p>',
      publishDate: '2024-01-15',
      parentId: 'account-functions'
    },
    {
      id: '2fa',
      title: 'Xác thực 2 yếu tố',
      content: '<h2>Xác thực 2 yếu tố</h2><p>Nội dung về xác thực 2 yếu tố...</p>',
      publishDate: '2024-01-16',
      parentId: 'account-functions'
    },
    {
      id: 'account-guide',
      title: 'Hướng dẫn về Chức năng Tài khoản',
      content: '<h2>Hướng dẫn về Chức năng Tài khoản</h2><p>Nội dung hướng dẫn...</p>',
      publishDate: '2024-01-17',
      parentId: 'account-functions'
    },
    {
      id: 'wallet',
      title: 'Ví',
      content: '<h2>Ví</h2><p>Nội dung về ví...</p>',
      publishDate: '2024-01-18'
    },
    {
      id: 'guide',
      title: 'Bắt đầu mua và bán tiền mã hóa trên ONFA Lite',
      content: '<h2>Bắt đầu mua và bán tiền mã hóa trên ONFA Lite</h2><p>Bạn có thể tải ứng dụng ONFA để dễ dàng mua, bán hoặc chuyển đổi tiền mã hóa. ONFA Lite là phiên bản mặc định dành cho người dùng mới, cung cấp giao diện rõ ràng và dễ sử dụng.</p><p>Với ONFA Lite, bạn có thể bắt đầu giao dịch tiền mã hóa một cách nhanh chóng và an toàn. Giao diện được thiết kế đơn giản, phù hợp cho cả người mới bắt đầu và người dùng có kinh nghiệm.</p>',
      publishDate: '2021-04-12'
    },
    {
      id: 'onfa-junior',
      title: 'ONFA Junior',
      content: '<h2>ONFA Junior</h2><p>Nội dung về ONFA Junior...</p>',
      publishDate: '2024-01-19'
    }
  ]
};

// Load dữ liệu từ API/Database (100% từ database, không cache)
export const loadDataFromJSON = async () => {
  try {
    // Luôn load từ API (MongoDB)
    const apiUrl = getApiBaseUrl();
    console.log('Loading data from API:', `${apiUrl}/get-data`);
    const response = await fetch(`${apiUrl}/get-data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Data loaded from API:', data);
      return data;
    } else {
      const errorText = await response.text();
      console.error('API response error:', response.status, errorText);
      throw new Error(`Failed to load from API: ${response.status} - ${errorText}`);
    }
  } catch (apiError) {
    console.error('Error loading from API:', apiError);
    // Nếu API không khả dụng, trả về default data
    console.warn('Using default data due to API error');
    return defaultData;
  }
};

// Lấy dữ liệu (sync - từ API, nhưng trả về default nếu chưa load xong)
// Lưu ý: Hàm này chỉ nên dùng khi cần sync, tốt nhất là dùng loadDataFromJSON() async
export const getData = () => {
  // Trả về default data, component nên dùng loadDataFromJSON() để load từ API
  return defaultData;
};

// Lưu dữ liệu vào database (100% qua API, không dùng localStorage)
export const saveData = async (data) => {
  try {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/save-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      console.log('✅ Data saved to database successfully');
      // Trigger custom event để UI có thể hiển thị thông báo
      window.dispatchEvent(new CustomEvent('dataSavedToJSON', { detail: { success: true } }));
      return { success: true };
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Server error');
    }
  } catch (error) {
    console.error('❌ Error saving data to database:', error);
    window.dispatchEvent(new CustomEvent('dataSavedToJSON', { detail: { success: false, error: error.message } }));
    throw error;
  }
};

// Hàm để sync data vào database (load từ API rồi save lại)
export const syncDataToJSON = async () => {
  try {
    // Load data từ API trước
    const data = await loadDataFromJSON();
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/save-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      console.log('✅ Data synced to database successfully');
      return { success: true, message: 'Đã sync vào database thành công!' };
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Server error');
    }
  } catch (error) {
    console.error('❌ Error syncing to database:', error);
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Server không chạy! Vui lòng chạy: npm run dev');
    }
    throw error;
  }
};

// Export dữ liệu ra file JSON để download
export const exportDataToJSON = () => {
  const data = getData();
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'wiki-data.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Import dữ liệu từ file JSON và lưu vào database
export const importDataFromJSON = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // Validate data structure
        if (data.menus && data.pages) {
          // Lưu vào database
          await saveData(data);
          resolve(data);
        } else {
          reject(new Error('Invalid data format'));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// Lấy tất cả menus (bao gồm cả các trang không có menu cha) - async từ API
export const getMenus = async () => {
  const data = await loadDataFromJSON();
  const menus = data.menus || [];
  const pages = data.pages || [];
  
  // Tìm các trang không có parentId và chưa có menu tương ứng
  const pagesWithoutParent = pages.filter(page => !page.parentId);
  const existingMenuIds = menus.map(m => m.id);
  
  // Tạo menu đơn cho các trang không có parentId
  const autoMenus = pagesWithoutParent
    .filter(page => !existingMenuIds.includes(page.id))
    .map(page => ({
      id: page.id,
      title: page.title,
      icon: 'guide', // Icon mặc định
      type: 'single'
    }));
  
  // Merge menus hiện có với auto menus
  return [...menus, ...autoMenus];
};

// Lấy tất cả pages - async từ API
export const getPages = async () => {
  const data = await loadDataFromJSON();
  return data.pages || [];
};

// Lấy page theo ID - async từ API
export const getPageById = async (id) => {
  const pages = await getPages();
  return pages.find(page => page.id === id);
};

// Tạo page mới - async từ API
export const createPage = async (pageData) => {
  const data = await loadDataFromJSON();
  const newPage = {
    id: pageData.id || `page-${Date.now()}`,
    title: pageData.title,
    content: pageData.content || '',
    publishDate: pageData.publishDate || new Date().toISOString().split('T')[0],
    parentId: pageData.parentId || null
  };
  
  data.pages.push(newPage);
  
  // Nếu có parentId và là child của một menu, thêm vào children của menu đó
  if (newPage.parentId) {
    const menu = data.menus.find(m => m.id === newPage.parentId);
    if (menu && menu.type === 'parent') {
      if (!menu.children) menu.children = [];
      if (!menu.children.find(c => c.id === newPage.id)) {
        menu.children.push({ id: newPage.id, title: newPage.title, parentId: newPage.parentId });
      }
    }
  } else {
    // Nếu không có parentId, tự động tạo menu đơn nếu chưa có
    const existingMenu = data.menus.find(m => m.id === newPage.id);
    if (!existingMenu) {
      data.menus.push({
        id: newPage.id,
        title: newPage.title,
        icon: 'guide',
        type: 'single'
      });
    }
  }
  
  await saveData(data);
  return newPage;
};

// Cập nhật page - async từ API
export const updatePage = async (id, pageData) => {
  const data = await loadDataFromJSON();
  const pageIndex = data.pages.findIndex(p => p.id === id);
  
  if (pageIndex === -1) return null;
  
  const oldParentId = data.pages[pageIndex].parentId;
  data.pages[pageIndex] = {
    ...data.pages[pageIndex],
    ...pageData,
    id // Đảm bảo ID không bị thay đổi
  };
  
  // Cập nhật title trong menu children nếu có
  if (data.pages[pageIndex].parentId) {
    const menu = data.menus.find(m => m.id === data.pages[pageIndex].parentId);
    if (menu && menu.children) {
      const childIndex = menu.children.findIndex(c => c.id === id);
      if (childIndex !== -1) {
        menu.children[childIndex].title = pageData.title || data.pages[pageIndex].title;
      }
    }
  } else {
    // Nếu không có parentId, đảm bảo có menu đơn tương ứng
    const existingMenu = data.menus.find(m => m.id === id);
    if (!existingMenu) {
      data.menus.push({
        id: id,
        title: pageData.title || data.pages[pageIndex].title,
        icon: 'guide',
        type: 'single'
      });
    } else if (existingMenu.type === 'single') {
      // Cập nhật title của menu đơn nếu có
      existingMenu.title = pageData.title || data.pages[pageIndex].title;
    }
  }
  
  // Nếu parentId thay đổi từ có sang không có, xóa khỏi menu children cũ
  if (oldParentId && !data.pages[pageIndex].parentId) {
    const oldMenu = data.menus.find(m => m.id === oldParentId);
    if (oldMenu && oldMenu.children) {
      oldMenu.children = oldMenu.children.filter(c => c.id !== id);
    }
  }
  
  await saveData(data);
  return data.pages[pageIndex];
};

// Xóa page - async từ API
export const deletePage = async (id) => {
  const data = await loadDataFromJSON();
  const page = data.pages.find(p => p.id === id);
  
  if (!page) return false;
  
  // Xóa khỏi pages
  data.pages = data.pages.filter(p => p.id !== id);
  
  // Xóa khỏi menu children nếu có
  if (page.parentId) {
    const menu = data.menus.find(m => m.id === page.parentId);
    if (menu && menu.children) {
      menu.children = menu.children.filter(c => c.id !== id);
    }
  } else {
    // Nếu không có parentId, xóa menu đơn tương ứng nếu có
    const menuIndex = data.menus.findIndex(m => m.id === id && m.type === 'single');
    if (menuIndex !== -1) {
      data.menus.splice(menuIndex, 1);
    }
  }
  
  await saveData(data);
  return true;
};

// Tạo menu mới - async từ API
export const createMenu = async (menuData) => {
  const data = await loadDataFromJSON();
  const newMenu = {
    id: menuData.id || `menu-${Date.now()}`,
    title: menuData.title,
    icon: menuData.icon || 'guide',
    type: menuData.type || 'single',
    children: menuData.children || []
  };
  
  data.menus.push(newMenu);
  await saveData(data);
  return newMenu;
};

// Cập nhật menu - async từ API
export const updateMenu = async (id, menuData) => {
  const data = await loadDataFromJSON();
  const menuIndex = data.menus.findIndex(m => m.id === id);
  
  if (menuIndex === -1) return null;
  
  data.menus[menuIndex] = {
    ...data.menus[menuIndex],
    ...menuData,
    id
  };
  
  await saveData(data);
  return data.menus[menuIndex];
};

// Xóa menu - async từ API
export const deleteMenu = async (id) => {
  const data = await loadDataFromJSON();
  
  // Xóa tất cả pages liên quan
  const pagesToDelete = data.pages.filter(p => p.parentId === id || p.id === id);
  pagesToDelete.forEach(page => {
    data.pages = data.pages.filter(p => p.id !== page.id);
  });
  
  // Xóa menu
  data.menus = data.menus.filter(m => m.id !== id);
  
  await saveData(data);
  return true;
};

