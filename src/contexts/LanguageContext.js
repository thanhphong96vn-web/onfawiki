import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMenus, getPages } from '../utils/dataService';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'vi';
  });

  const [translations, setTranslations] = useState(() => {
    // Load translations từ localStorage khi khởi tạo
    const lang = localStorage.getItem('language') || 'vi';
    if (lang === 'vi') return {};
    const stored = localStorage.getItem(`translations_${lang}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('Initial translations loaded:', Object.keys(parsed).length, 'keys');
        return parsed;
      } catch (e) {
        console.error('Error parsing initial translations:', e);
        return {};
      }
    }
    return {};
  });
  const [isTranslating, setIsTranslating] = useState(false);

  // Load translations khi language thay đổi
  useEffect(() => {
    console.log('Language changed to:', language);
    localStorage.setItem('language', language);
    loadTranslations(language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const loadTranslations = async (lang) => {
    console.log('Loading translations for language:', lang);
    
    // Nếu là tiếng Việt (mặc định), không cần dịch
    if (lang === 'vi') {
      setTranslations({});
      setIsTranslating(false);
      return;
    }

    // Chỉ load translations đã có sẵn từ localStorage (không dịch động)
    const stored = localStorage.getItem(`translations_${lang}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('Loaded translations from localStorage:', Object.keys(parsed).length, 'keys');
        setTranslations(parsed);
        setIsTranslating(false);
        return;
      } catch (e) {
        console.error('Error parsing stored translations:', e);
      }
    }

    // Nếu chưa có translations, hiển thị thông báo và giữ nguyên tiếng Việt
    console.log('No translations found for language:', lang);
    setTranslations({});
    setIsTranslating(false);
  };

  const extractTextsFromData = () => {
    const menus = getMenus();
    const pages = getPages();
    const texts = {};

    // Dịch menus
    menus.forEach(menu => {
      texts[`menu_${menu.id}`] = menu.title;
      if (menu.children) {
        menu.children.forEach(child => {
          texts[`menu_${child.id}`] = child.title;
        });
      }
    });

    // Dịch pages
    pages.forEach(page => {
      texts[`page_${page.id}_title`] = page.title;
      // Lấy text từ HTML content (loại bỏ HTML tags)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = page.content;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      if (textContent.trim()) {
        texts[`page_${page.id}_content`] = textContent.trim();
      }
    });

    // Dịch các UI text
    texts['ui_header_buy_crypto'] = 'Mua Crypto';
    texts['ui_header_market'] = 'Thị trường';
    texts['ui_header_trade'] = 'Giao dịch';
    texts['ui_header_futures'] = 'Futures';
    texts['ui_header_earn'] = 'Earn';
    texts['ui_header_square'] = 'Square';
    texts['ui_header_more'] = 'Nhiều hơn';
    texts['ui_header_login'] = 'Đăng nhập';
    texts['ui_header_register'] = 'Đăng ký';
    texts['ui_admin'] = 'Admin';
    texts['ui_share'] = 'Chia sẻ';
    texts['ui_search'] = 'Tìm';
    texts['ui_register_now'] = 'Đăng ký ngay';
    texts['ui_register_promo'] = 'Đăng ký ngay - Nhận nhiều quà tặng hấp dẫn cho người mới (dành cho người dùng đã xác minh)';
    texts['ui_related_articles'] = 'Bài viết liên quan';
    texts['ui_share_title'] = 'Chia sẻ';
    texts['ui_share_text'] = 'Chia sẻ với bạn bè để kiếm voucher và nhiều quà tặng giá trị lớn với ONFA Wallet';
    texts['ui_learn_more'] = 'Tìm hiểu thêm';
    texts['ui_login_to_earn'] = 'Đăng nhập để kiếm quà tặng đến từ việc chia sẻ';
    texts['ui_copy_link'] = 'Đã sao chép link!';
    texts['ui_copy_link_title'] = 'Sao chép link';
    texts['ui_share_facebook'] = 'Chia sẻ lên Facebook';
    texts['ui_share_telegram'] = 'Chia sẻ lên Telegram';
    texts['ui_share_twitter'] = 'Chia sẻ lên X (Twitter)';
    texts['ui_share_whatsapp'] = 'Chia sẻ lên WhatsApp';
    texts['ui_share_reddit'] = 'Chia sẻ lên Reddit';
    texts['ui_empty_select_page'] = 'Chọn một trang để xem nội dung';
    texts['ui_empty_select_menu'] = 'Vui lòng chọn một mục từ menu bên trái để xem nội dung';
    texts['ui_language'] = 'Ngôn ngữ';
    
    // Menu items
    texts['ui_menu_what_is_onfa'] = 'Onfa là gì';
    texts['ui_menu_overview'] = 'Tổng quan';
    texts['ui_menu_license'] = 'Giấy phép';
    texts['ui_menu_team'] = 'Đội ngũ';
    texts['ui_menu_whitepaper'] = 'Sách trắng';
    texts['ui_menu_features'] = 'Tính năng';
    texts['ui_menu_onfa_token'] = 'Token ONFA';
    texts['ui_menu_metti_token'] = 'Token Metti';
    texts['ui_menu_onfa_hope'] = 'ONFA Hope';
    texts['ui_menu_benefits'] = 'Lợi ích';
    texts['ui_menu_affiliate'] = 'Đối tác';
    texts['ui_menu_contact_us'] = 'Liên hệ';

    return texts;
  };

  // Đã loại bỏ translateTexts - không còn dịch động nữa

  const translate = (key, defaultText) => {
    if (language === 'vi') {
      return defaultText;
    }
    
    // Nếu có translation, trả về translation
    if (translations[key]) {
      return translations[key];
    }
    
    // Nếu đang dịch, trả về defaultText để không hiển thị undefined
    if (isTranslating) {
      return defaultText;
    }
    
    // Debug: Log nếu không tìm thấy translation
    if (Object.keys(translations).length > 0 && !translations[key]) {
      console.warn(`Translation missing for key: ${key}, language: ${language}`);
    }
    
    // Nếu không có translation và không đang dịch, trả về defaultText
    return defaultText;
  };

  const translateHTML = (html, pageId) => {
    if (language === 'vi') {
      return html;
    }

    // Lấy bản dịch HTML đã lưu từ translations
    const contentKey = `page_${pageId}_content_html`;
    const translatedHTML = translations[contentKey];
    
    // Nếu có bản dịch HTML, trả về trực tiếp
    if (translatedHTML) {
      return translatedHTML;
    }

    // Nếu không có, trả về HTML gốc
    return html;
  };

  const changeLanguage = (lang) => {
    if (lang === language) return; // Nếu đã là ngôn ngữ hiện tại thì không làm gì
    setLanguage(lang);
    // Translations sẽ được load tự động trong useEffect
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      changeLanguage, 
      translate, 
      translateHTML,
      isTranslating 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

