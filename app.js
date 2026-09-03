/**
 * Tideline - Application Controller & Micro-Interactions
 * Orchestrates themes, auth states, tidal password meter, audio, and live dashboard.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Waves Canvas
  const waves = new WaveEngine('wc');

  // 2. Initialize Procedural Audio
  const audio = new TidalAudio();

  // Audio UI elements
  const btnSound = document.getElementById('btn-sound');
  const volumePopover = document.getElementById('volume-popover');
  const volumeSlider = document.getElementById('volume-slider');

  if (btnSound) {
    btnSound.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.toggle();
    });

    // Right-click or double-click to toggle volume slider popover
    btnSound.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      volumePopover.classList.toggle('open');
    });

    audio.onStateChange = (playing) => {
      if (playing) {
        btnSound.classList.add('playing');
        btnSound.classList.add('active');
        showToast('Ocean surf soundscape enabled');
      } else {
        btnSound.classList.remove('playing');
        btnSound.classList.remove('active');
        showToast('Sound muted');
      }
    };
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      audio.setVolume(parseFloat(e.target.value));
    });
  }

  document.addEventListener('click', (e) => {
    if (volumePopover && !volumePopover.contains(e.target) && e.target !== btnSound) {
      volumePopover.classList.remove('open');
    }
  });

  // 2.5 Glossy Vertical Left Dock 3-Dot Toggle
  const dockToggleBtn = document.getElementById('dock-toggle-btn');
  const glossyDock = document.getElementById('glossy-dock');
  if (dockToggleBtn && glossyDock) {
    dockToggleBtn.addEventListener('click', () => {
      glossyDock.classList.toggle('collapsed');
      const isCollapsed = glossyDock.classList.contains('collapsed');
      showToast(isCollapsed ? 'Atmosphere dock collapsed' : 'Atmosphere dock expanded');
    });
  }

  // 3. Dynamic Themes (Azure, Sunset, Bioluminescent, Dawn)
  const themeButtons = document.querySelectorAll('.theme-btn');
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      document.documentElement.setAttribute('data-theme', theme);
      
      themeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      waves.setTheme(theme);
      showToast(`Atmosphere switched to ${theme.charAt(0).toUpperCase() + theme.slice(1)}`);
    });
  });

  // 4. Auth View Navigation (Sign In, Sign Up, Forgot Password)
  const navTabs = document.querySelectorAll('.nav-tab');
  const authViews = document.querySelectorAll('.auth-view');
  const navContainer = document.getElementById('auth-nav');

  function switchView(viewName) {
    authViews.forEach(v => {
      v.classList.remove('active');
      if (v.id === `view-${viewName}`) {
        v.classList.add('active');
      }
    });

    navTabs.forEach(t => {
      if (t.dataset.tab === viewName) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    if (viewName === 'forgot') {
      if (navContainer) navContainer.style.display = 'none';
    } else {
      if (navContainer) navContainer.style.display = 'flex';
    }
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchView(tab.dataset.tab);
    });
  });

  // Link triggers
  document.querySelectorAll('[data-switch-view]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(link.dataset.switchView);
    });
  });

  // 5. Tidal Password Strength Meter (Sign Up)
  const signupPwd = document.getElementById('signup-password');
  const gaugeFill = document.getElementById('gauge-fill');
  const gaugeLevelText = document.getElementById('gauge-level-text');
  
  const critLength = document.getElementById('crit-len');
  const critNum = document.getElementById('crit-num');
  const critUpper = document.getElementById('crit-upper');
  const critSpecial = document.getElementById('crit-spec');

  if (signupPwd) {
    signupPwd.addEventListener('input', () => {
      const val = signupPwd.value;
      
      const hasLength = val.length >= 8;
      const hasNum = /\d/.test(val);
      const hasUpper = /[A-Z]/.test(val) && /[a-z]/.test(val);
      const hasSpecial = /[^A-Za-z0-9]/.test(val);

      if (critLength) critLength.classList.toggle('met', hasLength);
      if (critNum) critNum.classList.toggle('met', hasNum);
      if (critUpper) critUpper.classList.toggle('met', hasUpper);
      if (critSpecial) critSpecial.classList.toggle('met', hasSpecial);

      const score = [hasLength, hasNum, hasUpper, hasSpecial].filter(Boolean).length;

      gaugeFill.className = 'gauge-fill';

      if (val.length === 0) {
        gaugeLevelText.textContent = 'Calm (Empty)';
        gaugeLevelText.style.color = 'var(--text-muted)';
      } else if (score === 1) {
        gaugeFill.classList.add('level-1');
        gaugeLevelText.textContent = 'Low Tide (Weak)';
        gaugeLevelText.style.color = '#f87171';
      } else if (score === 2) {
        gaugeFill.classList.add('level-2');
        gaugeLevelText.textContent = 'Mid Tide (Fair)';
        gaugeLevelText.style.color = '#fbbf24';
      } else if (score === 3) {
        gaugeFill.classList.add('level-3');
        gaugeLevelText.textContent = 'High Tide (Strong)';
        gaugeLevelText.style.color = '#60a5fa';
      } else if (score === 4) {
        gaugeFill.classList.add('level-4');
        gaugeLevelText.textContent = 'King Tide (Unbreakable)';
        gaugeLevelText.style.color = '#34d399';
      }
    });
  }

  // 6. Show / Hide Password Toggles
  document.querySelectorAll('.toggle-pwd-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
      } else {
        input.type = 'password';
        btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;
      }
    });
  });

  // 7. Water Ripple Click Effect on Buttons
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const circle = document.createElement('span');
      circle.classList.add('ripple-wave');
      
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      circle.style.width = circle.style.height = `${size}px`;
      circle.style.left = `${e.clientX - rect.left - size / 2}px`;
      circle.style.top = `${e.clientY - rect.top - size / 2}px`;
      
      this.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  });

  // 8. Demo Instant Login & Tidal Live Dashboard Transition
  const demoBtn = document.getElementById('btn-quick-demo');
  const signinForm = document.getElementById('form-signin');
  const dashboardOverlay = document.getElementById('dashboard-overlay');
  const btnSignout = document.getElementById('btn-signout');

  function enterDashboard(name = 'Captain Morgan') {
    // Add celebratory water ripple to canvas
    waves.addRipple(waves.width / 2, waves.height * 0.5, 45);
    waves.addRipple(waves.width * 0.35, waves.height * 0.6, 30);
    waves.addRipple(waves.width * 0.65, waves.height * 0.6, 30);

    // Update avatar and welcome text
    document.getElementById('dash-user-name').textContent = name;
    document.getElementById('dash-user-initial').textContent = name.charAt(0).toUpperCase();

    // Show dashboard
    dashboardOverlay.classList.add('active');
    showToast(`Welcome aboard, ${name}! Tide data refreshed.`);
  }

  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      enterDashboard('Alex Rivers');
    });
  }

  if (signinForm) {
    signinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('signin-email');
      const nameFromEmail = emailInput.value ? emailInput.value.split('@')[0] : 'Captain';
      enterDashboard(nameFromEmail);
    });
  }

  const signupForm = document.getElementById('form-signup');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('signup-name');
      enterDashboard(nameInput.value || 'New Sailor');
    });
  }

  const forgotForm = document.getElementById('form-forgot');
  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Recovery tide bottled & dispatched to your inbox!');
      setTimeout(() => switchView('signin'), 1200);
    });
  }

  if (btnSignout) {
    btnSignout.addEventListener('click', () => {
      dashboardOverlay.classList.remove('active');
      showToast('Signed out. Safe harbor await your return.');
    });
  }

  // 9. Toast Notification Helper
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.querySelector('.toast-text').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // 10. Subtle Interactive Brand Mark 3D tilt tracking
  const card = document.querySelector('.card');
  const brandMark = document.querySelector('.brand-mark');
  if (card && brandMark) {
    document.querySelectorAll('input').forEach(input => {
      input.addEventListener('focus', () => {
        brandMark.style.transform = 'scale(1.1) rotate(-8deg)';
      });
      input.addEventListener('blur', () => {
        brandMark.style.transform = 'none';
      });
    });
  }

  // 11. Social login hints
  document.querySelectorAll('.btn-social, .btn-google').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.textContent.trim() || 'Google';
      showToast(`Connecting with ${provider}...`);
      setTimeout(() => enterDashboard(`${provider} Explorer`), 800);
    });
  });
});
