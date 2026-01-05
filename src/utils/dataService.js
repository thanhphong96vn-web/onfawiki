// Data service để quản lý pages và menu với MongoDB và localStorage

const STORAGE_KEY = 'wiki_pages_data';
const JSON_DATA_URL = '/data/wiki-data.json';

// API base URL - tự động detect environment
const getApiBaseUrl = () => {
  // Trong production (Vercel) hoặc không phải localhost, sử dụng relative URL
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api';
  }
  // Trong development (localhost), sử dụng localhost
  return 'http://localhost:3001/api';
};

// Cache cho dữ liệu đã load
let cachedData = null;
let isLoading = false;

// Function to clear cache (useful when data is updated)
export const clearCache = () => {
  cachedData = null;
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

// Load dữ liệu từ API/Database (async)
export const loadDataFromJSON = async () => {
  // Nếu đã có cache, kiểm tra localStorage trước
  if (cachedData) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const localData = JSON.parse(stored);
        // Ưu tiên localStorage nếu có
        cachedData = localData;
        return cachedData;
      } catch (e) {
        // Nếu localStorage lỗi, dùng cache hiện tại
        return cachedData;
      }
    }
    return cachedData;
  }

  // Kiểm tra localStorage trước khi load từ API
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cachedData = JSON.parse(stored);
      return cachedData;
    }
  } catch (e) {
    console.error('Error loading from localStorage:', e);
  }

  if (isLoading) {
    // Đợi nếu đang load
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (cachedData) {
          clearInterval(checkInterval);
          resolve(cachedData);
        }
      }, 100);
    });
  }

  isLoading = true;
  try {
    // Ưu tiên load từ API (MongoDB)
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/get-data`);
    
    if (response.ok) {
      const data = await response.json();
      // Lưu vào localStorage và cache
      cachedData = data;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
      isLoading = false;
      return cachedData;
    } else {
      throw new Error('Failed to load from API');
    }
  } catch (apiError) {
    console.warn('Error loading from API, trying JSON file:', apiError);
    
    // Fallback về JSON file nếu API không khả dụng
    try {
      const response = await fetch(JSON_DATA_URL);
      if (response.ok) {
        const data = await response.json();
        cachedData = data;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
        isLoading = false;
        return cachedData;
      }
    } catch (jsonError) {
      console.warn('Error loading from JSON file:', jsonError);
    }
    
    // Fallback về localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        cachedData = JSON.parse(stored);
        isLoading = false;
        return cachedData;
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
    
    // Cuối cùng dùng default data
    cachedData = defaultData;
    isLoading = false;
    return defaultData;
  }
};

// Lấy dữ liệu (sync - từ cache hoặc localStorage)
export const getData = () => {
  // Luôn ưu tiên đọc từ localStorage để có dữ liệu mới nhất
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      cachedData = data;
      return data;
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
  }

  // Nếu đã có cache, trả về cache
  if (cachedData) {
    return cachedData;
  }

  // Nếu localStorage trống, thử load từ JSON file đồng bộ (chỉ trong browser)
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      // Sử dụng XMLHttpRequest để load đồng bộ (không khuyến khích nhưng cần thiết ở đây)
      const xhr = new XMLHttpRequest();
      xhr.open('GET', JSON_DATA_URL, false); // false = synchronous
      xhr.send();
      
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        cachedData = data;
        // Lưu vào localStorage để lần sau không cần load lại
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          console.log('Data loaded from JSON file and saved to localStorage');
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
        return data;
      }
    } catch (error) {
      console.warn('Could not load from JSON file synchronously:', error);
    }
  }

  // Nếu chưa có, trả về default và trigger load từ JSON async
  cachedData = defaultData;
  // Load từ JSON file trong background
  loadDataFromJSON().catch(err => console.error('Error loading JSON:', err));
  
  return cachedData;
};

// Lưu dữ liệu vào localStorage, cache và database (qua API)
export const saveData = (data) => {
  try {
    cachedData = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('✅ Data saved to localStorage');
    
    // Gọi API để lưu vào database (fire-and-forget, không block)
    const apiUrl = getApiBaseUrl();
    fetch(`${apiUrl}/save-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    }).then(response => {
      if (response.ok) {
        console.log('✅ Data saved to database successfully');
        // Trigger custom event để UI có thể hiển thị thông báo
        window.dispatchEvent(new CustomEvent('dataSavedToJSON', { detail: { success: true } }));
      } else {
        console.warn('⚠️ Failed to save to database, but data saved to localStorage');
        window.dispatchEvent(new CustomEvent('dataSavedToJSON', { detail: { success: false, error: 'Server error' } }));
      }
    }).catch(apiError => {
      // Nếu API không khả dụng (server chưa chạy), chỉ lưu vào localStorage
      console.warn('⚠️ API server not available, data saved to localStorage only:', apiError.message);
      window.dispatchEvent(new CustomEvent('dataSavedToJSON', { detail: { success: false, error: 'Server not running' } }));
    });
  } catch (error) {
    console.error('❌ Error saving data:', error);
    throw error;
  }
};

// Hàm để sync data vào database (có thể gọi thủ công)
export const syncDataToJSON = async () => {
  try {
    const data = getData();
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

// Import dữ liệu từ file JSON
export const importDataFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // Validate data structure
        if (data.menus && data.pages) {
          cachedData = data;
          saveData(data);
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

// Lấy tất cả menus (bao gồm cả các trang không có menu cha)
export const getMenus = () => {
  const data = getData();
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

// Lấy tất cả pages
export const getPages = () => {
  const data = getData();
  return data.pages || [];
};

// Lấy page theo ID
export const getPageById = (id) => {
  const pages = getPages();
  return pages.find(page => page.id === id);
};

// Tạo page mới
export const createPage = (pageData) => {
  const data = getData();
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
  
  saveData(data);
  return newPage;
};

// Cập nhật page
export const updatePage = (id, pageData) => {
  const data = getData();
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
  
  saveData(data);
  return data.pages[pageIndex];
};

// Xóa page
export const deletePage = (id) => {
  const data = getData();
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
  
  saveData(data);
  return true;
};

// Tạo menu mới
export const createMenu = (menuData) => {
  const data = getData();
  const newMenu = {
    id: menuData.id || `menu-${Date.now()}`,
    title: menuData.title,
    icon: menuData.icon || 'guide',
    type: menuData.type || 'single',
    children: menuData.children || []
  };
  
  data.menus.push(newMenu);
  saveData(data);
  return newMenu;
};

// Cập nhật menu
export const updateMenu = (id, menuData) => {
  const data = getData();
  const menuIndex = data.menus.findIndex(m => m.id === id);
  
  if (menuIndex === -1) return null;
  
  data.menus[menuIndex] = {
    ...data.menus[menuIndex],
    ...menuData,
    id
  };
  
  saveData(data);
  return data.menus[menuIndex];
};

// Xóa menu
export const deleteMenu = (id) => {
  const data = getData();
  
  // Xóa tất cả pages liên quan
  const pagesToDelete = data.pages.filter(p => p.parentId === id || p.id === id);
  pagesToDelete.forEach(page => {
    data.pages = data.pages.filter(p => p.id !== page.id);
  });
  
  // Xóa menu
  data.menus = data.menus.filter(m => m.id !== id);
  
  saveData(data);
  return true;
};

