import React from 'react';

function MenuIcon({ type, className = "nav-icon" }) {
  if (!type) {
    return null;
  }

  const typeStr = typeof type === 'string' ? type.trim() : '';

  // Nếu là URL hình ảnh (http://, https://, hoặc data:image)
  if (typeStr.startsWith('http://') || typeStr.startsWith('https://') || typeStr.startsWith('data:image')) {
    return (
      <img 
        src={typeStr} 
        alt="icon" 
        className={className}
        style={{ 
          width: '20px', 
          height: '20px', 
          objectFit: 'contain',
          display: 'inline-block'
        }}
      />
    );
  }

  // Nếu type là SVG code (bắt đầu bằng <svg), render trực tiếp
  if (typeStr.startsWith('<svg')) {
    // Thêm className vào SVG nếu chưa có
    let svgCode = typeStr;
    if (!svgCode.includes('class=') && !svgCode.includes('className=')) {
      svgCode = svgCode.replace('<svg', `<svg class="${className}"`);
    }
    return (
      <span 
        dangerouslySetInnerHTML={{ __html: svgCode }}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}
      />
    );
  }

  const iconProps = {
    width: "20",
    height: "20",
    viewBox: "0 0 20 20",
    fill: "none",
    className: className
  };

  switch (type) {
    case 'user':
      return (
        <svg {...iconProps}>
          <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 17C4 14 6.5 12 10 12C13.5 12 16 14 16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'wallet':
      return (
        <svg {...iconProps}>
          <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2 9H18" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="10" cy="11.5" r="1" fill="currentColor"/>
        </svg>
      );
    case 'star':
      return (
        <svg {...iconProps}>
          <path d="M10 2L12.5 7.5L18.5 8.5L14 12.5L15 18.5L10 15.5L5 18.5L6 12.5L1.5 8.5L7.5 7.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'guide':
      return (
        <svg {...iconProps}>
          <path d="M10 2L2 7L10 12L18 7L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 13L10 18L18 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 10L10 15L18 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'clock':
      return (
        <svg {...iconProps}>
          <path d="M10 2C6 2 3 5 3 9C3 13 6 16 10 16C14 16 17 13 17 9C17 5 14 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 6V10L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    default:
      return (
        <svg {...iconProps}>
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );
  }
}

export default MenuIcon;

