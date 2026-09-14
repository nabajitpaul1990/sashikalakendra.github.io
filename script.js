(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------------------------------------------------------------------
     1. Theme Toggle (Light / Dark) with LocalStorage & OS Preference
     --------------------------------------------------------------------- */
  var themeToggle = document.getElementById("themeToggle");
  var storedTheme = localStorage.getItem("nf-theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var initialTheme = storedTheme || (prefersDark ? "dark" : "light");
  applyTheme(initialTheme);

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      var label = themeToggle.querySelector(".theme-toggle__label");
      if (label) label.textContent = theme === "dark" ? "Light" : "Dark";
    }
    localStorage.setItem("nf-theme", theme);
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  /* ---------------------------------------------------------------------
     2. Font Scale (A- / A / A+) with LocalStorage
     --------------------------------------------------------------------- */
  var fontButtons = document.querySelectorAll(".font-btn");
  var storedScale = localStorage.getItem("nf-font-scale") || "md";
  applyScale(storedScale);

  function applyScale(scale) {
    root.setAttribute("data-font-scale", scale);
    fontButtons.forEach(function (btn) {
      var isActive = btn.getAttribute("data-scale") === scale;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    localStorage.setItem("nf-font-scale", scale);
  }

  fontButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyScale(btn.getAttribute("data-scale"));
    });
  });

  /* ---------------------------------------------------------------------
     3. Header Elevation on Scroll
     --------------------------------------------------------------------- */
  var header = document.getElementById("siteHeader");
  var backToTopBtn = document.getElementById("backToTop");

  function onScroll() {
    var scrolled = window.scrollY > 20;
    if (header) {
      header.classList.toggle("is-scrolled", scrolled);
    }
    if (backToTopBtn) {
      backToTopBtn.hidden = window.scrollY < 380;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------------------------------------------------------------
     4. Mobile Navigation Drawer & Scrim (Breadcrumb Menu Button)
     --------------------------------------------------------------------- */
  var navToggle = document.getElementById("navToggle");
  var primaryNav = document.getElementById("primaryNav");
  var navScrim = document.getElementById("navScrim");
  var drawerCloseBtn = document.getElementById("drawerCloseBtn");

  function closeNav() {
    if (!primaryNav) return;
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.classList.remove("is-active");
    }
    primaryNav.classList.remove("is-open");
    if (navScrim) navScrim.classList.remove("is-visible");
    document.body.style.overflow = "";
  }

  function openNav() {
    if (!primaryNav) return;
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.classList.add("is-active");
    }
    primaryNav.classList.add("is-open");
    if (navScrim) navScrim.classList.add("is-visible");
    document.body.style.overflow = "hidden";
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      isOpen ? closeNav() : openNav();
    });
  }

  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener("click", closeNav);
  }

  if (navScrim) {
    navScrim.addEventListener("click", closeNav);
  }

  // Keyboard accessibility: ESC key closes mobile nav drawer
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && primaryNav && primaryNav.classList.contains("is-open")) {
      closeNav();
    }
  });

  if (primaryNav) {
    primaryNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (!link.classList.contains("submenu-toggle")) {
          closeNav();
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     5. Submenus (Dropdown on Desktop, Accordion on Mobile)
     --------------------------------------------------------------------- */
  var submenuParents = Array.prototype.slice.call(document.querySelectorAll(".has-submenu"));

  function closeAllSubmenus(except) {
    submenuParents.forEach(function (li) {
      if (li === except) return;
      li.classList.remove("is-open");
      var toggle = li.querySelector(".submenu-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  }

  submenuParents.forEach(function (li) {
    var toggle = li.querySelector(".submenu-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = li.classList.contains("is-open");
      closeAllSubmenus(li);
      li.classList.toggle("is-open", !isOpen);
      toggle.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  document.addEventListener("click", function (e) {
    var insideSubmenu = e.target.closest && e.target.closest(".has-submenu");
    if (!insideSubmenu) closeAllSubmenus();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeAllSubmenus();
      closeNav();
      closeModal();
    }
  });

  /* ---------------------------------------------------------------------
     6. Hero Carousel with Progress Bar & Ambient Autoplay
     --------------------------------------------------------------------- */
  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero__slide"));
  var dotsWrap = document.getElementById("heroDots");
  var prevBtn = document.getElementById("heroPrev");
  var nextBtn = document.getElementById("heroNext");
  var heroSection = document.querySelector(".hero");
  var progressBar = document.getElementById("heroProgressBar");

  var currentSlide = 0;
  var AUTOPLAY_MS = 6000;
  var timer = null;
  var progressInterval = null;
  var progressStartTime = 0;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (slides.length > 0 && dotsWrap) {
    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "hero__dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Go to slide " + (i + 1));
      dot.addEventListener("click", function () {
        goToSlide(i);
        restartAutoplay();
      });
      dotsWrap.appendChild(dot);
    });

    var dots = Array.prototype.slice.call(dotsWrap.children);

    function goToSlide(index) {
      slides[currentSlide].classList.remove("is-active");
      if (dots[currentSlide]) dots[currentSlide].classList.remove("is-active");
      
      currentSlide = (index + slides.length) % slides.length;
      
      slides[currentSlide].classList.add("is-active");
      if (dots[currentSlide]) dots[currentSlide].classList.add("is-active");
      resetProgress();
    }

    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }

    function resetProgress() {
      if (progressBar) progressBar.style.width = "0%";
      progressStartTime = Date.now();
    }

    function updateProgress() {
      if (!progressBar || reduceMotion) return;
      var elapsed = Date.now() - progressStartTime;
      var pct = Math.min(100, (elapsed / AUTOPLAY_MS) * 100);
      progressBar.style.width = pct + "%";
    }

    function startAutoplay() {
      if (reduceMotion) return;
      stopAutoplay();
      resetProgress();
      progressInterval = setInterval(updateProgress, 50);
      timer = setInterval(function () {
        nextSlide();
      }, AUTOPLAY_MS);
    }

    function stopAutoplay() {
      if (timer) clearInterval(timer);
      if (progressInterval) clearInterval(progressInterval);
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    if (nextBtn) nextBtn.addEventListener("click", function () { nextSlide(); restartAutoplay(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prevSlide(); restartAutoplay(); });

    if (heroSection) {
      heroSection.addEventListener("mouseenter", stopAutoplay);
      heroSection.addEventListener("mouseleave", startAutoplay);
      heroSection.addEventListener("focusin", stopAutoplay);
      heroSection.addEventListener("focusout", startAutoplay);

      // Touch swipe gestures
      var touchStartX = null;
      heroSection.addEventListener("touchstart", function (e) {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      heroSection.addEventListener("touchend", function (e) {
        if (touchStartX === null) return;
        var delta = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 45) {
          delta < 0 ? nextSlide() : prevSlide();
          restartAutoplay();
        }
        touchStartX = null;
      }, { passive: true });
    }

    startAutoplay();
  }

  /* ---------------------------------------------------------------------
     7. Campus Life Gallery Filtering
     --------------------------------------------------------------------- */
  var galleryFilters = document.querySelectorAll(".gallery-filter");
  var galleryCards = document.querySelectorAll(".gallery-card");

  galleryFilters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.getAttribute("data-filter");
      galleryFilters.forEach(function (f) { f.classList.remove("is-active"); });
      btn.classList.add("is-active");

      galleryCards.forEach(function (card) {
        var category = card.getAttribute("data-category");
        if (filter === "all" || category === filter) {
          card.style.display = "";
          card.style.opacity = "1";
        } else {
          card.style.display = "none";
          card.style.opacity = "0";
        }
      });
    });
  });

  /* ---------------------------------------------------------------------
     8. Updates Tabs & Seamless Vertical Marquee
     --------------------------------------------------------------------- */
  var tabButtons = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));
  var tabsList = document.querySelector(".tabs__list");
  var indicator = document.getElementById("tabsIndicator");

  function moveIndicator(tabBtn) {
    if (!indicator || !tabsList || !tabBtn) return;
    var listRect = tabsList.getBoundingClientRect();
    var btnRect = tabBtn.getBoundingClientRect();
    indicator.style.width = btnRect.width + "px";
    indicator.style.transform = "translateX(" + (btnRect.left - listRect.left) + "px)";
  }

  function activateTab(tabBtn) {
    tabButtons.forEach(function (btn) {
      var selected = btn === tabBtn;
      btn.classList.toggle("is-active", selected);
      btn.setAttribute("aria-selected", selected ? "true" : "false");
      btn.tabIndex = selected ? 0 : -1;
    });

    panels.forEach(function (panel) {
      var match = panel.id === tabBtn.getAttribute("aria-controls");
      panel.classList.toggle("is-active", match);
      panel.hidden = !match;
      if (match) restartMarquee(panel);
    });

    moveIndicator(tabBtn);
    if (typeof filterNoticeItems === "function") filterNoticeItems();
  }

  function restartMarquee(panel) {
    var track = panel.querySelector(".marquee__track");
    if (!track) return;
    track.style.animation = "none";
    void track.offsetHeight; // Force reflow
    track.style.animation = "";
  }

  tabButtons.forEach(function (btn, i) {
    btn.addEventListener("click", function () { activateTab(btn); });
    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        var nextIdx = e.key === "ArrowRight"
          ? (i + 1) % tabButtons.length
          : (i - 1 + tabButtons.length) % tabButtons.length;
        tabButtons[nextIdx].focus();
        activateTab(tabButtons[nextIdx]);
      }
    });
  });

  var initialTab = document.querySelector('.tab[aria-selected="true"]');
  if (initialTab) {
    requestAnimationFrame(function () { moveIndicator(initialTab); });
  }
  window.addEventListener("resize", function () {
    var activeTab = document.querySelector('.tab[aria-selected="true"]');
    if (activeTab) moveIndicator(activeTab);
  });

  /* Duplicate each marquee list once for a seamless infinite loop */
  document.querySelectorAll(".marquee__track").forEach(function (track) {
    var original = track.innerHTML;
    track.innerHTML = original + original;
  });

  /* Toggle ticker play/pause button */
  var toggleTickerBtn = document.getElementById("toggleTickerBtn");
  var isTickerPaused = false;

  if (toggleTickerBtn) {
    var pauseIcon = toggleTickerBtn.querySelector(".icon-pause");
    var playIcon = toggleTickerBtn.querySelector(".icon-play");

    toggleTickerBtn.addEventListener("click", function () {
      isTickerPaused = !isTickerPaused;
      document.querySelectorAll(".marquee__track").forEach(function (track) {
        track.style.animationPlayState = isTickerPaused ? "paused" : "running";
      });
      if (pauseIcon && playIcon) {
        pauseIcon.hidden = isTickerPaused;
        playIcon.hidden = !isTickerPaused;
      }
      toggleTickerBtn.setAttribute("aria-label", isTickerPaused ? "Resume animation" : "Pause animation");
    });
  }

  /* Live Notice Search Filter */
  var noticeSearch = document.getElementById("noticeSearch");
  var noticeClear = document.getElementById("noticeClear");

  function filterNoticeItems() {
    if (!noticeSearch) return;
    var query = noticeSearch.value.trim().toLowerCase();
    if (noticeClear) noticeClear.hidden = query.length === 0;

    var activePanel = document.querySelector(".panel.is-active");
    if (!activePanel) return;

    var track = activePanel.querySelector(".marquee__track");
    var items = activePanel.querySelectorAll(".marquee__track li");
    var matchCount = 0;

    items.forEach(function (item) {
      var text = item.textContent.toLowerCase();
      var matches = query === "" || text.indexOf(query) !== -1;
      item.style.display = matches ? "" : "none";
      if (matches) matchCount++;
    });

    // If searching, pause the scrolling animation so results are easy to read
    if (track) {
      if (query.length > 0) {
        track.style.animationPlayState = "paused";
      } else if (!isTickerPaused) {
        track.style.animationPlayState = "running";
      }
    }

    // Auto-switch to a tab that has matching results if 0 matches in current tab
    if (query.length > 1 && matchCount === 0) {
      panels.forEach(function (panel, idx) {
        if (matchCount > 0) return;
        var pItems = panel.querySelectorAll(".marquee__track li");
        var hasMatch = Array.prototype.some.call(pItems, function (it) {
          return it.textContent.toLowerCase().indexOf(query) !== -1;
        });
        if (hasMatch && tabButtons[idx]) {
          activateTab(tabButtons[idx]);
        }
      });
    }
  }

  if (noticeSearch) {
    noticeSearch.addEventListener("input", filterNoticeItems);

    if (noticeClear) {
      noticeClear.addEventListener("click", function () {
        noticeSearch.value = "";
        noticeClear.hidden = true;
        filterNoticeItems();
        noticeSearch.focus();
      });
    }
  }

  /* ---------------------------------------------------------------------
     9. Interactive Modal: Book a Campus Tour
     --------------------------------------------------------------------- */
  var modal = document.getElementById("tourModal");
  var modalScrim = document.getElementById("modalScrim");
  var modalCloseBtn = document.getElementById("modalCloseBtn");
  var modalCancelBtn = document.getElementById("modalCancelBtn");
  var tourForm = document.getElementById("tourForm");
  var openTourButtons = document.querySelectorAll(".open-tour-btn");

  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    var firstInput = modal.querySelector("input");
    if (firstInput) setTimeout(function () { firstInput.focus(); }, 50);
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  openTourButtons.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openModal();
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeModal);
  if (modalScrim) modalScrim.addEventListener("click", closeModal);

  if (tourForm) {
    tourForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var parentName = document.getElementById("parentName").value;
      var tourDate = document.getElementById("tourDate").value;
      alert("Thank you, " + parentName + "! Your campus tour request for " + tourDate + " has been successfully received. Our admissions desk will contact you shortly with your confirmation pass.");
      tourForm.reset();
      closeModal();
    });
  }

  /* ---------------------------------------------------------------------
     10. Contact Page: Copy Postal Address & Inquiry Form
     --------------------------------------------------------------------- */
  var copyAddressBtn = document.getElementById("copyAddressBtn");
  var copyAddressLabel = document.getElementById("copyAddressLabel");
  var campusPostalAddress = document.getElementById("campusPostalAddress");

  if (copyAddressBtn && campusPostalAddress) {
    copyAddressBtn.addEventListener("click", function () {
      var textToCopy = campusPostalAddress.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(showCopiedState);
      } else {
        var tempInput = document.createElement("textarea");
        tempInput.value = textToCopy;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        showCopiedState();
      }
    });

    function showCopiedState() {
      if (copyAddressLabel) {
        var original = copyAddressLabel.textContent;
        copyAddressLabel.textContent = "Copied to Clipboard!";
        copyAddressBtn.style.borderColor = "var(--color-gold)";
        setTimeout(function () {
          copyAddressLabel.textContent = original;
          copyAddressBtn.style.borderColor = "";
        }, 2200);
      }
    }
  }

  var contactInquiryForm = document.getElementById("contactInquiryForm");
  if (contactInquiryForm) {
    contactInquiryForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("contactSenderName").value;
      var deptSelect = document.getElementById("contactDeptSelect");
      var deptName = deptSelect.options[deptSelect.selectedIndex].text;
      alert("Thank you, " + name + "! Your official inquiry directed to [" + deptName + "] has been dispatched to the administration desk. You will receive an official response via email within 24–48 hours.");
      contactInquiryForm.reset();
    });
  }

  /* ---------------------------------------------------------------------
     11. Who's Who Directory: Category Filters & Real-time Search
     --------------------------------------------------------------------- */
  var whosFilterBtns = document.querySelectorAll(".whos-filter-btn");
  var whosSearch = document.getElementById("whosSearch");
  var whosClearSearch = document.getElementById("whosClearSearch");
  var resetWhosFiltersBtn = document.getElementById("resetWhosFiltersBtn");
  var leaderCards = document.querySelectorAll(".leader-card");
  var whosNoResults = document.getElementById("whosNoResults");

  if (leaderCards.length > 0) {
    var activeCategory = "all";

    function filterDirectory() {
      var query = (whosSearch ? whosSearch.value : "").trim().toLowerCase();
      var visibleCount = 0;

      if (whosClearSearch) {
        whosClearSearch.hidden = query.length === 0;
      }

      leaderCards.forEach(function (card) {
        var category = card.getAttribute("data-category") || "";
        var cardText = (card.textContent || "").toLowerCase();

        var matchesCategory = activeCategory === "all" || category === activeCategory;
        var matchesQuery = !query || cardText.indexOf(query) !== -1;

        if (matchesCategory && matchesQuery) {
          card.style.display = "";
          visibleCount++;
        } else {
          card.style.display = "none";
        }
      });

      if (whosNoResults) {
        whosNoResults.style.display = visibleCount === 0 ? "block" : "none";
      }
    }

    whosFilterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        whosFilterBtns.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        activeCategory = btn.getAttribute("data-filter") || "all";
        filterDirectory();
      });
    });

    if (whosSearch) {
      whosSearch.addEventListener("input", filterDirectory);
    }

    if (whosClearSearch) {
      whosClearSearch.addEventListener("click", function () {
        if (whosSearch) {
          whosSearch.value = "";
          whosSearch.focus();
        }
        filterDirectory();
      });
    }

    if (resetWhosFiltersBtn) {
      resetWhosFiltersBtn.addEventListener("click", function () {
        activeCategory = "all";
        whosFilterBtns.forEach(function (b) {
          b.classList.toggle("is-active", b.getAttribute("data-filter") === "all");
        });
        if (whosSearch) whosSearch.value = "";
        filterDirectory();
      });
    }
  }

})();


