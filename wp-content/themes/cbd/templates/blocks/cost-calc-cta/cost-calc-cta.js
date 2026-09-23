document.addEventListener('DOMContentLoaded', function () {
  // Cost Calculator
  if (document.querySelector('.bg-lights')) {
    function animateWithRandomNumber(myClass, from, to) {
      gsap.fromTo(
        myClass,
        Math.floor(Math.random() * 20 + 1),
        { y: from },
        {
          y: to,
          onComplete: animateWithRandomNumber,
          onCompleteParams: [myClass, from, to],
          ease: 'power1.inOut'
        }
      )
    }

    const itemsDown = ['.light4', '.light5', '.light6', '.light7', '.light8', '.light11', '.light12', '.light13', '.light14', '.light15', '.light16'].forEach(
      e => animateWithRandomNumber(e, -1080, 1080)
    )
    const itemsUp = ['.light1', '.light2', '.light3', '.light9', '.light10', '.light17'].forEach(e => animateWithRandomNumber(e, 1080, -1080))
  }
})
