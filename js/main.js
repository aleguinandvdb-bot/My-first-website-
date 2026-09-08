/* Chateau de Rockville Cafe — interactions: nav drawer, language menu, tilt, motion */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     Header scrolled state
     ---------------------------------------------------------- */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    if (window.scrollY > 8) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ----------------------------------------------------------
     Language dropdown
     ---------------------------------------------------------- */
  var langButton = document.getElementById("langButton");
  var langMenu = document.getElementById("langMenu");

  function closeLangMenu() {
    langMenu.classList.remove("is-open");
    langButton.setAttribute("aria-expanded", "false");
  }
  function toggleLangMenu() {
    var isOpen = langMenu.classList.toggle("is-open");
    langButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  langButton.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleLangMenu();
  });

  langMenu.querySelectorAll(".lang-switch__option").forEach(function (opt) {
    opt.addEventListener("click", function () {
      var lang = opt.getAttribute("data-lang");
      if (window.CRCi18n) window.CRCi18n.apply(lang);
      closeLangMenu();
    });
  });

  document.addEventListener("click", function (e) {
    if (!langMenu.contains(e.target) && e.target !== langButton) closeLangMenu();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLangMenu();
  });

  /* ----------------------------------------------------------
     Nav drawer
     ---------------------------------------------------------- */
  var menuToggle = document.getElementById("menuToggle");
  var navDrawer = document.getElementById("navDrawer");
  var navClose = document.getElementById("navClose");
  var navScrim = document.getElementById("navScrim");
  var navLinks = navDrawer.querySelectorAll("a");
  var lastFocused = null;

  function openDrawer() {
    lastFocused = document.activeElement;
    navDrawer.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    document.documentElement.style.overflow = "hidden";
    navClose.focus();
  }
  function closeDrawer() {
    navDrawer.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.documentElement.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  menuToggle.addEventListener("click", function () {
    var isOpen = navDrawer.classList.contains("is-open");
    if (isOpen) closeDrawer(); else openDrawer();
  });
  navClose.addEventListener("click", closeDrawer);
  navScrim.addEventListener("click", closeDrawer);
  navLinks.forEach(function (link) {
    link.addEventListener("click", closeDrawer);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && navDrawer.classList.contains("is-open")) closeDrawer();
  });

  /* ----------------------------------------------------------
     GSAP entrance + scroll reveals
     ---------------------------------------------------------- */
  if (window.gsap) {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    if (reduceMotion) {
      gsap.set("[data-reveal]", { opacity: 1, y: 0 });
    } else {
      // Every tween declares explicit from/to values (fromTo, never bare .from()) —
      // relying on "current computed style" as the implicit target is what breaks
      // when the element also matches a CSS rule that starts it hidden.
      var heroTimeline = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.9 } });
      heroTimeline
        .fromTo(".hero__eyebrow", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.1)
        .fromTo(".hero__title", { opacity: 0, y: 22 }, { opacity: 1, y: 0 }, 0.2)
        .fromTo(".hero__lede", { opacity: 0, y: 18 }, { opacity: 1, y: 0 }, 0.4)
        .fromTo(".hero__actions", { opacity: 0, y: 14 }, { opacity: 1, y: 0 }, 0.55)
        .fromTo(".hero__visual", { opacity: 0, y: 24, scale: 0.98 }, { opacity: 1, y: 0, scale: 1 }, 0.3);

      var revealGroups = document.querySelectorAll("[data-reveal]");
      revealGroups.forEach(function (el) {
        if (el.closest(".hero")) return;
        gsap.fromTo(
          el,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true
            }
          }
        );
      });
    }
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
  }
})();
