// Data service để quản lý pages và menu với MongoDB (100% từ database)

// API base URL - tự động detect environment
const getApiBaseUrl = () => {
  // Nếu có REACT_APP_API_URL, dùng nó (ưu tiên cao nhất)
  if (typeof window !== 'undefined' && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Development: Dùng localhost:3001 (server.js)
  // Production: Dùng relative URL (Vercel serverless functions)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3001/api';
  }
  
  // Production: Vercel tự động route /api đến serverless functions
  return '/api';
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
    const fullUrl = `${apiUrl}/get-data`;
    console.log('🔄 Loading data from API:', fullUrl);
    console.log('📍 Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');
    
    // Tạo AbortController để timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      
      // Validation: Kiểm tra data structure
      if (!data || !Array.isArray(data.pages) || !Array.isArray(data.menus)) {
        console.error('❌ Invalid data structure from API:', data);
        throw new Error('Invalid data structure received from API');
      }
      
      console.log('✅ Data loaded from API successfully');
      console.log('📊 Menus count:', data.menus?.length || 0);
      console.log('📄 Pages count:', data.pages?.length || 0);
      
      // Cảnh báo nếu dữ liệu có vẻ không đầy đủ
      if (data.pages.length < 10 && data.menus.length < 5) {
        console.warn('⚠️ WARNING: Loaded data seems incomplete!');
        console.warn('⚠️ This might indicate database issue or data loss.');
      }
      
      return data;
    } else {
      const errorText = await response.text();
      console.error('❌ API response error:', response.status, errorText);
      throw new Error(`Failed to load from API: ${response.status} - ${errorText}`);
    }
  } catch (apiError) {
    console.error('❌ Error loading from API:', apiError);
    console.error('Error details:', {
      name: apiError.name,
      message: apiError.message,
      stack: apiError.stack
    });
    
    // Trả về empty data để app vẫn có thể hiển thị, nhưng đánh dấu là không load được
    // Điều này sẽ ngăn việc save để tránh mất dữ liệu
    console.error('⚠️ WARNING: Cannot load data from API!');
    console.error('⚠️ App will use empty data. Saving will be disabled to prevent data loss.');
    console.error('⚠️ Please check:');
    console.error('   1. Development: Are you running `npm run dev` (starts both server and React)?');
    console.error('   2. Development: Is server.js running on port 3001?');
    console.error('   3. Production: Check Vercel Environment Variables (MONGODB_URI)');
    console.error('   4. Check browser console for CORS errors');
    console.error('   5. Check network tab for failed requests');
    console.error('   6. Check MongoDB connection and IP whitelist');
    
    // Trả về empty data với flag để biết là API fail
    return {
      menus: [],
      pages: [],
      _apiFailed: true, // Flag để biết API đã fail
      _error: apiError.message
    };
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
    // CRITICAL: Kiểm tra xem data có flag _apiFailed không (nghĩa là đang dùng empty data do API fail)
    if (data._apiFailed) {
      const errorMsg = `Cannot save data: API connection failed. Please start the API server (port 3001) and try again.`;
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Validation: Kiểm tra data trước khi save
    if (!data || !Array.isArray(data.pages) || !Array.isArray(data.menus)) {
      console.error('❌ Invalid data structure when saving:', data);
      throw new Error('Invalid data structure: data must have pages and menus arrays');
    }
    
    // Validation: Cảnh báo nếu dữ liệu có vẻ không đầy đủ
    if (data.pages.length < 10 && data.menus.length < 5) {
      console.warn('⚠️ WARNING: Saving data with very few items!');
      console.warn('⚠️ Pages:', data.pages.length, 'Menus:', data.menus.length);
      console.warn('⚠️ This might indicate data loss. Please verify before saving.');
      
      // Hỏi user xác nhận nếu dữ liệu quá ít (chỉ trong development)
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        const confirmed = window.confirm(
          `⚠️ CẢNH BÁO: Bạn đang lưu dữ liệu với rất ít items!\n\n` +
          `Pages: ${data.pages.length}\n` +
          `Menus: ${data.menus.length}\n\n` +
          `Điều này có thể gây mất dữ liệu. Bạn có chắc muốn tiếp tục?`
        );
        if (!confirmed) {
          throw new Error('Save cancelled by user due to data validation warning');
        }
      }
    }
    
    console.log('💾 Saving data to database:', {
      pages: data.pages.length,
      menus: data.menus.length
    });
    
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/save-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Data saved to database successfully:', {
        pages: data.pages.length,
        menus: data.menus.length
      });
      // Trigger custom event để UI có thể hiển thị thông báo
      window.dispatchEvent(new CustomEvent('dataSavedToJSON', { detail: { success: true } }));
      return { success: true };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Server error when saving:', errorData);
      throw new Error(errorData.error || 'Server error');
    }
  } catch (error) {
    console.error('❌ Error saving data to database:', error);
    console.error('❌ Data that failed to save:', {
      pages: data?.pages?.length || 0,
      menus: data?.menus?.length || 0
    });
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
  // Nếu API fail, trả về empty arrays để app vẫn hoạt động
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
  // Nếu API fail, trả về empty array để app vẫn hoạt động
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
  
  // CRITICAL: Kiểm tra xem API có fail không
  if (data._apiFailed) {
    const errorMsg = `Cannot create page: API connection failed. Please start the API server (port 3001) and try again.`;
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }
  
  // Validation: Đảm bảo data có đầy đủ pages và menus
  if (!data || !Array.isArray(data.pages) || !Array.isArray(data.menus)) {
    console.error('❌ Invalid data structure when creating page:', data);
    throw new Error('Invalid data structure: data must have pages and menus arrays');
  }
  
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
  
  // CRITICAL: Kiểm tra xem API có fail không
  if (data._apiFailed) {
    const errorMsg = `Cannot update page: API connection failed. Please start the API server (port 3001) and try again.`;
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }
  
  // Validation: Đảm bảo data có đầy đủ pages và menus
  if (!data || !Array.isArray(data.pages) || !Array.isArray(data.menus)) {
    console.error('❌ Invalid data structure when updating page:', data);
    throw new Error('Invalid data structure: data must have pages and menus arrays');
  }
  
  // CRITICAL: Kiểm tra xem có phải đang dùng defaultData không (có thể do API lỗi)
  // Nếu dữ liệu quá ít, có thể đang dùng defaultData và sẽ gây mất dữ liệu!
  const MIN_EXPECTED_PAGES = 10; // Ngưỡng tối thiểu để cảnh báo
  if (data.pages.length < MIN_EXPECTED_PAGES) {
    const errorMsg = `CRITICAL: Data seems incomplete (only ${data.pages.length} pages). This might cause data loss! Cannot proceed with update.`;
    console.error('❌', errorMsg);
    console.error('❌ Current data:', {
      pages: data.pages.length,
      menus: data.menus.length,
      pageIds: data.pages.map(p => p.id).slice(0, 10)
    });
    throw new Error(errorMsg);
  }
  
  const pageIndex = data.pages.findIndex(p => p.id === id);
  
  if (pageIndex === -1) {
    console.error('❌ Page not found:', id);
    throw new Error(`Page with id "${id}" not found`);
  }
  
  console.log('📝 Updating page:', id, 'Current pages count:', data.pages.length);
  
  const oldParentId = data.pages[pageIndex].parentId;
  const oldPage = { ...data.pages[pageIndex] };
  
  data.pages[pageIndex] = {
    ...oldPage,
    ...pageData,
    id // Đảm bảo ID không bị thay đổi
  };
  
  console.log('✅ Page updated. Pages count after update:', data.pages.length);
  
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
  
  // CRITICAL: Kiểm tra xem API có fail không
  if (data._apiFailed) {
    const errorMsg = `Cannot delete page: API connection failed. Please start the API server (port 3001) and try again.`;
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }
  
  // Validation: Đảm bảo data có đầy đủ pages và menus
  if (!data || !Array.isArray(data.pages) || !Array.isArray(data.menus)) {
    console.error('❌ Invalid data structure when deleting page:', data);
    throw new Error('Invalid data structure: data must have pages and menus arrays');
  }
  
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

