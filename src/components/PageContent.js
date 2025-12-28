import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Pagination from './Pagination';
import './PageContent.css';

function PageContent({ page, onPageChange }) {
  const { translate, translateHTML } = useLanguage();
  const contentRef = useRef(null);

  // Scroll to top when page changes
  useEffect(() => {
    if (page) {
      // Scroll to top smoothly
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
  }, [page?.id]); // Trigger when page ID changes

  // Wrap tables in scrollable containers
  useEffect(() => {
    if (contentRef.current && page) {
      const tables = contentRef.current.querySelectorAll('table');
      tables.forEach((table) => {
        // Check if table is already wrapped
        if (table.parentElement.classList.contains('table-wrapper')) {
          return;
        }
        
        // Create wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        wrapper.style.overflowX = 'auto';
        wrapper.style.margin = '24px 0';
        wrapper.style.width = '100%';
        
        // Wrap table
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      });
    }
  }, [page?.id, page?.content]);

  if (!page) {
    return (
      <div className="page-content-empty">
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="#2b3139" strokeWidth="2"/>
            <path d="M32 20V32M32 40H32.02" stroke="#848e9c" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h2>{translate('empty_select_page', 'Chọn một trang để xem nội dung')}</h2>
          <p>{translate('empty_select_menu', 'Vui lòng chọn một mục từ menu bên trái để xem nội dung.')}</p>
        </div>
      </div>
    );
  }

  const translatedTitle = translate(`page_${page.id}_title`, page.title);
  const translatedContent = translateHTML(page.content, page.id);

  return (
    <article className="wiki-article">
      <h1 className="article-title">{translatedTitle}</h1>
      <div className="article-meta">
        <span className="publish-date">{page.publishDate}</span>
      </div>
      
      <div 
        ref={contentRef}
        className="article-content"
        dangerouslySetInnerHTML={{ __html: translatedContent }}
      />
      
      <Pagination currentPageId={page.id} onPageChange={onPageChange} />
    </article>
  );
}

export default PageContent;

