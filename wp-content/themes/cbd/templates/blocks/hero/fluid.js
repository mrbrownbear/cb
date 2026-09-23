let canvasInitialized = false

// document.addEventListener('DOMContentLoaded', function () {
//   // Attach interaction events (hover, scroll, touch, keypress)
//   ;['mouseover', 'touchstart', 'scroll', 'keydown'].forEach(event => {
//     document.addEventListener(event, handleInteraction, { once: true })
//   })
// })

function handleInteraction() {
  if (!canvasInitialized) {
    // Defer canvas and script insertion to reduce any immediate blocking
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initializeCanvasAndScript)
    } else {
      setTimeout(initializeCanvasAndScript, 50) // Fallback for browsers without requestIdleCallback
    }
    canvasInitialized = true
  }
}

function initializeCanvasAndScript() {
  // Create the canvas and insert it after the .scroll element
  document.querySelector('.hero .gradient').remove();
  const canvas = document.createElement('canvas')
  canvas.className = 'hero-bg'
  const scrollElement = document.querySelector('.scroll')
  scrollElement.insertAdjacentElement('afterend', canvas)

  // Dynamically load the fluid-core.js script
  const script = document.createElement('script')
  script.async = true // Ensure non-blocking load
  script.src = '/wp-content/themes/cbd/templates/blocks/hero/fluid-core.js' // Ensure the correct path
  script.onload = function () {
    generateCanvasHome(canvas) // Initialize after the script loads
  }
  document.body.appendChild(script)
}
handleInteraction();