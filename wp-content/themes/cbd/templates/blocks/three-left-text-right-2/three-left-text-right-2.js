document.addEventListener('DOMContentLoaded', function () {
  const el = document.querySelector('.pill-texts-swiper.swiper');
  if (!el) return;

  new Swiper(el, {
    modules: [window.SwiperModules.Autoplay],

    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    speed: 600,

    autoplay: {
      delay: 4000,
      disableOnInteraction: false
    }
  });
});
