document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-question-group]').forEach(group => {
    const triggers = group.querySelectorAll('[data-question]');
    const askEl    = group.querySelector('[data-question-ask]');

    // Close ALL triggers across the whole page
    const closeAll = () => {
      document.querySelectorAll('[data-question].is-active').forEach(t => t.classList.remove('is-active'));
      // If your panels also use an "is-active" class, uncomment:
      // document.querySelectorAll('[data-question-display].is-active').forEach(p => p.classList.remove('is-active'));
    };

    const show = (val, triggerEl) => {
      closeAll();
      triggerEl.classList.add('is-active');
      // If panels are shown via their own class, you can also toggle here:
      // const panel = group.querySelector(`[data-question-display="${val}"]`);
      // if (panel) panel.classList.add('is-active');
    };

    // Handle question triggers (Yes / No)
    triggers.forEach(t => {
      t.addEventListener('click', e => {
        e.stopPropagation();           // keep outside-click handler from firing
        show(t.dataset.question, t);
      });
      t.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          show(t.dataset.question, t);
        }
      });
    });

    // Click outside closes everything
    document.addEventListener('click', e => {
      if (!askEl.contains(e.target)) closeAll();
    });

    // Escape closes everything
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAll();
    });
  });
});
