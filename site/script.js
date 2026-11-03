"use strict";

let turnstileLoader;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (!turnstileLoader) turnstileLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    // This script is inserted dynamically, so its load event means the API is ready.
    // Calling turnstile.ready() here can fail because the script itself loads async.
    script.onload = () => {
      if (window.turnstile) resolve();
      else {
        turnstileLoader = null;
        reject(new Error('Security check could not initialize. Please try again.'));
      }
    };
    script.onerror = () => { turnstileLoader = null; reject(new Error('Security check could not load. Please try again.')); };
    document.head.append(script);
  });
  return turnstileLoader;
}

async function sendEnquiry(form, status, kind) {
  const button = form.querySelector('[type="submit"]');
  if(button.disabled) return;
  button.disabled = true;
  form.setAttribute('aria-busy','true');
  status.textContent = 'Checking and sending your enquiry…';
  let widget, container;
  try {
    const configResponse = await fetch('/api/form-config',{signal:AbortSignal.timeout(10000)});
    const config = await configResponse.json();
    if(!configResponse.ok || !config.sitekey) throw new Error('The form is not available yet. Please use the email or phone link.');
    await loadTurnstile();
    container = document.createElement('div');
    button.before(container);
    const token = await new Promise((resolve,reject) => {
      const timeout = setTimeout(()=>reject(new Error('Security check timed out. Please try again.')),120000);
      const finish = fn => value => { clearTimeout(timeout); fn(value); };
      widget = window.turnstile.render(container,{sitekey:config.sitekey,action:'contact',
        callback:finish(resolve),'error-callback':finish(()=>reject(new Error('Security check failed. Please try again.'))),
        'expired-callback':finish(()=>reject(new Error('Security check expired. Please try again.')))});
    });
    const fields = Object.fromEntries(new FormData(form));
    const result = await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({kind,fields,token}),signal:AbortSignal.timeout(30000)});
    const response = await result.json();
    status.textContent = response.message || 'We could not confirm sending. Please contact us by email.';
    if(result.ok) form.reset();
  } catch(error) {
    status.textContent = error.name === 'TimeoutError' || error.name === 'TypeError'
      ? 'We could not confirm sending. Please contact us by email before submitting again.' : error.message;
  } finally {
    if(widget !== undefined) window.turnstile.remove(widget);
    container?.remove();
    button.disabled = false;
    form.removeAttribute('aria-busy');
  }
}

const documentElement = document.documentElement;
const header = document.querySelector("[data-header]");
const availabilityDialog = document.querySelector("#availability-dialog");
const availabilityButtons = [...document.querySelectorAll("[data-availability], a[href]")].filter((element) => {
  if (element.hasAttribute("data-availability")) return true;
  const label = element.textContent.trim().toLowerCase();
  if (!label.includes("check availability")) return false;
  return new URL(element.href, window.location.href).pathname === "/contact/";
});
const contactDialog = document.querySelector("#contact-dialog");
const contactButtons = document.querySelectorAll("[data-contact-open]");
const availabilityForm = document.querySelector("[data-availability-form]");
const availabilityStatus = document.querySelector("[data-form-status]");
const contactForm = document.querySelector("[data-contact-form]");
const contactStatus = document.querySelector("[data-contact-status]");
const arrivalDate = document.querySelector("#arrival-date");
const departureDate = document.querySelector("#departure-date");
const lightbox = document.querySelector("#lightbox");
const galleryButtons = [...document.querySelectorAll("[data-gallery-index]")];
const galleryOpenButtons = document.querySelectorAll("[data-gallery-open]");
const mapFrame = document.querySelector("[data-map-frame]");
const mapZoomInButton = document.querySelector("[data-map-zoom-in]");
const mapZoomOutButton = document.querySelector("[data-map-zoom-out]");
const mapStatus = document.querySelector("[data-map-status]");
const lightboxImage = lightbox?.querySelector("[data-lightbox-image]");
const lightboxCaption = lightbox?.querySelector("[data-lightbox-caption]");
const lightboxCounter = lightbox?.querySelector("[data-lightbox-counter]");
const previousButton = lightbox?.querySelector("[data-lightbox-previous]");
const nextButton = lightbox?.querySelector("[data-lightbox-next]");

let activeGalleryIndex = 0;
let activeGalleryTrigger = null;
let touchStartX = null;
let headerFrame = null;
let mapZoomIndex = Number(mapFrame?.dataset.mapZoomIndex ?? 10);
let activeAvailabilityTrigger = null;
let activeContactTrigger = null;
const mapBaseSource = mapFrame?.getAttribute("src") || "";
const mapZoomDistances = [
  5760000,
  2880000,
  1440000,
  720000,
  360000,
  180000,
  90000,
  45000,
  22500,
  11270.690094655434,
  5635.345047327717,
  2817.6725236638586,
  1408.8362618319293,
  704.4181309159646,
];
const mapZoomLevels = [4, 6, 8, 10, 12, 14, 15, 16, 18];

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

