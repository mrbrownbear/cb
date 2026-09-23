document.addEventListener('DOMContentLoaded', function () {
  //Image Tiles
  if (document.querySelector('.image-tiles')) {
    gsap.utils.toArray('.image-tiles .tiles-line').forEach(el => {
      let slideDirection = 1
      if (el.matches('.tiles-line:nth-child(2n-1)')) {
        slideDirection = -1
      }

      gsap.to(el, 1, {
        scrollTrigger: {
          trigger: '.image-tiles',
          scrub: 1.2,
          start: 'top bottom',
          end: 'bottom top',
          toggleActions: 'play none none reverse',
          invalidateOnRefresh: true
        },
        xPercent: 10 * slideDirection
      })
    })
  }
})
