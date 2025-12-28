import React, { useRef, useEffect, useState } from 'react';
import './RichTextEditor.css';

function RichTextEditor({ value, onChange, placeholder = "Nhập nội dung hoặc copy/paste từ Word..." }) {
  const editorRef = useRef(null);
  const codeTextareaRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      // Only update if the content is different and user is not editing
      if (!isFocused && !showCodeView) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isFocused, showCodeView]);

  useEffect(() => {
    // Update code view when toggling or value changes
    if (showCodeView && codeTextareaRef.current) {
      const formattedHtml = formatHtml(value || '');
      codeTextareaRef.current.value = formattedHtml;
    }
  }, [showCodeView, value]);

  const handleInput = (e) => {
    const content = e.target.innerHTML;
    if (onChange) {
      onChange(content);
    }
  };

  // Improved paste handler for Word documents
  const handlePaste = (e) => {
    e.preventDefault();
    
    const clipboardData = e.clipboardData || window.clipboardData;
    let html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');
    
    if (html) {
      // Create a temporary container to clean HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Remove unsafe elements
      const unsafeElements = tempDiv.querySelectorAll('script, style, iframe, object, embed, form, input, button, meta, link');
      unsafeElements.forEach(el => el.remove());
      
      // Clean all elements
      const allElements = tempDiv.querySelectorAll('*');
      allElements.forEach(el => {
        // Remove all style attributes (Word adds many)
        el.removeAttribute('style');
        
        // Remove Word-specific classes
        const className = el.className ? String(el.className) : '';
        if (className && (
          className.includes('Mso') || 
          className.includes('Word') ||
          className.includes('mso-') ||
          className.includes('ms-') ||
          className.includes('wp-') ||
          className.includes('wp_') ||
          className.includes('Normal') ||
          className.includes('msonormal')
        )) {
          el.removeAttribute('class');
        }
        
        // Remove Word-specific attributes
        el.removeAttribute('lang');
        el.removeAttribute('dir');
        el.removeAttribute('id');
        el.removeAttribute('xmlns');
        el.removeAttribute('xml:space');
        
        // Remove data attributes
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('data-') || attr.name.startsWith('o:')) {
            el.removeAttribute(attr.name);
          }
        });
        
        // Remove event handlers
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('on')) {
            el.removeAttribute(attr.name);
          }
        });
      });
      
      // Clean up Word-specific tags and content
      html = tempDiv.innerHTML
        // Remove Word-specific tags
        .replace(/<o:p>\s*<\/o:p>/gi, '')
        .replace(/<o:p>.*?<\/o:p>/gi, '')
        .replace(/<o:smarttagtype[^>]*>.*?<\/o:smarttagtype>/gi, '')
        // Remove empty spans
        .replace(/<span[^>]*>\s*<\/span>/gi, '')
        .replace(/<span[^>]*><\/span>/gi, '')
        // Remove font tags but keep content
        .replace(/<font[^>]*>/gi, '')
        .replace(/<\/font>/gi, '')
        // Remove v:shapes (Word shapes)
        .replace(/<v:shape[^>]*>.*?<\/v:shape>/gi, '')
        // Remove comments
        .replace(/<!--.*?-->/gi, '')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        // Clean up multiple line breaks
        .replace(/(<br\s*\/?>){3,}/gi, '<br><br>')
        // Remove javascript
        .replace(/javascript:/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '');
      
      // Insert cleaned HTML
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const tempDiv2 = document.createElement('div');
        tempDiv2.innerHTML = html;
        const fragment = document.createDocumentFragment();
        while (tempDiv2.firstChild) {
          fragment.appendChild(tempDiv2.firstChild);
        }
        range.insertNode(fragment);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.innerHTML += html;
      }
    } else if (text) {
      // Plain text fallback - preserve line breaks
      const cleanText = text
        .replace(/\r\n/g, '<br>')
        .replace(/\n/g, '<br>')
        .replace(/\r/g, '<br>');
      
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cleanText;
        const fragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }
        range.insertNode(fragment);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.innerHTML += cleanText;
      }
    }
    
    // Trigger onChange
    setTimeout(() => {
      if (editorRef.current && onChange) {
        onChange(editorRef.current.innerHTML);
      }
    }, 0);
  };

  const execCommand = (command, value = null) => {
    if (command === 'createLink') {
      const url = prompt('Nhập URL:', 'https://');
      if (url) {
        document.execCommand('createLink', false, url);
      }
    } else if (command === 'insertImage') {
      const url = prompt('Nhập URL hình ảnh:', 'https://');
      if (url) {
        document.execCommand('insertImage', false, url);
      }
    } else {
      document.execCommand(command, false, value);
    }
    editorRef.current?.focus();
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const ToolbarButton = ({ command, value, icon, label, onClick }) => (
    <button
      type="button"
      className="toolbar-btn"
      onClick={onClick || (() => execCommand(command, value))}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
    >
      {icon}
    </button>
  );

  const toggleCodeView = () => {
    if (!showCodeView) {
      // Chuyển sang code view - lấy HTML từ editor và format
      const htmlContent = editorRef.current?.innerHTML || value || '';
      const formattedHtml = formatHtml(htmlContent);
      setShowCodeView(true);
      // Set formatted HTML vào textarea sau khi state update
      setTimeout(() => {
        if (codeTextareaRef.current) {
          codeTextareaRef.current.value = formattedHtml;
        }
      }, 0);
    } else {
      // Chuyển về editor view - cập nhật HTML từ textarea
      const codeContent = codeTextareaRef.current?.value || '';
      if (editorRef.current) {
        editorRef.current.innerHTML = codeContent;
      }
      if (onChange) {
        onChange(codeContent);
      }
      setShowCodeView(false);
    }
  };

  const escapeHtml = (html) => {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  };

  const formatHtml = (html) => {
    if (!html) return '';
    
    // Remove extra whitespace but preserve structure
    let formatted = html
      .replace(/>\s+</g, '><') // Remove spaces between tags
      .replace(/></g, '>\n<') // Add line breaks between tags
      .replace(/\n\s*\n+/g, '\n') // Remove multiple empty lines
      .trim();
    
    // Better formatting with proper indentation
    const lines = formatted.split('\n');
    let indent = 0;
    const indentSize = 2;
    
    return lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      // Decrease indent for closing tags
      if (trimmed.startsWith('</')) {
        indent = Math.max(0, indent - 1);
      }
      
      const indented = ' '.repeat(indent * indentSize) + trimmed;
      
      // Increase indent for opening tags (but not self-closing tags)
      if (trimmed.startsWith('<') && 
          !trimmed.startsWith('</') && 
          !trimmed.endsWith('/>') &&
          !trimmed.match(/<(br|hr|img|input|meta|link|area|base|col|embed|source|track|wbr)[\s>]/i)) {
        indent++;
      }
      
      return indented;
    }).filter(line => line.trim()).join('\n');
  };

  return (
    <div className={`rich-text-editor ${isFocused ? 'focused' : ''}`}>
      <div className="toolbar">
        <div className="toolbar-group">
          <ToolbarButton command="bold" icon="B" label="Bold" />
          <ToolbarButton command="italic" icon="I" label="Italic" />
          <ToolbarButton command="underline" icon="U" label="Underline" />
        </div>
        
        <div className="toolbar-group">
          <ToolbarButton command="formatBlock" value="h2" icon="H2" label="Heading 2" />
          <ToolbarButton command="formatBlock" value="h3" icon="H3" label="Heading 3" />
          <ToolbarButton command="formatBlock" value="p" icon="P" label="Paragraph" />
        </div>
        
        <div className="toolbar-group">
          <ToolbarButton command="insertUnorderedList" icon="•" label="Bullet List" />
          <ToolbarButton command="insertOrderedList" icon="1." label="Numbered List" />
        </div>
        
        <div className="toolbar-group">
          <ToolbarButton command="justifyLeft" icon="⬅" label="Align Left" />
          <ToolbarButton command="justifyCenter" icon="⬌" label="Align Center" />
          <ToolbarButton command="justifyRight" icon="➡" label="Align Right" />
        </div>
        
        <div className="toolbar-group">
          <ToolbarButton command="createLink" icon="🔗" label="Insert Link" />
          <ToolbarButton 
            command="insertImage" 
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 7C6.55228 7 7 6.55228 7 6C7 5.44772 6.55228 5 6 5C5.44772 5 5 5.44772 5 6C5 6.55228 5.44772 7 6 7Z" fill="currentColor"/>
                <path d="M2 10L5 7L8 10L11 7L14 10V12C14 13.1046 13.1046 14 12 14H4C2.89543 14 2 13.1046 2 12V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            } 
            label="Insert Image" 
          />
          <ToolbarButton command="removeFormat" icon="✖" label="Remove Format" />
        </div>
        
        <div className="toolbar-group">
          <ToolbarButton 
            onClick={toggleCodeView}
            icon={showCodeView ? "👁" : "</>"}
            label={showCodeView ? "Xem Editor" : "Xem Code"}
          />
        </div>
      </div>
      
      {showCodeView ? (
        <textarea
          ref={codeTextareaRef}
          className="editor-code-view"
          onChange={(e) => {
            if (onChange) {
              onChange(e.target.value);
            }
          }}
          placeholder="HTML code..."
          spellCheck={false}
        />
      ) : (
        <div
          ref={editorRef}
          className="editor-content"
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />
      )}
    </div>
  );
}

export default RichTextEditor;
