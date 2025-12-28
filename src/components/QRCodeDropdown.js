import React, { useRef, useEffect } from 'react';
import './QRCodeDropdown.css';

function QRCodeDropdown({ isOpen, onClose, buttonRef }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Kiểm tra xem click có phải từ dropdown hoặc nút QR code không
      const isClickInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      const isClickOnButton = buttonRef && buttonRef.current && buttonRef.current.contains(event.target);
      
      if (!isClickInsideDropdown && !isClickOnButton) {
        onClose();
      }
    };

    if (isOpen) {
      // Delay một chút để tránh conflict với onClick của button
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  // URL để tải app - có thể thay đổi theo nhu cầu
  const appDownloadUrl = 'https://onfa.io/';

  return (
    <div className="qr-dropdown" ref={dropdownRef}>
      <div className="qr-code-container">
        <div className="qr-code-inner-wrapper">
          <img 
            src="/onelinkto_ccpgu2.png"
            alt="QR Code để tải ứng dụng" 
            className="qr-code-image"
          />
        </div>
      </div>
      
      <p className="qr-dropdown-text">
        Quét để Tải xuống Ứng dụng cho iOS và Android
      </p>
      
      <button className="qr-dropdown-button" onClick={() => {
        window.open(appDownloadUrl, '_blank');
      }}>
        Thêm lựa chọn tải xuống
      </button>
    </div>
  );
}

export default QRCodeDropdown;

