import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './LanguageDropdown.css';

function LanguageDropdown() {
  const { language, changeLanguage, translate } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', nativeName: 'Tiếng Việt' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan' },
    { code: 'bg', name: 'Bulgarian', nativeName: 'български' },
    { code: 'cs', name: 'Czech', nativeName: 'čeština' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLanguageChange = async (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="language-dropdown-wrapper" ref={dropdownRef}>
      <button 
        className="header-icon-btn language-select-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path d="M17.863 1.901c1.279-.325 2.658-.332 3.565.575.69.69.845 1.661.748 2.608-.098.956-.463 2.038-1.012 3.165-.077.157-.159.316-.244.476.375 1.021.58 2.124.58 3.275 0 5.246-4.253 9.5-9.5 9.5a9.484 9.484 0 01-3.274-.58c-.16.084-.32.166-.477.243-1.127.55-2.209.916-3.165 1.014-.946.096-1.917-.06-2.607-.75-.848-.848-.894-2.11-.639-3.295.2-.922.61-1.95 1.183-3.028a9.5 9.5 0 0112.37-11.978c.535-.363 1.548-.99 2.472-1.225zM4.046 17.193c-.168.434-.38 1.004-.448 1.317-.214.993-.035 1.457.152 1.644.151.15.475.3 1.15.232.496-.051 1.103-.215 1.802-.5a9.549 9.549 0 01-2.656-2.693zm15.486-6.195c-1.047 1.518-2.368 3.103-3.9 4.635-1.531 1.531-3.116 2.852-4.634 3.899a7.6 7.6 0 008.534-8.534zM4.467 13a7.605 7.605 0 004.256 5.857l.168-.102c-.729-1.49-1.184-3.528-1.273-5.755h-3.15zm4.953 0c.085 1.916.462 3.574.987 4.746a32.592 32.592 0 003.953-3.387c.085-.085.168-.17.25-.256.005-.304.003-.72-.002-1.103H9.42zm5.283-8.105c.223.35.424.736.6 1.149.594 1.388.975 3.186 1.072 5.155h.782c.66-.853 1.23-1.688 1.7-2.479a7.624 7.624 0 00-4.154-3.825zm-5.407 0A7.606 7.606 0 004.442 11.2h3.183c.097-1.969.48-3.767 1.073-5.155.176-.412.375-.8.598-1.149zm2.705.004c-.178 0-.424.08-.73.383-.31.306-.63.795-.918 1.469-.486 1.137-.83 2.686-.925 4.448h5.144c-.095-1.762-.438-3.311-.924-4.448-.288-.674-.608-1.163-.918-1.469-.306-.302-.552-.383-.73-.383zm8.154-1.15c-.203-.203-.727-.389-1.85-.104-.35.089-.716.257-1.053.439a9.55 9.55 0 012.634 2.617c.285-.699.448-1.305.5-1.8.068-.676-.08-1.001-.231-1.152z" fill="currentColor"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          <div className="language-dropdown-header">
            <h3 className="language-dropdown-title">{translate('ui_language', 'Ngôn ngữ')}</h3>
            <input
              type="text"
              className="language-search-input"
              placeholder={translate('ui_search', 'Tìm')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="language-list">
            {filteredLanguages.map((lang) => (
              <button
                key={lang.code}
                className={`language-option ${language === lang.code ? 'active' : ''}`}
                onClick={() => handleLanguageChange(lang.code)}
              >
                <span className="language-native">{lang.nativeName}</span>
                {lang.nativeName !== lang.name && (
                  <span className="language-english">{lang.name}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LanguageDropdown;

