import React, { useState, useEffect } from 'react';
import { getMenus, getPages, getPageById } from '../utils/dataService';
import { useLanguage } from '../contexts/LanguageContext';
import './Pagination.css';

function Pagination({ currentPageId, onPageChange }) {
  const { translate } = useLanguage();
  const [menus, setMenus] = useState([]);
  const [pages, setPages] = useState([]);
  const [orderedPages, setOrderedPages] = useState([]);

  // Load menus và pages từ API
  useEffect(() => {
    const loadData = async () => {
      try {
        const menusData = await getMenus();
        const pagesData = await getPages();
        // Đảm bảo luôn là array
        setMenus(Array.isArray(menusData) ? menusData : []);
        setPages(Array.isArray(pagesData) ? pagesData : []);
      } catch (error) {
        console.error('Error loading data in Pagination:', error);
        setMenus([]);
        setPages([]);
      }
    };
    loadData();
  }, []);

  // Tính toán orderedPages khi menus hoặc pages thay đổi
  useEffect(() => {
    if (!Array.isArray(menus) || !Array.isArray(pages)) {
      setOrderedPages([]);
      return;
    }

    const ordered = [];
    const addedPageIds = new Set();

    menus.forEach(menu => {
      if (menu.type === 'parent' && menu.children && menu.children.length > 0) {
        // Với menu parent, thêm các children pages theo thứ tự
        menu.children.forEach(child => {
          const page = pages.find(p => p.id === child.id);
          if (page && !addedPageIds.has(page.id)) {
            ordered.push(page);
            addedPageIds.add(page.id);
          }
        });
      } else if (menu.type === 'single') {
        // Với menu single, thêm page tương ứng
        const page = pages.find(p => p.id === menu.id);
        if (page && !addedPageIds.has(page.id)) {
          ordered.push(page);
          addedPageIds.add(page.id);
        }
      }
    });

    // Thêm các pages còn lại không có trong menu (fallback)
    pages.forEach(page => {
      if (!addedPageIds.has(page.id)) {
        ordered.push(page);
      }
    });

    setOrderedPages(ordered);
  }, [menus, pages]);
  const currentIndex = orderedPages.findIndex(p => p.id === currentPageId);
  const prevPage = currentIndex > 0 ? orderedPages[currentIndex - 1] : null;
  const nextPage = currentIndex < orderedPages.length - 1 ? orderedPages[currentIndex + 1] : null;

  if (!prevPage && !nextPage) {
    return null; // Không hiển thị pagination nếu không có page trước/sau
  }

  const handlePrevClick = () => {
    if (prevPage && onPageChange) {
      onPageChange(prevPage.id);
    }
  };

  const handleNextClick = () => {
    if (nextPage && onPageChange) {
      onPageChange(nextPage.id);
    }
  };

  return (
    <div className="article-pagination">
      {prevPage && (
        <button 
          className="pagination-button pagination-prev"
          onClick={handlePrevClick}
        >
          <svg className="pagination-arrow pagination-arrow-left" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 9L4.5 6L7.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="pagination-content">
            <span className="pagination-label">{translate('ui_pagination_previous', 'Previous')}</span>
            <span className="pagination-title">{translate(`page_${prevPage.id}_title`, prevPage.title)}</span>
          </div>
        </button>
      )}
      
      {nextPage && (
        <button 
          className="pagination-button pagination-next"
          onClick={handleNextClick}
        >
          <div className="pagination-content">
            <span className="pagination-label">{translate('ui_pagination_next', 'Next')}</span>
            <span className="pagination-title">{translate(`page_${nextPage.id}_title`, nextPage.title)}</span>
          </div>
          <svg className="pagination-arrow pagination-arrow-right" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export default Pagination;

