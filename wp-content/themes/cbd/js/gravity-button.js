document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.querySelector(".menu-checkbox");
    
    if (menuToggle) {
        menuToggle.addEventListener("click", function () {
            if (menuToggle.checked) {
                Scroller.disable()
            } else {
                Scroller.enable()
            }
        });
    }

    // Toggle the main button and options
    const gravityButton = document.querySelector(".gravity-button-holder.toggle");
    if (gravityButton) {
        gravityButton.addEventListener("click", function () {
            const iframe = document.querySelector('#hubspot-messages-iframe-container');
            const button = document.querySelector('.gravity-button-holder.option.top');
            
            if (!iframe && button) {
                button.style.display = 'none';
            }
            
            const labelEl = document.querySelector('[data-chat="true"] .gravity-button-label');
            const hsShadow = document.querySelector(".hs-shadow-container");
            if (gravityButton.classList.contains('active') && hsShadow?.classList.contains('active')) {
                hsShadow.classList.remove("active");
                if (labelEl) labelEl.textContent = 'Chat now';
            }

            gravityButton.classList.toggle("active");

            document.querySelectorAll(".gravity-button-holder.option").forEach(function (option) {
                option.classList.toggle("active");
            });
        });
    }
   
    // Chat button behavior
    const chatElements = document.querySelectorAll('[data-chat="true"]');
    chatElements.forEach(function (element) {
        const labelEl = element.querySelector('.gravity-button-label');
        element.addEventListener("click", function (e) {
            e.preventDefault();
            var container = document.querySelector("#hubspot-messages-iframe-container");
            var hsShadow = document.querySelector(".hs-shadow-container");
            if (!container.classList.contains("active")) {
                container.classList.add("active");
                if(!hsShadow.classList.contains("active")) {
                    hsShadow.classList.add('active');
                    if (window.innerWidth > 992 && labelEl) labelEl.textContent = 'Close';
                }
                else {
                    if (window.innerWidth > 992 && labelEl) labelEl.textContent = 'Close';
                }
                if (window.HubSpotConversations?.widget) {
                    window.HubSpotConversations.widget.open({
                        conversation: { id: "62041379" }
                    });
                }
            }
            else {                
                if (hsShadow?.classList.contains('active')) {
                    hsShadow.classList.remove('active');
                    if (labelEl) labelEl.textContent = 'Chat now';
                } else {
                    hsShadow.classList.add('active');
                    if (window.innerWidth > 992 && labelEl) labelEl.textContent = 'Close';
                }
                
                if (window.HubSpotConversations?.widget) {
                    window.HubSpotConversations.widget.open({
                        conversation: { id: "62041379" }
                    });
                }
            }
        });
        
    });

    const meetingElements = document.querySelectorAll('[data-meeting="true"]');
    const meetingURL = meetingElements[0]?.getAttribute('data-meeting-url');
    const container = document.getElementById('hubspot-meeting-container');
    const hubspotOverlay = document.querySelector('.hubspot-overlay');
    
    meetingElements.forEach(function (el) {
        el.addEventListener("click", function (e) {
            e.preventDefault();
            
            const labelEl = document.querySelector('[data-chat="true"] .gravity-button-label');
            const hsShadow = document.querySelector(".hs-shadow-container");
            if (hsShadow?.classList.contains('active')) {
                hsShadow.classList.remove('active');
                if (labelEl) labelEl.textContent = 'Chat now';
            }
            
            const isActive = container.classList.contains('active');
    
            if (!isActive) {
                if (container && container.innerHTML.trim() === "") {
                    container.innerHTML = `
                        <iframe src="${meetingURL}" 
                            width="100%" 
                            height="100%" 
                            frameborder="0" 
                            style="border:0;">
                        </iframe>
                    `;
                }
    
                document.body.style.overflow = 'hidden';
                document.body.classList.add('hubspot-open');
                container.classList.add('active');
                if (el.querySelector('.gravity-button-label')) {
                    el.querySelector('.gravity-button-label').textContent = 'Close';
                }
            } else {
                container.classList.remove('active');
                document.body.classList.remove('hubspot-open');
                document.body.style.overflow = '';
                el.querySelector('.gravity-button-label').textContent = 'Book a call';
            }
    
            if (hubspotOverlay && container) {
                hubspotOverlay.addEventListener('click', function () {
                    container.classList.remove('active');
                    document.body.classList.remove('hubspot-open');
                    document.body.style.overflow = '';
    
                    meetingElements.forEach(function (btn) {
                        const label = btn.querySelector('.gravity-button-label');
                        if (label) label.textContent = 'Book a call';
                    });
                }, { once: true });
            }
        });
    });
    
    const contactForm = document.querySelector('#contact-form');
    
    if(contactForm) {
      // 1. Handle radio button (name="budget")
      const budgetRadios = contactForm.querySelectorAll('input[name="budget"]');
      const hubspotBudgetInput = contactForm.querySelector('input[name="budget-hubspot"]');
        
      if (budgetRadios.length > 0 && hubspotBudgetInput) {
        budgetRadios.forEach(radio => {
          radio.addEventListener('change', () => {
            hubspotBudgetInput.value = radio.value;
            console.log(hubspotBudgetInput.value)
          });
        });
      }
    
      // 2. Handle text input (name="clientbrief")
      const clientBriefInput = contactForm.querySelector('input[name="clientbrief"]'); // or 'input' if it's an input field
      const clientBriefHubspotInput = contactForm.querySelector('input[name="clientbrief-hubspot"]');
    
      if (clientBriefInput && clientBriefHubspotInput) {
        clientBriefInput.addEventListener('change', () => {
          clientBriefHubspotInput.value = clientBriefInput.files.length > 0 ? 'true' : 'false';
          console.log(clientBriefHubspotInput.value)
        });
      }
    }
    
    setTimeout(function () {
      var cookieModal = document.querySelector('.cky-modal');
      if (!cookieModal) return;
    
      var openers = [];
      if (document.querySelector('.cky-btn-revisit')) {
        openers.push(document.querySelector('.cky-btn-revisit'));
      }
      if (document.querySelector('.cky-btn-customize')) {
        openers.push(document.querySelector('.cky-btn-customize'));
      }
    
      Array.prototype.forEach.call(openers, function (btn) {
        if (!btn) return;
        btn.addEventListener('click', function () {
          if (window.Scroller && typeof Scroller.disable === 'function') {
            Scroller.disable();
          }
          var wrap = document.querySelector('.cky-preference-body-wrapper') || document.querySelector('.cky-prefrence-body-wrapper');
          if (wrap) wrap.setAttribute('data-lenis-prevent', '');
        }, { passive: true });
      });
    
      var closers = [];
      Array.prototype.push.apply(
        closers,
        document.querySelectorAll('.cky-prefrence-btn-wrapper button') 
      );
      Array.prototype.push.apply(
        closers,
        document.querySelectorAll('.cky-btn-close')
      );
    
      Array.prototype.forEach.call(closers, function (btn) {
        btn.addEventListener('click', function () {
          if (window.Scroller && typeof Scroller.enable === 'function') {
            Scroller.enable();
          }
        }, { passive: true });
      });
    }, 1000);
    
});