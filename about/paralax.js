document.addEventListener('DOMContentLoaded', function() {
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

  handleParalax();

  window.addEventListener('scroll', handleParalax);

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