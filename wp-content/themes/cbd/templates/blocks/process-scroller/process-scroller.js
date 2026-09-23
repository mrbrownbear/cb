document.addEventListener('DOMContentLoaded', function () {
  // Process Tabs
  gsap.utils.toArray('.process-scroller .item').forEach(el => {
    gsap.utils.toArray(el.querySelectorAll('.nav-toggles li')).forEach((el, i) => {
      el.addEventListener('click', e => {
        const item = e.target.closest('.item')
        if (!el.classList.contains('active')) {
          el.closest('.nav-toggles').querySelector('li.active').classList.remove('active')
          el.classList.add('active')
          item.querySelector('.tab.active').classList.remove('active')
          item.querySelector(`.tab:nth-of-type(${i + 1})`).classList.add('active')
        }
      })
    })
  })

  const MatchMedia = gsap.matchMedia()

  function processScroller() {
    const sections = document.querySelectorAll('.process-scroller')
    if (window.innerWidth > 1199) {
      sections.forEach(function (el) {
        const itemsWrapper = el.querySelector('.items')
        const items = el.querySelectorAll('.item')
        const gallery = el.querySelector('.gallery')
        const galleryCol = el.querySelector('.gallery-col')
        const galleryItems = gallery.querySelectorAll('.gallery-item')
        const stats = el.querySelectorAll('.stat')
        const statText = el.querySelector('.gallery-stats-text')
        const medias = gallery.querySelectorAll('.media')
        const statNumberSplit = []
        const statTextSplit = []

        ScrollTrigger.create({
          trigger: gallery,
          start: `top center-=${gallery.offsetHeight / 2}`,
          endTrigger: galleryCol,
          end: `bottom center+=${gallery.offsetHeight / 2}`,
          pin: true,
          invalidateOnRefresh: true
          // refreshPriority: document.querySelector('.section.side-scroller') ? -20 : null
        })

        stats.forEach(function (stat) {
          const number = stat.querySelector('.stat-number')
          const text = stat.querySelector('.stat-text')

          statNumberSplit.push(new SplitText(number, { type: 'chars' }))
          statTextSplit.push(new SplitText(text, { type: 'lines' }))
        })

        items.forEach(function (item, index) {
          ScrollTrigger.create({
            trigger: item,
            start: () => `top center-=${item.offsetHeight / 3}`,
            end: 'bottom center',
            scrub: true,
            invalidateOnRefresh: true,
            onEnter: () => {
              gsap.killTweensOf(medias[index])
              gsap.killTweensOf(statNumberSplit[index].chars)

              if (index > 0) {
                statNumberSplit.forEach((split, i) => {
                  if (i !== index) {
                    gsap.killTweensOf(split.chars)
                    if (split.chars.length > 0) {
                      gsap.to(split.chars, {
                        // clipPath: 'inset(0% 0% 100% 0%)',
                        scale: 0.8,
                        y: '30%',
                        opacity: 0,
                        ease: 'power1.out',
                        duration: 0.2,
                        stagger: 0.05
                      })
                    }
                  }
                })
              }

              gsap.to(medias[index], { autoAlpha: 1, ease: 'none', duration: 0.15 })
              gsap.to(statText, {
                duration: 1,
                scrambleText: stats[index].getAttribute('data-text')
              })

              if (statNumberSplit[index].chars.length > 0) {
                gsap.to(statNumberSplit[index].chars, {
                  // clipPath: 'inset(0% 0% 0% 0%)',
                  scale: 1,
                  y: 0,
                  opacity: 1,
                  ease: 'power1.out',
                  duration: 0.2,
                  stagger: 0.05,
                  delay: 0.5
                })
              }
            }
          })
          ScrollTrigger.create({
            trigger: item,
            start: `top 75%`,
            end: 'bottom center',
            scrub: true,
            invalidateOnRefresh: true,
            onLeaveBack: () => {
              gsap.killTweensOf(medias[index])

              statNumberSplit.forEach((split, i) => {
                if (i !== index - 1) {
                  gsap.killTweensOf(statNumberSplit[i].chars)
                  if (split.chars.length > 0) {
                    gsap.to(split.chars, {
                      // clipPath: 'inset(0% 0% 100% 0%)',
                      scale: 0.8,
                      y: '30%',
                      opacity: 0,
                      ease: 'power1.out',
                      duration: 0.2,
                      stagger: 0.05
                    })
                  }
                }
              })

              if (index > 0) {
                gsap.to(medias[index], { autoAlpha: 0, ease: 'none', duration: 0.15 })
                if (statNumberSplit[index - 1].chars.length > 0) {
                  gsap.to(statNumberSplit[index - 1].chars, {
                    // clipPath: 'inset(0% 0% 0% 0%)',
                    scale: 1,
                    opacity: 1,
                    y: 0,
                    ease: 'power1.out',
                    duration: 0.2,
                    stagger: 0.05,
                    delay: 0.5
                  })
                }
                gsap.to(statText, {
                  duration: 1,
                  scrambleText: stats[index - 1].getAttribute('data-text')
                })
              }
            }
          })

          gsap.fromTo(
            item,
            {
              opacity: 0
            },
            {
              opacity: 1,
              scale: 1,
              scrollTrigger: {
                trigger: item,
                start: 'top bottom',
                end: 'bottom 30%',
                scrub: 1,
                toggleActions: 'play none none reverse',
                invalidateOnRefresh: true
              }
            }
          )

          // Video handling for each item
          const mobileVideo = item.querySelector('video')
          const desktopVideo = medias[index].querySelector('video')
          if (mobileVideo || desktopVideo) {
            ScrollTrigger.create({
              trigger: item,
              start: 'top center',
              end: 'bottom top',
              invalidateOnRefresh: true,
              // markers: index === 0,
              onLeave: () => {
                mobileVideo?.pause()
                desktopVideo?.pause()
              },
              onLeaveBack: () => {
                mobileVideo?.pause()
                desktopVideo?.pause()
              },
              onEnterBack: () => {
                mobileVideo?.play()
                desktopVideo?.play()
              },
              onEnter: () => {
                mobileVideo?.play()
                desktopVideo?.play()
              }
            })
          }
        })
      })
    } else {
      sections.forEach(function (el) {
        const items = el.querySelectorAll('.item')

        items.forEach(function (item, index) {
          if (window.innerWidth <= 1199) {
            const itemVideo = item.querySelector('.media video')

            if (itemVideo) {
              ScrollTrigger.create({
                trigger: item,
                start: 'top center',
                end: 'bottom center',
                scrub: true,
                invalidateOnRefresh: true,
                onEnter: () => {
                  // console.log('play')
                  itemVideo.play()
                },
                onLeave: () => {
                  itemVideo.pause()
                },
                onEnterBack: () => {
                  itemVideo.play()
                },
                onLeaveBack: () => {
                  itemVideo.pause()
                }
              })
            }
          }
        })
      })
    }
  }

  processScroller()

  // All the resize & orientation events
  window.addEventListener('resize', function () {
    // Update sizes
    processScroller()
  })
  screen.orientation.addEventListener('change', function () {
    // Update sizes
    processScroller()
  })
})
