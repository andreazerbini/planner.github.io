(function () {
  const isFileProtocol = window.location.protocol === 'file:';

  function inject(attrs) {
    const script = document.createElement('script');
    Object.entries(attrs).forEach(([key, value]) => {
      if (value != null && value !== false) {
        script[key] = value;
      }
    });
    document.head.appendChild(script);
  }

  if (isFileProtocol) {
    inject({ src: './dist/app.js', defer: true });
  } else {
    inject({ src: './src/main.js', type: 'module' });
  }
})();
