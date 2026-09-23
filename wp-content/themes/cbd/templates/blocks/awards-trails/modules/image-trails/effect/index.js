// 'preloadImages' is a utility function that handles the preloading of images to ensure they are fully loaded before being used.
import { preloadImages } from '../utils.js'
// 'ImageTrail' is a class designed to manage and animate a sequence of images, reacting to mouse movements.
import { ImageTrail } from './imageTrail.js'

// Preload all images
preloadImages('.awards-trails img').then(() => {
  // Instantiate a new ImageTrail object, initializing it with the element that has the class 'content'.
  // The ImageTrail instance starts managing and animating the sequence of images within the specified element, reacting to mouse movements.
  new ImageTrail(document.querySelector('.awards-trails .content'))
})

const awardsLink = document.querySelector('.awards-trails a');

if (awardsLink) {
  awardsLink.addEventListener('click', function (e) {
    const currentUrl = window.location.href.split('#')[0];
    const targetUrl = e.currentTarget.href.split('#')[0]; // remove hash for comparison
    const hasHash = e.currentTarget.hash; // includes "#section-id" or empty string

    // If base URLs match exactly and there's a hash
    if (hasHash && currentUrl === targetUrl) {
      e.preventDefault(); // prevent default navigation
      const hash = hasHash.substring(1); // remove leading '#'
      const idSection = document.getElementById(hash);

      if (idSection) {
        idSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Otherwise, proceed with normal navigation
      window.location.href = e.currentTarget.href;
    }
  });
}
