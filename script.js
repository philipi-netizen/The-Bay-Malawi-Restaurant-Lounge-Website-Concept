/* =========================================================
   THE BAY — INTERACTION & MOTION SYSTEM
   Works with the existing HTML + CSS
========================================================= */

(() => {
  "use strict";

  /* =======================================================
     01. DOM REFERENCES
  ======================================================== */

  const body = document.body;
  const header = document.querySelector(".site-header");
  const navbar = document.querySelector(".navbar");
  const preloader = document.querySelector("#preloader");

  const menuToggle = document.querySelector(".navbar__toggle");
  const mobileMenu = document.querySelector("#mobile-menu");
  const mobileLinks = mobileMenu
    ? [...mobileMenu.querySelectorAll("a")]
    : [];

  const navLinks = [
    ...document.querySelectorAll("[data-nav-link]")
  ];

  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const mobileQuery = window.matchMedia(
    "(max-width: 980px)"
  );


  /* =======================================================
     02. STATE
  ======================================================== */

  let lastScrollY = window.scrollY;
  let ticking = false;
  let menuOpen = false;
  let menuPreviousFocus = null;

  const prefersReducedMotion = () =>
    reducedMotionQuery.matches;


  /* =======================================================
     03. PRELOADER
  ======================================================== */

  const hidePreloader = () => {
    if (!preloader) return;

    preloader.style.transition =
      prefersReducedMotion()
        ? "none"
        : "opacity 700ms cubic-bezier(0.22, 1, 0.36, 1)";

    preloader.style.opacity = "0";
    preloader.style.visibility = "hidden";
    preloader.style.pointerEvents = "none";

    window.setTimeout(() => {
      if (preloader) {
        preloader.setAttribute("aria-hidden", "true");
      }
    }, prefersReducedMotion() ? 0 : 750);
  };

  window.addEventListener(
    "load",
    () => {
      if (prefersReducedMotion()) {
        hidePreloader();
        return;
      }

      window.setTimeout(hidePreloader, 450);
    },
    { once: true }
  );


  /* =======================================================
     04. SMOOTH ANCHOR SCROLLING
  ======================================================== */

  const getNavOffset = () => {
    if (!header) return 0;

    const headerStyle =
      window.getComputedStyle(header);

    /*
     * The header itself is fixed, while the actual navbar
     * sits inside its padding. Use the visual navbar height
     * plus a small breathing room.
     */
    const headerHeight = navbar
      ? navbar.getBoundingClientRect().height
      : 0;

    const topPadding =
      parseFloat(headerStyle.paddingTop) || 0;

    return headerHeight + topPadding + 12;
  };

  const scrollToTarget = (target) => {
    if (!target) return;

    const targetTop =
      target.getBoundingClientRect().top +
      window.scrollY -
      getNavOffset();

    if (prefersReducedMotion()) {
      window.scrollTo(0, targetTop);
      return;
    }

    window.scrollTo({
      top: targetTop,
      behavior: "smooth"
    });
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest(
      'a[href^="#"]'
    );

    if (!link) return;

    const href = link.getAttribute("href");

    if (!href || href === "#") return;

    const target = document.querySelector(href);

    if (!target) return;

    event.preventDefault();

    closeMobileMenu();

    scrollToTarget(target);
  });


  /* =======================================================
     05. NAVBAR SCROLL STATE
  ======================================================== */

  const updateNavbar = () => {
    if (!header) return;

    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;

    header.classList.toggle(
      "is-scrolled",
      currentY > 35
    );

    /*
     * Don't hide the navigation near the top.
     * Don't react to tiny movements.
     */
    if (currentY <= 80) {
      header.classList.remove("is-hidden");
      lastScrollY = currentY;
      return;
    }

    if (Math.abs(delta) < 6) return;

    if (delta > 0 && !menuOpen) {
      header.classList.add("is-hidden");
    } else if (delta < 0) {
      header.classList.remove("is-hidden");
    }

    lastScrollY = currentY;
  };


  /* =======================================================
     06. REQUESTANIMATIONFRAME SCROLL LOOP
  ======================================================== */

  const requestScrollUpdate = () => {
    if (ticking) return;

    ticking = true;

    window.requestAnimationFrame(() => {
      updateNavbar();

      if (
        !prefersReducedMotion() &&
        !mobileQuery.matches
      ) {
        updateHeroParallax();
      }

      ticking = false;
    });
  };

  window.addEventListener(
    "scroll",
    requestScrollUpdate,
    { passive: true }
  );


  /* =======================================================
     07. HERO PARALLAX
  ======================================================== */

  const hero = document.querySelector(".hero");
  const heroImage = document.querySelector(
    ".hero__media img"
  );

  const updateHeroParallax = () => {
    if (!hero || !heroImage) return;

    if (
      prefersReducedMotion() ||
      mobileQuery.matches
    ) {
      heroImage.style.transform = "scale(1.015)";
      return;
    }

    const rect = hero.getBoundingClientRect();

    /*
     * Stop calculating once the hero has moved well
     * outside the viewport.
     */
    if (
      rect.bottom < 0 ||
      rect.top > window.innerHeight
    ) {
      return;
    }

    const progress =
      Math.max(
        -1,
        Math.min(
          1,
          -rect.top / Math.max(rect.height, 1)
        )
      );

    /*
     * Extremely restrained movement.
     */
    const translateY =
      progress * 18;

    heroImage.style.transform =
      `translate3d(0, ${translateY}px, 0) scale(1.015)`;
  };


  /* =======================================================
     08. MOBILE MENU
  ======================================================== */

  const setMenuState = (open) => {
    if (
      !menuToggle ||
      !mobileMenu
    ) {
      return;
    }

    menuOpen = open;

    menuToggle.setAttribute(
      "aria-expanded",
      String(open)
    );

    menuToggle.setAttribute(
      "aria-label",
      open
        ? "Close navigation menu"
        : "Open navigation menu"
    );

    mobileMenu.setAttribute(
      "aria-hidden",
      String(!open)
    );

    body.classList.toggle(
      "menu-open",
      open
    );

    if (open) {
      header?.classList.remove("is-hidden");

      menuPreviousFocus =
        document.activeElement;

      const firstLink = mobileLinks[0];

      if (firstLink) {
        window.setTimeout(() => {
          firstLink.focus();
        }, prefersReducedMotion() ? 0 : 250);
      }
    } else if (menuPreviousFocus) {
      /*
       * Only return focus if the previous element is
       * still part of the document.
       */
      if (
        document.contains(menuPreviousFocus)
      ) {
        menuPreviousFocus.focus();
      }

      menuPreviousFocus = null;
    }
  };

  const openMobileMenu = () => {
    setMenuState(true);
  };

  const closeMobileMenu = () => {
    setMenuState(false);
  };

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener(
      "click",
      () => {
        if (menuOpen) {
          closeMobileMenu();
        } else {
          openMobileMenu();
        }
      }
    );

    mobileLinks.forEach((link) => {
      link.addEventListener(
        "click",
        closeMobileMenu
      );
    });

    /*
     * Clicking the overlay itself closes the menu.
     */
    mobileMenu.addEventListener(
      "click",
      (event) => {
        if (event.target === mobileMenu) {
          closeMobileMenu();
        }
      }
    );
  }


  /* =======================================================
     09. ESCAPE + ACCESSIBLE MENU FOCUS
  ======================================================== */

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && menuOpen) {
        closeMobileMenu();
        return;
      }

      if (
        event.key !== "Tab" ||
        !menuOpen ||
        !mobileMenu
      ) {
        return;
      }

      const focusable = [
        ...mobileMenu.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ].filter(
        (element) =>
          !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true"
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  );


  /* =======================================================
     10. ACTIVE NAVIGATION
  ======================================================== */

  const sectionMap = new Map();

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");

    if (!href || href === "#") return;

    const section = document.querySelector(href);

    if (section) {
      sectionMap.set(section, link);
    }
  });

  if (
    sectionMap.size &&
    "IntersectionObserver" in window
  ) {
    const activeObserver =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            navLinks.forEach((link) => {
              link.classList.remove("is-active");
            });

            const activeLink =
              sectionMap.get(entry.target);

            activeLink?.classList.add(
              "is-active"
            );
          });
        },
        {
          root: null,
          rootMargin: "-30% 0px -55% 0px",
          threshold: 0
        }
      );

    sectionMap.forEach((_, section) => {
      activeObserver.observe(section);
    });
  }


  /* =======================================================
     11. SECTION REVEALS
  ======================================================== */

  const revealGroups = [
    ".section__eyebrow",
    ".section__header",
    ".intro__content",
    ".bay-world",
    ".tawa__content",
    ".atmosphere__content",
    ".atmosphere__image",
    ".occasions__intro",
    ".occasion",
    ".location",
    ".final-cta .section__container"
  ];

  const revealElements = [
    ...new Set(
      revealGroups.flatMap((selector) =>
        [...document.querySelectorAll(selector)]
      )
    )
  ];

  const prepareReveal = (element, index) => {
    if (!element) return;

    if (prefersReducedMotion()) {
      element.style.opacity = "1";
      element.style.transform = "none";
      return;
    }

    element.style.opacity = "0";
    element.style.transform =
      "translate3d(0, 22px, 0)";
    element.style.transition =
      "opacity 750ms cubic-bezier(0.22, 1, 0.36, 1), transform 750ms cubic-bezier(0.22, 1, 0.36, 1)";
    element.style.transitionDelay =
      `${Math.min(index % 4, 3) * 70}ms`;
  };

  revealElements.forEach(prepareReveal);

  const revealElement = (element) => {
    if (!element) return;

    element.style.opacity = "1";
    element.style.transform =
      "translate3d(0, 0, 0)";

    element.dataset.revealed = "true";
  };

  if (
    !prefersReducedMotion() &&
    "IntersectionObserver" in window
  ) {
    const revealObserver =
      new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            revealElement(entry.target);

            /*
             * One-time reveal.
             */
            observer.unobserve(entry.target);
          });
        },
        {
          root: null,
          rootMargin: "0px 0px -8% 0px",
          threshold: 0.08
        }
      );

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach(revealElement);
  }


  /* =======================================================
     12. POLISHED PRESS FEEDBACK
  ======================================================== */

  const interactiveElements = document.querySelectorAll(
    ".button, .navbar__cta, .mobile-menu__cta, .occasion, .bay-world__link, .floating-whatsapp"
  );

  interactiveElements.forEach((element) => {
    element.addEventListener(
      "pointerdown",
      () => {
        element.classList.add("is-pressed");
      }
    );

    const removePressed = () => {
      element.classList.remove("is-pressed");
    };

    element.addEventListener(
      "pointerup",
      removePressed
    );

    element.addEventListener(
      "pointercancel",
      removePressed
    );

    element.addEventListener(
      "pointerleave",
      removePressed
    );

    element.addEventListener(
      "blur",
      removePressed
    );
  });


  /* =======================================================
     13. RESPONSIVE MOTION RESET
  ======================================================== */

  const handleMotionPreferenceChange = () => {
    if (prefersReducedMotion()) {
      revealElements.forEach((element) => {
        element.style.opacity = "1";
        element.style.transform = "none";
        element.style.transition = "none";
      });

      if (heroImage) {
        heroImage.style.transform =
          "scale(1.015)";
      }
    }
  };

  if (
    typeof reducedMotionQuery.addEventListener ===
    "function"
  ) {
    reducedMotionQuery.addEventListener(
      "change",
      handleMotionPreferenceChange
    );
  }


  /* =======================================================
     14. MOBILE BREAKPOINT CHANGE
  ======================================================== */

  const handleViewportChange = () => {
    if (mobileQuery.matches && heroImage) {
      heroImage.style.transform =
        "scale(1.015)";
    }
  };

  if (
    typeof mobileQuery.addEventListener ===
    "function"
  ) {
    mobileQuery.addEventListener(
      "change",
      handleViewportChange
    );
  }


  /* =======================================================
     15. INITIAL STATE
  ======================================================== */

  if (mobileMenu) {
    mobileMenu.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  if (menuToggle) {
    menuToggle.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  /*
   * Prevent the page from starting in a hidden navbar state.
   */
  header?.classList.remove("is-hidden");

})();

