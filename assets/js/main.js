/**
 * DIVINE MANDATE BIBLE INSTITUTE (DIMABIN)
 * Global Javascript Actions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Sticky navigation scrolling effect
  const header = document.querySelector('header');
  
  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll);
  // Run once on load in case page is already scrolled
  handleScroll();

  // Mobile menu functionality
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

  if (mobileToggle && mobileMenu && mobileMenuOverlay) {
    const toggleMenu = () => {
      mobileToggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      mobileMenuOverlay.classList.toggle('active');
      
      // Prevent body scrolling when menu is active
      if (mobileMenu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    mobileToggle.addEventListener('click', toggleMenu);
    mobileMenuOverlay.addEventListener('click', toggleMenu);

    // Close menu when a link is clicked (excluding dropdown toggles)
    const mobileLinks = mobileMenu.querySelectorAll('.nav-link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        if (link.classList.contains('mobile-dropdown-toggle')) {
          return;
        }
        mobileToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // Mobile Dropdown Toggle
  const mobileDropdownToggle = document.querySelector('.mobile-dropdown-toggle');
  const mobileSubmenu = document.querySelector('.mobile-submenu');
  if (mobileDropdownToggle && mobileSubmenu) {
    mobileDropdownToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const isHidden = window.getComputedStyle(mobileSubmenu).display === 'none';
      mobileSubmenu.style.display = isHidden ? 'flex' : 'none';
      const icon = mobileDropdownToggle.querySelector('i');
      if (icon) {
        if (isHidden) {
          icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        } else {
          icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        }
      }
    });
  }

  // Handle coming soon links in the entire navigation
  const comingSoonLinks = document.querySelectorAll('.coming-soon');
  comingSoonLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // Remove any badges or icons from the text to get a clean name
      let cleanText = link.innerHTML;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = cleanText;
      let textContent = tempDiv.textContent || tempDiv.innerText || "";
      textContent = textContent.replace('Soon', '').trim();
      
      showToast(`${textContent} is coming soon!`);
    });
  });

  // Custom Elegant Toast Notification
  function showToast(message) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.innerHTML = `<i class="fa-solid fa-bell" style="color: var(--accent);"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Remove toast after 3.5s
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3500);
  }
});

// DIMABIN Custom Modal Styles Injection
const injectDimabinModalStyles = () => {
  const styleId = "dimabin-dialog-styles";
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.innerHTML = `
    .dimabin-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(10, 25, 47, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      box-sizing: border-box;
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }
    .dimabin-modal-overlay.active {
      opacity: 1;
    }
    .dimabin-modal-box {
      background: #ffffff;
      width: 100%;
      max-width: 500px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      border: 3px solid #d69e2e;
      overflow: hidden;
      transform: scale(0.9);
      transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.15);
    }
    .dimabin-modal-overlay.active .dimabin-modal-box {
      transform: scale(1);
    }
    .dimabin-modal-header {
      background: #1a365d;
      color: #ffffff;
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-family: var(--font-display, "Playfair Display", serif);
      font-weight: 700;
      font-size: 1.15rem;
      border-bottom: 3px solid #d69e2e;
    }
    .dimabin-modal-header i {
      font-size: 1.3rem;
      color: #d69e2e;
    }
    .dimabin-modal-body {
      padding: 1.75rem;
      color: #2d3748;
      font-size: 1.05rem;
      line-height: 1.6;
    }
    .dimabin-modal-input-wrapper {
      margin-top: 1.25rem;
    }
    .dimabin-modal-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #cbd5e1;
      border-radius: 6px;
      font-size: 1rem;
      box-sizing: border-box;
      outline: none;
      transition: all 0.2s;
    }
    .dimabin-modal-input:focus {
      border-color: #1a365d;
      box-shadow: 0 0 0 3px rgba(26, 54, 93, 0.2);
    }
    .dimabin-modal-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      border-top: 1.5px solid #e2e8f0;
    }
    .dimabin-btn {
      padding: 0.65rem 1.5rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      min-height: 48px;
      min-width: 90px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .dimabin-btn-primary {
      background: #1a365d;
      color: #ffffff;
    }
    .dimabin-btn-primary:hover {
      background: #112544;
      transform: translateY(-1px);
    }
    .dimabin-btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }
    .dimabin-btn-secondary:hover {
      background: #cbd5e1;
      transform: translateY(-1px);
    }
    .dimabin-btn-danger {
      background: #dc2626;
      color: #ffffff;
    }
    .dimabin-btn-danger:hover {
      background: #b91c1c;
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(style);
};

// Global Custom dialog modal implementations
window.dimabinAlert = (message, type = "info", title = "DIMABIN Portal Notice") => {
  injectDimabinModalStyles();
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "dimabin-modal-overlay";
    
    let iconClass = "fa-circle-info";
    let iconColor = "#1a365d";
    let btnClass = "dimabin-btn-primary";
    
    if (type === "success" || message.toLowerCase().includes("success") || message.toLowerCase().includes("completed")) {
      iconClass = "fa-circle-check";
      iconColor = "#15803d";
      type = "success";
    } else if (type === "warning" || message.toLowerCase().includes("warning") || message.toLowerCase().includes("deficit") || message.toLowerCase().includes("violation") || message.toLowerCase().includes("prevented")) {
      iconClass = "fa-triangle-exclamation";
      iconColor = "#b45309";
      type = "warning";
    } else if (type === "error" || message.toLowerCase().includes("failed") || message.toLowerCase().includes("error")) {
      iconClass = "fa-circle-xmark";
      iconColor = "#b91c1c";
      btnClass = "dimabin-btn-danger";
      type = "error";
    }

    overlay.innerHTML = `
      <div class="dimabin-modal-box">
        <div class="dimabin-modal-header">
          <i class="fa-solid ${iconClass}"></i>
          <span>${title}</span>
        </div>
        <div class="dimabin-modal-body">
          <div style="display: flex; gap: 1.25rem; align-items: flex-start;">
            <i class="fa-solid ${iconClass}" style="font-size: 1.85rem; color: ${iconColor}; margin-top: 0.15rem; flex-shrink: 0;"></i>
            <div style="white-space: pre-line; word-break: break-word;">${message}</div>
          </div>
        </div>
        <div class="dimabin-modal-footer">
          <button class="dimabin-btn ${btnClass}" id="dimabin-alert-ok-btn">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    
    // Trigger animation
    setTimeout(() => overlay.classList.add("active"), 10);
    
    const cleanup = () => {
      overlay.classList.remove("active");
      setTimeout(() => overlay.remove(), 250);
    };

    const okBtn = overlay.querySelector("#dimabin-alert-ok-btn");
    okBtn.addEventListener("click", () => {
      cleanup();
      resolve(true);
    });
    
    const handleKeydown = (e) => {
      if (e.key === "Enter" || e.key === "Escape") {
        cleanup();
        window.removeEventListener("keydown", handleKeydown);
        resolve(true);
      }
    };
    window.addEventListener("keydown", handleKeydown);
  });
};

window.dimabinConfirm = (message, title = "Please Confirm") => {
  injectDimabinModalStyles();
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "dimabin-modal-overlay";
    
    let iconClass = "fa-circle-question";
    let iconColor = "#1a365d";
    let okBtnClass = "dimabin-btn-primary";
    
    const isDangerous = message.toLowerCase().includes("danger") || 
                        message.toLowerCase().includes("delete") || 
                        message.toLowerCase().includes("purge") || 
                        message.toLowerCase().includes("permanent") ||
                        message.toLowerCase().includes("decline") ||
                        message.toLowerCase().includes("reject");
                        
    if (isDangerous) {
      iconClass = "fa-triangle-exclamation";
      iconColor = "#dc2626";
      okBtnClass = "dimabin-btn-danger";
    }

    overlay.innerHTML = `
      <div class="dimabin-modal-box">
        <div class="dimabin-modal-header">
          <i class="fa-solid ${iconClass}"></i>
          <span>${title}</span>
        </div>
        <div class="dimabin-modal-body">
          <div style="display: flex; gap: 1.25rem; align-items: flex-start;">
            <i class="fa-solid ${iconClass}" style="font-size: 1.85rem; color: ${iconColor}; margin-top: 0.15rem; flex-shrink: 0;"></i>
            <div style="white-space: pre-line; word-break: break-word;">${message}</div>
          </div>
        </div>
        <div class="dimabin-modal-footer">
          <button class="dimabin-btn dimabin-btn-secondary" id="dimabin-confirm-cancel-btn">Cancel</button>
          <button class="dimabin-btn ${okBtnClass}" id="dimabin-confirm-ok-btn">Confirm</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    
    setTimeout(() => overlay.classList.add("active"), 10);
    
    const cleanup = () => {
      overlay.classList.remove("active");
      setTimeout(() => overlay.remove(), 250);
    };

    const okBtn = overlay.querySelector("#dimabin-confirm-ok-btn");
    const cancelBtn = overlay.querySelector("#dimabin-confirm-cancel-btn");
    
    okBtn.addEventListener("click", () => {
      cleanup();
      resolve(true);
    });
    
    cancelBtn.addEventListener("click", () => {
      cleanup();
      resolve(false);
    });
    
    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        cleanup();
        window.removeEventListener("keydown", handleKeydown);
        resolve(false);
      }
    };
    window.addEventListener("keydown", handleKeydown);
  });
};

window.dimabinPrompt = (message, defaultValue = "", title = "Input Required") => {
  injectDimabinModalStyles();
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "dimabin-modal-overlay";

    overlay.innerHTML = `
      <div class="dimabin-modal-box">
        <div class="dimabin-modal-header">
          <i class="fa-solid fa-pen-to-square"></i>
          <span>${title}</span>
        </div>
        <div class="dimabin-modal-body">
          <div style="margin-bottom: 0.75rem; font-weight: 500; word-break: break-word;">${message}</div>
          <div class="dimabin-modal-input-wrapper">
            <input type="text" class="dimabin-modal-input" id="dimabin-prompt-input" value="${defaultValue}" autocomplete="off">
          </div>
        </div>
        <div class="dimabin-modal-footer">
          <button class="dimabin-btn dimabin-btn-secondary" id="dimabin-prompt-cancel-btn">Cancel</button>
          <button class="dimabin-btn dimabin-btn-primary" id="dimabin-prompt-ok-btn">Submit</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    
    const inputEl = overlay.querySelector("#dimabin-prompt-input");
    setTimeout(() => {
      overlay.classList.add("active");
      inputEl.focus();
      inputEl.select();
    }, 10);
    
    const cleanup = () => {
      overlay.classList.remove("active");
      setTimeout(() => overlay.remove(), 250);
    };

    const okBtn = overlay.querySelector("#dimabin-prompt-ok-btn");
    const cancelBtn = overlay.querySelector("#dimabin-prompt-cancel-btn");
    
    okBtn.addEventListener("click", () => {
      const val = inputEl.value;
      cleanup();
      resolve(val);
    });
    
    cancelBtn.addEventListener("click", () => {
      cleanup();
      resolve(null);
    });

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const val = inputEl.value;
        cleanup();
        resolve(val);
      } else if (e.key === "Escape") {
        cleanup();
        resolve(null);
      }
    });
  });
};

