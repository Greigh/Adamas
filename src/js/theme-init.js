// Apply saved theme on static pages (external so CSP can omit unsafe-inline)
(function () {
  try {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  } catch {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
