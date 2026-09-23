document.addEventListener('DOMContentLoaded', function () {
  // Latest News Carousel
  if (document.querySelector('.latest-news .swiper')) {
    const newsSwipers = document.querySelectorAll('.latest-news .swiper')

    Array.prototype.forEach.call(newsSwipers, function (el) {
      const section = el.closest('.latest-news')
      const swiper = new Swiper(el, {
        slidesPerView: 1.15,
        spaceBetween: 20,
        speed: 600,
        scrollbar: {
          el: section.querySelector('.swiper-scrollbar'),
          draggable: true
        },
        breakpoints: {
          567: {
            slidesPerView: 1.5,
            spaceBetween: 30
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 45
          },
          1199: {
            slidesPerView: 3,
            spaceBetween: 60
          }
        },
        on: {
          slideChange({ slides, realIndex, previousRealIndex }) {
            slides[realIndex].querySelector('.video-hover video')?.play()
            slides[realIndex].querySelector('.video-hover')?.classList.add('hover')

            slides[previousRealIndex].querySelector('.video-hover video')?.pause()
            slides[previousRealIndex].querySelector('.video-hover')?.classList.remove('hover')
          }
        }
      })
    })
  }
})
