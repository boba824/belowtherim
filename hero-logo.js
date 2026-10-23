(() => {
  const image = document.querySelector('.hero-logo img');
  if (!image) return;

  const logos = [
    '/assets/hero-logo-mj.png',
    '/assets/hero-logo-kb.png',
    '/assets/hero-logo-lbj.png'
  ];

  image.src = logos[Math.floor(Math.random() * logos.length)];
})();