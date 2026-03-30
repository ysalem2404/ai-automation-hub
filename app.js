/* app.js — Nexus Flow v2 Interactivity (Multi-page) */

(function () {
  'use strict';

  /* ========================================
     DARK / LIGHT MODE TOGGLE
     ======================================== */

  const themeToggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;

  let currentTheme = 'dark';
  root.setAttribute('data-theme', currentTheme);
  updateToggleIcon();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', currentTheme);
      themeToggle.setAttribute('aria-label', 'Switch to ' + (currentTheme === 'dark' ? 'light' : 'dark') + ' mode');
      updateToggleIcon();
    });
  }

  function updateToggleIcon() {
    if (!themeToggle) return;
    if (currentTheme === 'dark') {
      themeToggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    } else {
      themeToggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
  }

  /* ========================================
     MOBILE HAMBURGER MENU
     ======================================== */

  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('active');
      mobileNav.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ========================================
     MOBILE DROPDOWN
     ======================================== */

  const mobileDropdownTrigger = document.querySelector('.mobile-dropdown-trigger');
  const mobileDropdownContent = document.querySelector('.mobile-dropdown-content');

  if (mobileDropdownTrigger && mobileDropdownContent) {
    mobileDropdownTrigger.addEventListener('click', () => {
      const isOpen = mobileDropdownContent.classList.toggle('open');
      mobileDropdownTrigger.classList.toggle('active', isOpen);
      mobileDropdownTrigger.setAttribute('aria-expanded', String(isOpen));
    });

    mobileDropdownContent.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (hamburger && mobileNav) {
          hamburger.classList.remove('active');
          mobileNav.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    });
  }

  /* ========================================
     DESKTOP DROPDOWN (click for mobile-like)
     ======================================== */

  const navDropdown = document.querySelector('.nav-dropdown');

  if (navDropdown) {
    navDropdown.addEventListener('click', (e) => {
      if (window.matchMedia('(hover: none)').matches) {
        e.preventDefault();
        navDropdown.classList.toggle('open');
      }
    });

    document.addEventListener('click', (e) => {
      if (!navDropdown.contains(e.target)) {
        navDropdown.classList.remove('open');
      }
    });
  }

  /* ========================================
     ACTIVE NAV LINK ON SCROLL
     Only runs on index.html (landing page)
     Other pages rely on the class set in HTML
     ======================================== */

  const isLandingPage = !!document.querySelector('.hero#hero');

  if (isLandingPage) {
    const navLinks = document.querySelectorAll('.nav-link:not(.dropdown-trigger)');
    const sections = document.querySelectorAll('section[id]');

    function updateActiveNav() {
      const scrollY = window.scrollY + 100;
      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        if (scrollY >= top && scrollY < top + height) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === '#' + id || href === './' + 'index.html#' + id || href === './index.html') {
              // On landing page, "Home" link is active at top
            }
          });
        }
      });
    }

    // Simpler approach: just keep "Home" active on the landing page
    // The scroll-based active detection from the single-page version
    // doesn't apply well to the multi-page nav structure
  }

  /* ========================================
     CHAT WIDGET
     ======================================== */

  const chatToggle = document.getElementById('chatToggle');
  const chatPanel = document.getElementById('chatPanel');
  const chatClose = document.getElementById('chatClose');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  const chatMessages = document.getElementById('chatMessages');
  const chatTyping = document.getElementById('chatTyping');

  if (chatToggle && chatPanel) {
    chatToggle.addEventListener('click', () => {
      chatPanel.classList.toggle('open');
      if (chatPanel.classList.contains('open')) {
        chatInput.focus();
      }
    });

    chatClose.addEventListener('click', () => {
      chatPanel.classList.remove('open');
    });

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    chatInput.value = '';

    chatTyping.classList.add('show');
    scrollChat();

    setTimeout(() => {
      chatTyping.classList.remove('show');
      const response = getResponse(text.toLowerCase());
      appendMessage(response, 'bot');
      scrollChat();
    }, 800 + Math.random() * 600);
  }

  function appendMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = 'chat-message ' + sender;
    msg.textContent = text;
    chatMessages.insertBefore(msg, chatTyping);
  }

  function scrollChat() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getResponse(input) {
    if (/iot|smart|building|sensor|monitor/.test(input)) {
      return 'Our IoT & Automation solutions include Smart Building Automation, Industrial IoT integration, Sensor Networks, and Remote Monitoring. We help enterprises connect their physical operations to intelligent digital systems for real-time insights and control.';
    }
    if (/cyber|security|compliance|soc|pen\s?test/.test(input)) {
      return 'Our Cybersecurity offerings include a 24/7 Security Operations Center (SOC), Penetration Testing, Compliance & GRC, and Incident Response. We protect enterprises against evolving threats with proactive defense strategies.';
    }
    if (/datacenter|gpu|infrastructure|edge|pipeline|ai\s?(data|infra)/.test(input)) {
      return 'Our AI Datacenter services provide purpose-built AI Infrastructure, GPU Clusters, Edge Computing deployments, and Data Pipeline engineering. We architect and manage the compute backbone for your machine learning operations.';
    }
    if (/erp|sap|business|workflow|analytics|bi/.test(input)) {
      return 'Our Small Business ERP solutions cover SAP Business One implementation, Custom ERP development, Workflow Automation, and BI & Analytics. We streamline your entire operation from procurement to reporting.';
    }
    if (/demo|prototype|tool|matcher|map|optimizer/.test(input)) {
      return 'Check out our Prototypes & Demos section! We have live demos including a Data Matcher for fuzzy matching, Medical Equipment Map, and AI Datacenter Map. More tools like Image Optimizer, Data Cleaner, and API Connector are coming soon!';
    }
    if (/vendor|partner|supplier|portal/.test(input)) {
      return 'Our Vendor & Supplier Portal is open for technology partners! Visit the Vendor Portal section on our site to register and submit your vendor application. We welcome Technology Providers, Consulting Firms, Hardware & Software Vendors, and more.';
    }
    if (/consult|meeting|call|schedule|book/.test(input)) {
      return "I'd love to set up a consultation! Please fill out our Let's Connect form or email us at info@thalassa-us.com. Our team typically responds within 24 hours to schedule a discovery call.";
    }
    if (/pric|cost|quote/.test(input)) {
      return 'Our solutions are tailored to each enterprise, so pricing varies based on scope and requirements. Please reach out via our Let\'s Connect form or email info@thalassa-us.com for a customized quote.';
    }
    if (/hello|hi|hey|good/.test(input)) {
      return 'Hello! Welcome to Nexus Flow. I can help you explore our IoT, Cybersecurity, AI Datacenter, and ERP services, or tell you about our live Demos and Vendor Portal. What area interests you most?';
    }
    return "Thank you for your interest! I can help with information about our IoT & Automation, Cybersecurity, AI Datacenter, and ERP services. I can also point you to our live Demos or Vendor Portal. Feel free to ask about any of these, or I can help you schedule a consultation with our team.";
  }

  /* ========================================
     WEB3FORMS CONFIGURATION
     ======================================== */

  const WEB3FORMS_KEY = 'd7fc1aad-3e1c-440d-8d4d-0294915419c6';
  const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

  // Rate-limit tracker: { formId: timestamp }
  const formCooldowns = {};
  const COOLDOWN_SECONDS = 60;

  /* ========================================
     SHARED: Form Utilities
     ======================================== */

  function stripHtml(str) {
    var tmp = document.createElement('div');
    tmp.textContent = str;
    return tmp.textContent;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showFormStatus(statusEl, message, isError) {
    statusEl.textContent = message;
    statusEl.style.padding = '12px 16px';
    statusEl.style.borderRadius = '8px';
    statusEl.style.marginBottom = '12px';
    statusEl.style.fontSize = '0.9rem';
    statusEl.style.fontWeight = '500';
    if (isError) {
      statusEl.style.background = 'rgba(239,68,68,0.15)';
      statusEl.style.color = '#ef4444';
      statusEl.style.border = '1px solid rgba(239,68,68,0.3)';
    } else {
      statusEl.style.background = 'rgba(34,197,94,0.15)';
      statusEl.style.color = '#22c55e';
      statusEl.style.border = '1px solid rgba(34,197,94,0.3)';
    }
  }

  function clearFormStatus(statusEl) {
    statusEl.textContent = '';
    statusEl.style.padding = '';
    statusEl.style.background = '';
    statusEl.style.color = '';
    statusEl.style.border = '';
    statusEl.style.marginBottom = '';
  }

  function setButtonLoading(btn, loading, originalText) {
    if (loading) {
      btn.disabled = true;
      btn.dataset.originalText = btn.textContent;
      btn.textContent = 'Sending...';
      btn.style.opacity = '0.7';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.disabled = false;
      btn.textContent = originalText || btn.dataset.originalText || 'Submit';
      btn.style.opacity = '';
      btn.style.cursor = '';
    }
  }

  function startCooldown(formId, btn, originalText) {
    var remaining = COOLDOWN_SECONDS;
    formCooldowns[formId] = Date.now();
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.style.cursor = 'not-allowed';
    var interval = setInterval(function() {
      remaining--;
      if (remaining <= 0) {
        clearInterval(interval);
        btn.disabled = false;
        btn.textContent = originalText;
        btn.style.opacity = '';
        btn.style.cursor = '';
        delete formCooldowns[formId];
      } else {
        btn.textContent = 'Submit again in ' + remaining + 's';
      }
    }, 1000);
  }

  function isCoolingDown(formId) {
    if (!formCooldowns[formId]) return false;
    return (Date.now() - formCooldowns[formId]) < COOLDOWN_SECONDS * 1000;
  }

  function validateRequiredFields(form) {
    var errors = [];
    var nameField = form.querySelector('input[name="name"]');
    var emailField = form.querySelector('input[name="email"]');
    var messageField = form.querySelector('textarea[name="message"]');

    if (nameField && !nameField.value.trim()) {
      errors.push('Name is required.');
      nameField.style.borderColor = '#ef4444';
    } else if (nameField) {
      nameField.style.borderColor = '';
    }

    if (emailField && !emailField.value.trim()) {
      errors.push('Email is required.');
      emailField.style.borderColor = '#ef4444';
    } else if (emailField && !isValidEmail(emailField.value.trim())) {
      errors.push('Please enter a valid email address.');
      emailField.style.borderColor = '#ef4444';
    } else if (emailField) {
      emailField.style.borderColor = '';
    }

    if (messageField && !messageField.value.trim()) {
      errors.push('Message is required.');
      messageField.style.borderColor = '#ef4444';
    } else if (messageField) {
      messageField.style.borderColor = '';
    }

    return errors;
  }

  async function submitToWeb3Forms(form, formId, emailSubject, originalBtnText) {
    var statusEl = document.getElementById(formId + '-status');
    var btn = document.getElementById(formId + '-btn') || form.querySelector('button[type="submit"]');

    // Clear previous status
    if (statusEl) clearFormStatus(statusEl);

    // Check cooldown
    if (isCoolingDown(formId)) {
      if (statusEl) showFormStatus(statusEl, 'Please wait before submitting again.', true);
      return;
    }

    // Validate
    var errors = validateRequiredFields(form);
    if (errors.length > 0) {
      if (statusEl) showFormStatus(statusEl, errors.join(' '), true);
      return;
    }

    // Collect form data and sanitize
    var formData = new FormData(form);
    var jsonData = {
      access_key: WEB3FORMS_KEY,
      subject: emailSubject,
      from_name: 'Thalassa US Website'
    };

    formData.forEach(function(value, key) {
      if (key === 'botcheck') {
        jsonData[key] = value;
      } else if (key === 'service_interest') {
        // Handle multiple checkboxes
        if (!jsonData[key]) jsonData[key] = [];
        if (Array.isArray(jsonData[key])) {
          jsonData[key].push(stripHtml(value));
        }
      } else {
        jsonData[key] = stripHtml(value);
      }
    });

    // Convert service_interest array to string
    if (Array.isArray(jsonData.service_interest)) {
      jsonData.service_interest = jsonData.service_interest.join(', ');
    }

    // Submit
    setButtonLoading(btn, true);

    try {
      var response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(jsonData)
      });
      var result = await response.json();

      if (result.success) {
        if (statusEl) showFormStatus(statusEl, 'Message sent successfully. We\'ll get back to you soon!', false);
        setButtonLoading(btn, false, originalBtnText);
        startCooldown(formId, btn, originalBtnText);
        setTimeout(function() {
          form.reset();
          // Clear validation borders
          form.querySelectorAll('input, textarea').forEach(function(el) { el.style.borderColor = ''; });
        }, 2000);
        setTimeout(function() {
          if (statusEl) clearFormStatus(statusEl);
        }, 8000);
      } else {
        if (statusEl) showFormStatus(statusEl, 'Something went wrong. Please try again or email us directly.', true);
        setButtonLoading(btn, false, originalBtnText);
      }
    } catch (err) {
      if (statusEl) showFormStatus(statusEl, 'Network error. Please check your connection and try again.', true);
      setButtonLoading(btn, false, originalBtnText);
    }
  }

  /* ========================================
     CONTACT FORM (Web3Forms)
     ======================================== */

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitToWeb3Forms(contactForm, 'contact-form', 'New Contact Form — thalassa-us.com', 'Send Message');
    });
  }

  /* ========================================
     INTAKE FORM (Web3Forms)
     ======================================== */

  const intakeForm = document.getElementById('intake-form');
  if (intakeForm) {
    intakeForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitToWeb3Forms(intakeForm, 'intake-form', 'New Project Inquiry — thalassa-us.com', 'Submit Inquiry');
    });
  }

  /* ========================================
     VENDOR PORTAL — TAB SWITCHING
     ======================================== */

  const vendorTabs = document.querySelectorAll('.vendor-tab');
  const vendorTabContents = document.querySelectorAll('.vendor-tab-content');

  vendorTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      vendorTabs.forEach(t => t.classList.remove('active'));
      vendorTabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const content = document.getElementById('tab-' + target);
      if (content) content.classList.add('active');
    });
  });

  // Tab switch links (inside forms)
  document.querySelectorAll('[data-switch-tab]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.switchTab;
      vendorTabs.forEach(t => {
        t.classList.toggle('active', t.dataset.tab === target);
      });
      vendorTabContents.forEach(c => c.classList.remove('active'));
      const content = document.getElementById('tab-' + target);
      if (content) content.classList.add('active');
    });
  });

  /* ========================================
     VENDOR SIGN IN / REGISTER (simulated)
     ======================================== */

  const vendorAuth = document.getElementById('vendorAuth');
  const vendorInfoForm = document.getElementById('vendorInfoForm');
  const vendorSigninForm = document.getElementById('vendor-signin-form');
  const vendorRegisterForm = document.getElementById('vendor-register-form');
  const ssoSignin = document.getElementById('sso-signin');
  const ssoRegister = document.getElementById('sso-register');

  function showVendorForm() {
    if (vendorAuth && vendorInfoForm) {
      vendorAuth.style.display = 'none';
      vendorInfoForm.style.display = 'block';
    }
  }

  if (vendorSigninForm) {
    vendorSigninForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showVendorForm();
    });
  }

  if (vendorRegisterForm) {
    vendorRegisterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showVendorForm();
    });
  }

  if (ssoSignin) {
    ssoSignin.addEventListener('click', showVendorForm);
  }
  if (ssoRegister) {
    ssoRegister.addEventListener('click', showVendorForm);
  }

  /* ========================================
     VENDOR INFO FORM (simulated)
     ======================================== */

  const vendorInfoFormEl = document.getElementById('vendor-info-form-el');
  if (vendorInfoFormEl) {
    vendorInfoFormEl.addEventListener('submit', (e) => {
      e.preventDefault();
      simulateFormSubmit(vendorInfoFormEl, 'Submit Vendor Application');
    });
  }

  /* ========================================
     VENDOR FORMS: Demo Mode Simulation
     ======================================== */

  function simulateFormSubmit(form, originalLabel) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    const prevText = btn.textContent;
    btn.textContent = 'Demo Mode — Coming Soon';
    btn.style.background = 'rgba(234,179,8,0.3)';
    btn.style.color = '#eab308';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = originalLabel || prevText;
      btn.style.background = '';
      btn.style.color = '';
      btn.disabled = false;
      form.reset();
    }, 3000);
  }

  /* ========================================
     SMOOTH SCROLL FOR ANCHOR LINKS
     Only intercept pure hash links (#section)
     that target an element on the current page.
     Cross-page links (./page.html#section) navigate normally.
     ======================================== */

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

})();
