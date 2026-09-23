(function () {
  'use strict'

  const FLUID_SCRIPT = '/wp-content/themes/cbd/templates/blocks/hero/fluid.js'

  function supportsWebGL() {
    try {
      const canvas = document.createElement('canvas')
      return !!(
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      )
    } catch (_) {
      return false
    }
  }

  function scriptAlreadyPresent(path) {
    return Array.from(document.scripts).some(function (script) {
      if (!script.src) return false
      try {
        return new URL(script.src, window.location.href).pathname === path
      } catch (_) {
        return false
      }
    })
  }

  function startFluid() {
    if (window.innerWidth <= 480) return
    if (!document.querySelector('.hero')) return
    if (!supportsWebGL()) return

    if (typeof window.initializeCBDHeroFluid === 'function') {
      window.initializeCBDHeroFluid()
      return
    }

    if (window.__cbdFluidLoaderStarted || scriptAlreadyPresent(FLUID_SCRIPT)) return
    window.__cbdFluidLoaderStarted = true

    const script = document.createElement('script')
    script.src = FLUID_SCRIPT
    script.async = true
    script.onload = function () {
      if (typeof window.initializeCBDHeroFluid === 'function') {
        window.initializeCBDHeroFluid()
      }
    }
    script.onerror = function () {
      window.__cbdFluidLoaderStarted = false
      console.warn('Hero fluid animation could not be loaded')
    }
    document.body.appendChild(script)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startFluid, { once: true })
  } else {
    startFluid()
  }

  window.addEventListener('pageshow', startFluid)
})()