function updateHeaderState() {
  document.querySelector(".whatsapp-fab")?.classList.toggle("is-visible", window.scrollY > 80);
  if (header) {
    const isScrolled = header.classList.contains("is-scrolled");
    if (!isScrolled && window.scrollY > 48) header.classList.add("is-scrolled");
    if (isScrolled && window.scrollY < 8) header.classList.remove("is-scrolled");
  }
  headerFrame = null;
}

window.addEventListener("scroll", () => {
  if (headerFrame !== null) return;
  headerFrame = window.requestAnimationFrame(updateHeaderState);
}, { passive: true });

updateHeaderState();

// Keep the restored contact shortcut clear of map controls at all sizes.
if (mapFrame && "IntersectionObserver" in window) {
  const whatsappMapObserver = new IntersectionObserver(([entry]) => {
    documentElement.classList.toggle("whatsapp-map-in-view", entry.isIntersecting);
  });
  whatsappMapObserver.observe(mapFrame.parentElement);
}

const mobileStickyCta = document.querySelector(".mobile-sticky-cta");
const openingHero = document.querySelector(".hero, .page-hero");
if (mobileStickyCta) {
  if (window.location.pathname.startsWith("/contact")) {
    mobileStickyCta.classList.add("is-hidden");
  } else if (openingHero && "IntersectionObserver" in window) {
    const stickyObserver = new IntersectionObserver(([entry]) => {
      mobileStickyCta.classList.toggle("is-hidden", entry.isIntersecting);
    }, { threshold: 0.12 });
    stickyObserver.observe(openingHero);
  }
}

function setDateMinimums() {
  const today = new Date().toISOString().slice(0, 10);
  if (arrivalDate && !arrivalDate.value) arrivalDate.min = today;
  if (departureDate) departureDate.min = arrivalDate?.value || today;
}

function validateStayDates() {
  if (!arrivalDate || !departureDate) return true;
  departureDate.setCustomValidity("");
  if (arrivalDate.value && departureDate.value && departureDate.value <= arrivalDate.value) {
    departureDate.setCustomValidity("Check-out must be after check-in.");
    return false;
  }
  return true;
}

function selectAccommodation(key) {
  const choices = {
    "2-bedroom": "The Villa",
    "the-villa": "The Villa",
    "3-bedroom": "The Manor",
    "the-manor": "The Manor",
    "both-townhomes": "Rent Both Townhomes",
  };
  const value = choices[key];
  if (!value) return;
  const choice = availabilityForm?.querySelector(`[name="accommodation"][value="${value}"]`);
  if (choice) choice.checked = true;
}

if (availabilityForm) {
  setDateMinimums();
  selectAccommodation(new URLSearchParams(window.location.search).get("stay"));
}

function openAvailabilityDialog(trigger) {
  if (!availabilityDialog?.showModal) return;
  activeAvailabilityTrigger = trigger;
  setDateMinimums();
  const linkedStay = trigger instanceof HTMLAnchorElement
    ? new URL(trigger.href, window.location.href).searchParams.get("stay")
    : null;
  selectAccommodation(trigger.dataset.accommodation || linkedStay);
  if (availabilityStatus) availabilityStatus.textContent = "";
  availabilityDialog.showModal();

  window.requestAnimationFrame(() => {
    const selectedStay = availabilityForm?.querySelector('[name="accommodation"]:checked');
    (selectedStay || availabilityForm?.querySelector('[name="accommodation"]'))?.focus();
  });
}

availabilityButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    if (!availabilityDialog?.showModal) return;
    event.preventDefault();
    openAvailabilityDialog(button);
  });
});

function openContactDialog(trigger) {
  if (!contactDialog?.showModal) return;
  activeContactTrigger = trigger;
  if (contactStatus) contactStatus.textContent = "";
  contactDialog.showModal();
  window.requestAnimationFrame(() => contactForm?.querySelector("input")?.focus());
}

contactButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    openContactDialog(button);
  });
});

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!contactForm.checkValidity()) {
    contactStatus.textContent = "Please complete the required fields before sending your message.";
    contactForm.reportValidity();
    return;
  }

  await sendEnquiry(contactForm, contactStatus, "contact");
});

arrivalDate?.addEventListener("change", () => {
  setDateMinimums();
  validateStayDates();
});

