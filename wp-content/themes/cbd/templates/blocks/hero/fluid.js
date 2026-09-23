(function () {
  'use strict'

  const CORE_SCRIPT = '/wp-content/themes/cbd/templates/blocks/hero/fluid-core.js'
  let initPromise = null
  let ambientTimer = null

  function findHero() {
    return document.querySelector('.hero')
  }

  function ensureCanvas(hero) {
    let canvas = hero.querySelector('canvas.hero-bg')
    if (canvas) return canvas

    canvas = document.createElement('canvas')
    canvas.className = 'hero-bg'

    const scrollElement = hero.querySelector('.scroll')
    if (scrollElement) {
      scrollElement.insertAdjacentElement('afterend', canvas)
    } else {
      hero.appendChild(canvas)
    }

    return canvas
  }

  function loadCore() {
    if (typeof window.generateCanvasHome === 'function') {
      return Promise.resolve()
    }

    const existing = Array.from(document.scripts).find(function (script) {
      if (!script.src) return false
      try {
        return new URL(script.src, window.location.href).pathname === CORE_SCRIPT
      } catch (_) {
        return false
      }
    })

    if (existing) {
      return new Promise(function (resolve, reject) {
        if (typeof window.generateCanvasHome === 'function') {
          resolve()
          return
        }
        existing.addEventListener('load', resolve, { once: true })
        existing.addEventListener('error', reject, { once: true })
        setTimeout(function () {
          if (typeof window.generateCanvasHome === 'function') resolve()
        }, 50)
      })
    }

    return new Promise(function (resolve, reject) {
      const script = document.createElement('script')
      script.src = CORE_SCRIPT
      script.async = true
      script.onload = resolve
      script.onerror = reject
      document.body.appendChild(script)
    })
  }

  function dispatchMotion(canvas, x, y, previous) {
    const rect = canvas.getBoundingClientRect()
    const clientX = rect.left + rect.width * x
    const clientY = rect.top + rect.height * y

    if (!previous) {
      canvas.dispatchEvent(new MouseEvent('mouseover', {
        bubbles: true,
        clientX: clientX,
        clientY: clientY
      }))
    }

    canvas.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      clientX: clientX,
      clientY: clientY
    }))
  }

  function primeCanvas(canvas) {
    const points = [
      [0.18, 0.42],
      [0.32, 0.56],
      [0.48, 0.44],
      [0.62, 0.58],
      [0.78, 0.40]
    ]

    points.forEach(function (point, index) {
      setTimeout(function () {
        dispatchMotion(canvas, point[0], point[1], index > 0)
      }, 90 * index)
    })
  }

  function startAmbientMotion(canvas) {
    if (ambientTimer) clearInterval(ambientTimer)

    ambientTimer = setInterval(function () {
      if (document.hidden || !canvas.isConnected) return
      const rect = canvas.getBoundingClientRect()
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return

      const t = Date.now() / 1500
      const x1 = 0.5 + Math.sin(t) * 0.22
      const y1 = 0.5 + Math.cos(t * 0.8) * 0.16
      const x2 = 0.5 + Math.sin(t + 0.7) * 0.25
      const y2 = 0.5 + Math.cos(t * 0.8 + 0.5) * 0.18

      dispatchMotion(canvas, x1, y1, false)
      setTimeout(function () {
        dispatchMotion(canvas, x2, y2, true)
      }, 120)
    }, 2800)
  }

  async function initialize() {
    const hero = findHero()
    if (!hero) return

    const canvas = ensureCanvas(hero)
    if (canvas.dataset.fluidInitialized === 'true') return
    canvas.dataset.fluidInitialized = 'pending'

    try {
      await loadCore()
      if (typeof window.generateCanvasHome !== 'function') {
        throw new Error('generateCanvasHome is unavailable')
      }

      window.generateCanvasHome(canvas)
      canvas.dataset.fluidInitialized = 'true'

      const gradient = hero.querySelector('.gradient')
      if (gradient) gradient.style.opacity = '0'

      requestAnimationFrame(function () {
        primeCanvas(canvas)
        startAmbientMotion(canvas)
      })
    } catch (error) {
      canvas.dataset.fluidInitialized = 'false'
      const gradient = hero.querySelector('.gradient')
      if (gradient) gradient.style.opacity = ''
      console.error('Hero fluid animation failed:', error)
    }
  }

  window.initializeCBDHeroFluid = function () {
    if (!initPromise) {
      initPromise = Promise.resolve().then(initialize).finally(function () {
        initPromise = null
      })
    }
    return initPromise
  }

  window.initializeCBDHeroFluid()
})()
