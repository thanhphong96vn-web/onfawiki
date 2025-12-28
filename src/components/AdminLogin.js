import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './AdminLogin.css';

function AdminLogin({ onLoginSuccess }) {
  const { translate } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple authentication - bạn có thể thay đổi username/password ở đây
    // Hoặc tích hợp với API authentication thực tế
    const ADMIN_CREDENTIALS = {
      username: 'admin@onfa.io',
      password: 'onfawiki' // Thay đổi password này trong production
    };

    // Simulate API call delay  
    setTimeout(() => {
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Lưu authentication state vào localStorage
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_login_time', new Date().toISOString());
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setError(translate('admin_login_error', 'Tên đăng nhập hoặc mật khẩu không đúng'));
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <div className="admin-login-header">
          <a href="/">
            <img src="/logo-onfa-scaled.png" alt="ONFA" className="admin-login-logo" />
          </a>
          <h2 className="admin-login-title">{translate('admin_login_title', 'Đăng nhập Admin')}</h2>
          <p className="admin-login-subtitle">{translate('admin_login_subtitle', 'Vui lòng đăng nhập để truy cập trang quản trị')}</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          <div className="admin-login-field">
            <label htmlFor="username" className="admin-login-label">
              {translate('admin_login_username', 'Tên đăng nhập')}
            </label>
            <input
              id="username"
              type="text"
              className="admin-login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={translate('admin_login_username_placeholder', 'Nhập tên đăng nhập')}
              required
              autoFocus
            />
          </div>

          <div className="admin-login-field">
            <label htmlFor="password" className="admin-login-label">
              {translate('admin_login_password', 'Mật khẩu')}
            </label>
            <input
              id="password"
              type="password"
              className="admin-login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={translate('admin_login_password_placeholder', 'Nhập mật khẩu')}
              required
            />
          </div>

          <button
            type="submit"
            className="admin-login-button"
            disabled={isLoading}
          >
            {isLoading ? translate('admin_login_loading', 'Đang đăng nhập...') : translate('admin_login_button', 'Đăng nhập')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;