departureDate?.addEventListener("change", validateStayDates);

availabilityForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  validateStayDates();

  if (!availabilityForm.checkValidity()) {
    availabilityStatus.textContent = "Please complete the required fields before sending your request.";
    availabilityForm.reportValidity();
    return;
  }

  await sendEnquiry(availabilityForm, availabilityStatus, "availability");
});

availabilityDialog?.addEventListener("close", () => {
  activeAvailabilityTrigger?.focus();
});

contactDialog?.addEventListener("close", () => {
  activeContactTrigger?.focus();
});

function setLightboxImage(index) {
  const item = galleryButtons[index];
  if (!item || !lightboxImage || !lightboxCaption || !lightboxCounter) return;

  activeGalleryIndex = index;
  lightboxImage.src = item.dataset.full;
  lightboxImage.alt = item.dataset.alt;
  lightboxCaption.textContent = item.dataset.alt;
  const visibleItems = galleryButtons.filter((button) => !button.hidden);
  const visibleIndex = visibleItems.indexOf(item);
  lightboxCounter.textContent = `${visibleIndex + 1} / ${visibleItems.length}`;
}

function showPreviousImage() {
  const visibleItems = galleryButtons.filter((button) => !button.hidden);
  const current = visibleItems.indexOf(galleryButtons[activeGalleryIndex]);
  const item = visibleItems[(current - 1 + visibleItems.length) % visibleItems.length];
  setLightboxImage(galleryButtons.indexOf(item));
}

function showNextImage() {
  const visibleItems = galleryButtons.filter((button) => !button.hidden);
  const current = visibleItems.indexOf(galleryButtons[activeGalleryIndex]);
  const item = visibleItems[(current + 1) % visibleItems.length];
  setLightboxImage(galleryButtons.indexOf(item));
}

galleryButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    if (!lightbox?.showModal) return;
    activeGalleryTrigger = button;
    setLightboxImage(index);
    lightbox.showModal();
  });
});

galleryOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const requestedIndex = Number.parseInt(button.dataset.galleryOpen ?? "0", 10);
    galleryButtons[requestedIndex]?.click();
  });
});

const galleryFilterButtons = [...document.querySelectorAll("[data-gallery-filter]")];
function filterGallery(category) {
  galleryFilterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.galleryFilter === category));
  });
  galleryButtons.forEach((button) => {
    button.hidden = category !== "all" && button.dataset.category !== category;
  });
}

galleryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => filterGallery(button.dataset.galleryFilter || "all"));
});

if (galleryFilterButtons.length) {
  const requestedFilter = new URLSearchParams(window.location.search).get("filter");
  if (["villa", "manor", "outdoors"].includes(requestedFilter)) filterGallery(requestedFilter);
}

previousButton?.addEventListener("click", showPreviousImage);
nextButton?.addEventListener("click", showNextImage);

lightbox?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showPreviousImage();
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    showNextImage();
  }
});

lightbox?.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0]?.clientX ?? null;
}, { passive: true });

lightbox?.addEventListener("touchend", (event) => {
  if (touchStartX === null) return;
  const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
  const distance = touchEndX - touchStartX;
  touchStartX = null;

  if (Math.abs(distance) < 48) return;
  if (distance > 0) showPreviousImage();
  else showNextImage();
}, { passive: true });

lightbox?.addEventListener("close", () => {
  lightboxImage?.removeAttribute("src");
  activeGalleryTrigger?.focus();
});

for (const dialog of document.querySelectorAll("dialog")) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function updateMapZoom(nextIndex) {
  if (!mapFrame || !mapBaseSource) return;

  const usesEmbeddedDistance = /!1d[\d.]+/.test(mapBaseSource);
  const zoomSteps = usesEmbeddedDistance ? mapZoomDistances : mapZoomLevels;
  mapZoomIndex = Math.min(zoomSteps.length - 1, Math.max(0, nextIndex));

  if (usesEmbeddedDistance) {
    mapFrame.src = mapBaseSource.replace(
      /!1d[\d.]+/,
      `!1d${zoomSteps[mapZoomIndex]}`,
    );
  } else {
    const mapSource = new URL(mapBaseSource, window.location.href);
    mapSource.searchParams.set("z", String(zoomSteps[mapZoomIndex]));
    mapFrame.src = mapSource.toString();
  }

  if (mapStatus) mapStatus.textContent = `Map zoom level ${zoomSteps[mapZoomIndex]}.`;
  mapZoomInButton?.toggleAttribute("disabled", mapZoomIndex === zoomSteps.length - 1);
  mapZoomOutButton?.toggleAttribute("disabled", mapZoomIndex === 0);
}

