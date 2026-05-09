/**
 * Utility functions for markdown support and keyboard shortcuts
 */

export const handleMarkdownShortcut = (e, text, setText, inputRef) => {
  const { key, ctrlKey, metaKey } = e;
  const isModifier = ctrlKey || metaKey;

  if (isModifier && (key === 'b' || key === 'i' || key === 'u')) {
    e.preventDefault();
    
    const start = inputRef.current.selectionStart;
    const end = inputRef.current.selectionEnd;
    const selectedText = text.substring(start, end);
    
    let before = text.substring(0, start);
    let after = text.substring(end);
    let replacement = '';
    let cursorOffset = 0;

    switch (key) {
      case 'b':
        replacement = `**${selectedText}**`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'i':
        replacement = `*${selectedText}*`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'u':
        replacement = `<u>${selectedText}</u>`;
        cursorOffset = selectedText ? 0 : 3;
        break;
      default:
        return;
    }

    const newText = before + replacement + after;
    setText(newText);

    // Reset cursor position after state update
    setTimeout(() => {
      inputRef.current.focus();
      if (selectedText) {
        inputRef.current.setSelectionRange(start, start + replacement.length);
      } else {
        inputRef.current.setSelectionRange(start + cursorOffset, start + cursorOffset);
      }
    }, 0);
  }
};

export const parseMarkdown = (text) => {
  if (!text) return '';

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Underline (the user asked for Ctrl+U)
  html = html.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, '<u>$1</u>');
  
  // Auto-detect links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  html = html.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="markdown-link">$1</a>');

  // Newlines to <br>
  html = html.replace(/\n/g, '<br>');

  return html;
};
