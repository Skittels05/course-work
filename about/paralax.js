document.addEventListener('DOMContentLoaded', function() {
  // Анимация параллакса
  const paralaxSection = document.querySelector('.paralax');
  
  function handleParalax() {
    const rect = paralaxSection.getBoundingClientRect();
    const isVisible = (rect.top <= window.innerHeight / 2) && 
                     (rect.bottom >= window.innerHeight / 2);
    
    if (isVisible) {
      paralaxSection.classList.add('active');
    } else {
      paralaxSection.classList.remove('active');
    }
  }
  
  // Проверяем при загрузке
  handleParalax();
  
  // И при скролле
  window.addEventListener('scroll', handleParalax);
  
  // Оптимизация производительности
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        handleParalax();
        ticking = false;
      });
      ticking = true;
    }
  });
});