mapZoomInButton?.addEventListener("click", () => updateMapZoom(mapZoomIndex + 1));
mapZoomOutButton?.addEventListener("click", () => updateMapZoom(mapZoomIndex - 1));
if (mapFrame) updateMapZoom(mapZoomIndex);
// Only About: keep the map controls clear of its floating availability action.
if (document.body.classList.contains("about-page") && mapFrame && "IntersectionObserver" in window) {
  const aboutMapObserver = new IntersectionObserver(([entry]) => {
    document.body.classList.toggle("about-map-in-view", entry.isIntersecting);
  });
  aboutMapObserver.observe(mapFrame.closest(".villa-location__map"));
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll("[data-showcase]").forEach((showcase) => {
  const slides = [...showcase.querySelectorAll("[data-showcase-slide]")];
  const dots = [...showcase.querySelectorAll("[data-showcase-dot]")];
  const thumbnails = [...showcase.querySelectorAll("[data-showcase-thumbnail]")];
  const previous = showcase.querySelector("[data-showcase-previous]");
  const next = showcase.querySelector("[data-showcase-next]");
  let activeIndex = 0;
  let rotationTimer = null;
  const configuredInterval = Number(showcase.dataset.showcaseInterval);
  const rotationInterval = Number.isFinite(configuredInterval) && configuredInterval >= 3000
    ? configuredInterval
    : 7000;

  function showSlide(index, userInitiated = false) {
    if (!slides.length) return;
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    [...dots, ...thumbnails].forEach((control) => {
      control.setAttribute("aria-current", String(Number(control.dataset.showcaseDot ?? control.dataset.showcaseThumbnail) === activeIndex));
    });
    if (userInitiated) restartRotation();
  }

  function stopRotation() {
    window.clearInterval(rotationTimer);
    rotationTimer = null;
  }

  function startRotation() {
    if (showcase.dataset.showcaseAutoplay === "false" || reducedMotion || slides.length < 2 || rotationTimer !== null) return;
    rotationTimer = window.setInterval(() => showSlide(activeIndex + 1), rotationInterval);
  }

  function restartRotation() {
    stopRotation();
    startRotation();
  }

  previous?.addEventListener("click", () => showSlide(activeIndex - 1, true));
  next?.addEventListener("click", () => showSlide(activeIndex + 1, true));
  showcase.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    showSlide(activeIndex + (event.key === "ArrowLeft" ? -1 : 1), true);
  });
  let swipeStart = null;
  showcase.addEventListener("touchstart", (event) => {
    swipeStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  showcase.addEventListener("touchend", (event) => {
    if (!swipeStart) return;
    const dx = event.changedTouches[0].clientX - swipeStart.x;
    const dy = event.changedTouches[0].clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) showSlide(activeIndex + (dx < 0 ? 1 : -1), true);
  }, { passive: true });
  dots.forEach((dot) => dot.addEventListener("click", () => showSlide(Number(dot.dataset.showcaseDot), true)));
  thumbnails.forEach((thumbnail) => thumbnail.addEventListener("click", () => showSlide(Number(thumbnail.dataset.showcaseThumbnail), true)));
  if (showcase.dataset.showcasePauseOnHover !== "false") {
    showcase.addEventListener("pointerenter", stopRotation);
    showcase.addEventListener("pointerleave", startRotation);
  }
  showcase.addEventListener("focusin", stopRotation);
  showcase.addEventListener("focusout", (event) => {
    if (!showcase.contains(event.relatedTarget)) startRotation();
  });
  showSlide(0);
  startRotation();
});

document.querySelectorAll("guest-reviews").forEach((reviewSection) => {
  const carousel = reviewSection.querySelector("[data-review-carousel]");
  const previous = reviewSection.querySelector("[data-review-previous]");
  const next = reviewSection.querySelector("[data-review-next]");

  function moveReviews(direction) {
    const firstCard = carousel?.querySelector(".review-card");
    if (!carousel || !firstCard) return;
    const gap = Number.parseFloat(window.getComputedStyle(carousel).columnGap) || 16;
    carousel.classList.remove("is-moving");
    window.requestAnimationFrame(() => carousel.classList.add("is-moving"));
    window.setTimeout(() => carousel.classList.remove("is-moving"), 280);
    carousel.scrollBy({ left: direction * (firstCard.getBoundingClientRect().width + gap), behavior: "smooth" });
  }

  previous?.addEventListener("click", () => moveReviews(-1));
  next?.addEventListener("click", () => moveReviews(1));
});

if (!reducedMotion && "IntersectionObserver" in window) {
  documentElement.classList.add("motion-ready");
  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      activeObserver.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

