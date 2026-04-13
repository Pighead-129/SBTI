// 滚动时卡片渐入动画
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.decor-card');
  
  // 监听滚动事件
  window.addEventListener('scroll', () => {
    cards.forEach(card => {
      const cardTop = card.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      if (cardTop < windowHeight * 0.8) {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }
    });
  });

  // 初始化卡片状态
  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });

  // 触发一次滚动事件，加载首屏卡片
  window.dispatchEvent(new Event('scroll'));

  // 气泡随机位置（可选）
  const bubbles = document.querySelectorAll('.bubble');
  bubbles.forEach(bubble => {
    const randomTop = Math.random() * 100 + '%';
    const randomLeft = Math.random() * 100 + '%';
    bubble.style.top = randomTop;
    bubble.style.left = randomLeft;
  });
});