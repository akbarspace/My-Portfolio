/* ============================================================
   PEARL WHITE DENTAL — scripts.js
   Sections covered:
     1. Nav scroll effect
     2. Testimonial Slider (carousel)
     3. FAQ Accordion
     4. Scroll-reveal animations
   ============================================================ */
 
/* ============================================================
   1. NAV — add shadow on scroll
   ============================================================ */
(function initNav() {
  const navWrapper = document.querySelector('.nav-wrapper');
 
  // Listen to the window scroll event and toggle a CSS class
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navWrapper.classList.add('scrolled');   // class adds box-shadow via CSS
    } else {
      navWrapper.classList.remove('scrolled');
    }
  }, { passive: true });
})();
 
 
/* ============================================================
   2. TESTIMONIAL SLIDER
   How it works:
   - All slides live in a flex container (.slider-track).
   - Each slide is 100% wide, so the track is N×100% wide.
   - We translate the track by -(currentIndex × 100%) to show
     the active slide.
   - Previous / Next buttons decrement / increment the index.
   - Dot buttons jump directly to a slide.
   - An auto-play timer advances slides every 6 seconds and
     resets if the user interacts manually.
   ============================================================ */
(function initSlider() {
  const track       = document.getElementById('sliderTrack');
  const slides      = Array.from(track.querySelectorAll('.slide'));
  const prevBtn     = document.getElementById('prevBtn');
  const nextBtn     = document.getElementById('nextBtn');
  const dotsWrapper = document.getElementById('sliderDots');
 
  if (!track || slides.length === 0) return; // guard: elements must exist
 
  let currentIndex = 0;           // which slide is visible
  let autoPlayTimer = null;       // reference so we can clear it
 
  // --- BUILD DOTS ---
  // Create one dot button per slide and append them to the dots container
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.classList.add('dot');
    dot.setAttribute('aria-label', `Go to review ${i + 1}`);
    if (i === 0) dot.classList.add('active');
 
    // Clicking a dot jumps to that slide
    dot.addEventListener('click', () => {
      goTo(i);
      resetAutoPlay(); // reset timer so it doesn't jump immediately after click
    });
 
    dotsWrapper.appendChild(dot);
  });
 
  const dots = Array.from(dotsWrapper.querySelectorAll('.dot'));
 
  // --- CORE FUNCTION: move to a specific slide index ---
  function goTo(index) {
    // Wrap around: if past the last slide, go to first; if before first, go to last
    currentIndex = (index + slides.length) % slides.length;
 
    // Shift the entire track left by currentIndex slide-widths
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
 
    // Sync dots: remove active from all, add to current
    dots.forEach(d => d.classList.remove('active'));
    dots[currentIndex].classList.add('active');
 
    // Update ARIA for screen readers
    slides.forEach((slide, i) => {
      slide.setAttribute('aria-hidden', i !== currentIndex);
    });
  }
 
  // --- BUTTON HANDLERS ---
  prevBtn.addEventListener('click', () => {
    goTo(currentIndex - 1);
    resetAutoPlay();
  });
 
  nextBtn.addEventListener('click', () => {
    goTo(currentIndex + 1);
    resetAutoPlay();
  });
 
  // --- KEYBOARD NAVIGATION ---
  // Allow arrow keys when focus is inside the slider region
  document.querySelector('.slider-wrapper').addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { goTo(currentIndex - 1); resetAutoPlay(); }
    if (e.key === 'ArrowRight') { goTo(currentIndex + 1); resetAutoPlay(); }
  });
 
  // --- TOUCH / SWIPE SUPPORT ---
  let touchStartX = 0;
  track.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
 
  track.addEventListener('touchend', e => {
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {          // threshold: 50px swipe
      goTo(delta > 0 ? currentIndex + 1 : currentIndex - 1);
      resetAutoPlay();
    }
  }, { passive: true });
 
  // --- AUTO-PLAY ---
  function startAutoPlay() {
    autoPlayTimer = setInterval(() => goTo(currentIndex + 1), 6000);
  }
  function resetAutoPlay() {
    clearInterval(autoPlayTimer);
    startAutoPlay();
  }
 
  // Initialise: render first slide state + start auto-play
  goTo(0);
  startAutoPlay();
})();
 
 
/* ============================================================
   3. FAQ ACCORDION
   How it works:
   - Each .faq-item has a <button class="faq-question"> and a
     sibling .faq-answer div.
   - Clicking a button toggles its aria-expanded attribute.
   - We read the answer's scrollHeight (its natural height) and
     set max-height to that value to animate open.
   - Closing sets max-height back to 0 — CSS handles the
     smooth transition.
   - Only one item can be open at a time (accordion behaviour).
   ============================================================ */
(function initAccordion() {
  const faqList = document.getElementById('faqList');
  if (!faqList) return;
 
  const questions = faqList.querySelectorAll('.faq-question');
 
  questions.forEach(btn => {
    btn.addEventListener('click', () => {
      const isOpen   = btn.getAttribute('aria-expanded') === 'true';
      const answer   = btn.nextElementSibling; // .faq-answer sibling
 
      // --- Close ALL open items first (one-at-a-time accordion) ---
      questions.forEach(otherBtn => {
        if (otherBtn !== btn) {
          otherBtn.setAttribute('aria-expanded', 'false');
          otherBtn.nextElementSibling.style.maxHeight = '0';
        }
      });
 
      // --- Toggle the clicked item ---
      if (isOpen) {
        // Currently open → close it
        btn.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = '0';
      } else {
        // Currently closed → open it
        btn.setAttribute('aria-expanded', 'true');
        // scrollHeight is the full rendered height of the content;
        // setting max-height to this value lets CSS animate to it.
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
})();
 
 
/* ============================================================
   4. SCROLL-REVEAL (Intersection Observer)
   How it works:
   - We mark elements with class="reveal".
   - An IntersectionObserver watches them; when an element
     enters the viewport (intersectionRatio > 0) we add
     class="visible" which triggers the CSS fade-up transition.
   - Once visible we stop observing that element (no re-trigger).
   ============================================================ */
(function initReveal() {
  // Elements we want to reveal on scroll
  const targets = document.querySelectorAll(
    '.service-card, .doctor-layout, .faq-item, .doctor-credential, .hero-stats .stat'
  );
 
  // Mark them all with the base "hidden" class
  targets.forEach(el => el.classList.add('reveal'));
 
  // If IntersectionObserver isn't supported, just show everything
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('visible'));
    return;
  }
 
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // stop watching once revealed
      }
    });
  }, {
    threshold: 0.12,      // trigger when 12% of the element is visible
    rootMargin: '0px 0px -40px 0px'  // trigger slightly before bottom of viewport
  });
 
  targets.forEach(el => observer.observe(el));
})();