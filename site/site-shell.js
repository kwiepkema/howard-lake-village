"use strict";

const brandMarkup = `
  <svg class="brand-mark" viewBox="0 0 72 42" aria-hidden="true">
    <path d="M16 31 27 9l11 22M25 31 36 3l14 28M40 31 51 12l9 19" />
    <path d="M4 35c8-3 13 3 21 0s13 3 21 0 13 3 22 0" />
  </svg>
  <span class="brand-type"><strong>Howard Lake</strong><span>Village</span></span>`;

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const path = window.location.pathname;
    const isHome = path === "/";
    const isContact = path.startsWith("/contact");
    const availabilityAction = isContact
      ? `<a class="button button--primary header-cta" href="#availability-form">Check Availability</a>`
      : `<button class="button button--primary header-cta" type="button" data-availability>Check Availability</button>`;
    const mobileAvailabilityAction = isContact
      ? `<a class="mobile-sticky-cta button button--primary" href="#availability-form">Check Availability</a>`
      : `<button class="mobile-sticky-cta button button--primary" type="button" data-availability>Check Availability</button>`;
    const sharedAvailabilityDialog = !isHome && !isContact ? `
      <dialog class="availability-dialog" id="availability-dialog" aria-labelledby="availability-title">
        <div class="dialog-heading">
          <div><p class="eyebrow">Plan your stay</p><h2 id="availability-title">Check Availability</h2><p>Share your preferred stay, dates and group size. This request does not confirm a reservation.</p></div>
          <form method="dialog"><button class="dialog-close" aria-label="Close availability form">×</button></form>
        </div>
        <form class="availability-form" data-availability-form>
          <fieldset><legend>Which stay are you interested in?</legend><div class="stay-options">
            <label><input type="radio" name="accommodation" value="The Villa" required /><span><strong>The Villa</strong><small>Two-bedroom townhome</small></span></label>
            <label><input type="radio" name="accommodation" value="The Manor" /><span><strong>The Manor</strong><small>Three-bedroom townhome</small></span></label>
            <label><input type="radio" name="accommodation" value="Rent Both Townhomes" /><span><strong>Rent Both</strong><small>Both neighboring townhomes</small></span></label>
          </div></fieldset>
          <div class="form-grid"><label>Check-in<input id="arrival-date" name="arrival-date" type="date" required /></label><label>Check-out<input id="departure-date" name="departure-date" type="date" required /></label><label>Guests<input name="guest-count" type="number" min="1" inputmode="numeric" required /></label><label>Bringing pets?<select name="pets"><option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option></select></label><label>First name<input name="first-name" autocomplete="given-name" required /></label><label>Last name<input name="last-name" autocomplete="family-name" required /></label><label>Email<input name="email" type="email" autocomplete="email" required /></label><label>Phone<input name="phone" type="tel" autocomplete="tel" required /></label><label class="form-grid__wide">Questions or details<textarea name="guest-message" rows="4"></textarea></label></div>
          <p class="form-note">Your details will be sent to the host to respond to your enquiry.</p>
          <p class="form-status" data-form-status aria-live="polite"></p>
          <button class="button button--primary" type="submit">Send Enquiry</button>
        </form>
      </dialog>` : "";
    this.innerHTML = `
      <a class="skip-link" href="#main-content">Skip to main content</a>
      <header class="site-header" data-header>
        <div class="contact-bar">
          <div class="contact-bar__inner shell">
            <p>Questions about your stay?</p>
            <div class="contact-bar__links" aria-label="Contact Howard Lake Village">
              <a href="tel:+17634382711"><strong>+1 763-438-2711</strong></a>
              <a href="mailto:info@howardlakevillagemn.com"><strong>info@howardlakevillagemn.com</strong></a>
              <a href="/contact/"><span aria-hidden="true">Questions?</span><strong>Contact us</strong></a>
            </div>
          </div>
        </div>
        <div class="header-inner shell">
          <a class="brand" href="/" aria-label="Howard Lake Village home">${brandMarkup}</a>
          <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" data-menu-toggle>
            <span class="sr-only">Open navigation</span><span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
          </button>
          <nav class="primary-nav" id="primary-navigation" aria-label="Primary navigation" data-navigation>
            <a href="/">Home</a>
            <div class="nav-group" data-nav-group>
              <button type="button" aria-expanded="false" data-nav-disclosure>Stay <span aria-hidden="true">⌄</span></button>
              <div class="nav-submenu"><a href="/homes/the-villa/">The Villa</a><a href="/homes/the-manor/">The Manor</a><a href="/homes/rent-both-townhomes/">Rent Both Townhomes</a></div>
            </div>
            <div class="nav-group" data-nav-group>
              <button type="button" aria-expanded="false" data-nav-disclosure>Explore <span aria-hidden="true">⌄</span></button>
              <div class="nav-submenu"><a href="/explore/weekend-getaway-from-minneapolis/">Weekend Getaway</a><a href="/explore/fishing-howard-lake/">Fishing &amp; Lake Life</a><a href="/explore/things-to-do-howard-lake/">Things to Do</a></div>
            </div>
            <a href="/gallery/">Gallery</a><a href="/about/">About Us</a><a href="/contact/">Contact</a>
            <div class="mobile-nav-contact"><a href="tel:+17634382711">Call us: +1 763-438-2711</a><a href="mailto:info@howardlakevillagemn.com">Email us: info@howardlakevillagemn.com</a><a href="/contact/">Contact Howard Lake Village</a></div>
          </nav>
          ${availabilityAction}
        </div>
      </header>
      ${mobileAvailabilityAction}
      <a class="whatsapp-fab" href="https://wa.me/17634382711" target="_blank" rel="noopener noreferrer" aria-label="Contact Joe on WhatsApp (opens in a new tab)"><img src="/assets/images/whatsapp-icon.png" width="64" height="64" alt="" /><span>WhatsApp</span></a>
      ${sharedAvailabilityDialog}`;

    this.querySelectorAll("nav a").forEach((link) => {
      const href = new URL(link.href, window.location.origin).pathname;
      if (href !== "/" && path.startsWith(href)) link.setAttribute("aria-current", "page");
      if (href === "/" && path === "/") link.setAttribute("aria-current", "page");
    });

    this._navigationController?.abort();
    this._navigationController = new AbortController();
    const { signal } = this._navigationController;
    const menuButton = this.querySelector("[data-menu-toggle]");
    const navigation = this.querySelector("[data-navigation]");
    const groups = [...this.querySelectorAll("[data-nav-group]")];
    const disclosureButtons = [...this.querySelectorAll("[data-nav-disclosure]")];
    const desktopNavigation = window.matchMedia("(min-width: 62.01rem)");
    let closeTimer = null;

    const closeDisclosures = (exceptButton = null) => {
      disclosureButtons.forEach((button) => {
        if (button === exceptButton) return;
        button.setAttribute("aria-expanded", "false");
        button.closest("[data-nav-group]")?.classList.remove("is-open");
      });
    };

    const closeMenu = () => {
      menuButton?.setAttribute("aria-expanded", "false");
      const label = menuButton?.querySelector(".sr-only");
      if (label) label.textContent = "Open navigation";
      navigation?.classList.remove("is-open");
      document.documentElement.classList.remove("nav-open");
      closeDisclosures();
    };

    const setDisclosure = (button, open) => {
      window.clearTimeout(closeTimer);
      closeDisclosures(open ? button : null);
      button.setAttribute("aria-expanded", String(open));
      button.closest("[data-nav-group]")?.classList.toggle("is-open", open);
    };

    menuButton?.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(open));
      const label = menuButton.querySelector(".sr-only");
      if (label) label.textContent = open ? "Close navigation" : "Open navigation";
      navigation?.classList.toggle("is-open", open);
      document.documentElement.classList.toggle("nav-open", open);
      if (!open) closeDisclosures();
    }, { signal });

    navigation?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu, { signal });
    });

    disclosureButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const open = desktopNavigation.matches
          ? true
          : button.getAttribute("aria-expanded") !== "true";
        setDisclosure(button, open);
      }, { signal });
    });

    groups.forEach((group) => {
      group.addEventListener("pointerenter", (event) => {
        if (!desktopNavigation.matches || event.pointerType === "touch") return;
        const button = group.querySelector("[data-nav-disclosure]");
        if (button) setDisclosure(button, true);
      }, { signal });
      group.addEventListener("pointerleave", (event) => {
        if (!desktopNavigation.matches || event.pointerType === "touch") return;
        window.clearTimeout(closeTimer);
        closeTimer = window.setTimeout(() => {
          if (group.matches(":focus-within") || group.matches(":hover")) return;
          const button = group.querySelector("[data-nav-disclosure]");
          if (button) setDisclosure(button, false);
        }, 160);
      }, { signal });
    });

    document.addEventListener("click", (event) => {
      if (!this.contains(event.target)) closeDisclosures();
    }, { signal });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const openGroup = groups.find((group) => group.classList.contains("is-open"));
      if (openGroup) {
        const button = openGroup.querySelector("[data-nav-disclosure]");
        closeDisclosures();
        button?.focus();
      } else if (navigation?.classList.contains("is-open")) {
        closeMenu();
        menuButton?.focus();
      }
    }, { signal });

    window.addEventListener("resize", () => {
      if (desktopNavigation.matches) closeMenu();
    }, { signal });
  }

  disconnectedCallback() {
    this._navigationController?.abort();
  }
}

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const isContact = window.location.pathname.startsWith("/contact");
    const footerAction = isContact
      ? `<a class="button button--outline-light" href="#availability-form">Check Availability</a>`
      : `<button class="button button--outline-light" type="button" data-availability>Check Availability</button>`;
    this.innerHTML = `
      <footer class="site-footer site-footer--compact">
        <div class="footer-grid shell">
          <div class="footer-brand"><a class="brand brand--footer" href="/" aria-label="Howard Lake Village home">${brandMarkup}</a><p>Two neighboring townhomes. One lakeside destination. Choose The Villa, The Manor, or reserve both.</p></div>
          <nav aria-label="Footer stays navigation"><h2>Stay</h2><a href="/homes/the-villa/">The Villa</a><a href="/homes/the-manor/">The Manor</a><a href="/homes/rent-both-townhomes/">Rent Both Townhomes</a></nav>
          <nav aria-label="Footer explore navigation"><h2>Explore</h2><a href="/explore/weekend-getaway-from-minneapolis/">Weekend Getaway</a><a href="/explore/fishing-howard-lake/">Fishing &amp; Lake Life</a><a href="/explore/things-to-do-howard-lake/">Things to Do</a><a href="/gallery/">Gallery</a><a href="/about/">About</a></nav>
          <div class="footer-contact-mini"><h2>Contact</h2><a href="/contact/">Contact Howard Lake Village</a></div>
          <div class="footer-action"><h2>Plan your stay</h2><p>Tell us your dates, group size and preferred stay. An enquiry does not confirm a reservation.</p>${footerAction}</div>
        </div>
        <div class="footer-bottom shell"><p>© <span data-year></span> Howard Lake Village. All rights reserved.</p><p>Howard Lake, Minnesota</p></div>
      </footer>`;
  }
}

class GuestReviews extends HTMLElement {
  connectedCallback() {
    const title = this.dataset.title || "What guests say about The Villa";
    const label = this.dataset.label || "Guest reviews for The Villa";
      const note = this.hasAttribute("data-hide-note")
        ? ""
        : (this.dataset.note || "Guest reviews from The Villa’s Airbnb listing.");
    this.innerHTML = `
      <section class="reviews review-carousel-section section" aria-labelledby="guest-reviews-title">
        <div class="shell">
          <div class="reviews-heading review-carousel-heading reveal">
            <div>
              <p class="eyebrow">Verified guest feedback</p>
              <h2 id="guest-reviews-title">${title}</h2>
            </div>
            <div class="review-carousel-controls" aria-label="Review slider controls">
              <button type="button" data-review-previous aria-label="Show previous review">&larr;</button>
              <button type="button" data-review-next aria-label="Show next review">&rarr;</button>
            </div>
          </div>
          <div class="review-carousel" data-review-carousel tabindex="0" aria-label="${label}">
            <figure class="review-card">
              <div class="review-stars" aria-label="5 out of 5 stars">★★★★★</div>
              <blockquote>“Great little spot on the lake with peaceful surroundings and an amazing view!”</blockquote>
              <figcaption><strong>Arnulfo</strong><span>Airbnb · August 2026</span></figcaption>
            </figure>
            <figure class="review-card">
              <div class="review-stars" aria-label="5 out of 5 stars">★★★★★</div>
              <blockquote>“Our stay with our two pups was great!”</blockquote>
              <figcaption><strong>Christy</strong><span>Airbnb · July 2026</span></figcaption>
            </figure>
            <figure class="review-card">
              <div class="review-stars" aria-label="5 out of 5 stars">★★★★★</div>
              <blockquote>“Good place to stay. We enjoyed our visit.”</blockquote>
              <figcaption><strong>Jennifer</strong><span>Airbnb · July 2026</span></figcaption>
            </figure>
            <figure class="review-card">
              <div class="review-stars" aria-label="5 out of 5 stars">★★★★★</div>
              <blockquote>“Very clean. Host went above and beyond expectations.”</blockquote>
              <figcaption><strong>Christopher</strong><span>Airbnb · July 2026</span></figcaption>
            </figure>
            <figure class="review-card">
              <div class="review-stars" aria-label="5 out of 5 stars">★★★★★</div>
              <blockquote>“It was a perfect relaxing location. Enjoyed a beautiful sunrise over the lake!”</blockquote>
              <figcaption><strong>Toni</strong><span>Airbnb · May 2026</span></figcaption>
            </figure>
            <figure class="review-card">
              <div class="review-stars" aria-label="5 out of 5 stars">★★★★★</div>
              <blockquote>“Clean, comfy and quiet.”</blockquote>
              <figcaption><strong>Michael</strong><span>Airbnb · April 2026</span></figcaption>
            </figure>
          </div>
          ${note ? `<p class="review-note">${note}</p>` : ""}
        </div>
      </section>`;
  }
}

class SiteLocation extends HTMLElement {
  connectedCallback() {
    const property = this.dataset.property || "general";
    const locations = {
      villa: { eyebrow: "The Villa location", title: "Stay by Howard Lake", address: "5536 County Rd 6 SW, Howard Lake, MN 55349", query: "5536+County+Rd+6+SW,+Howard+Lake,+MN+55349" },
      manor: { eyebrow: "The Manor location", title: "Stay by Howard Lake", address: "5540 County Rd 6 SW, Howard Lake, MN 55349", query: "5540+County+Rd+6+SW,+Howard+Lake,+MN+55349" },
      both: { eyebrow: "One lakeside setting", title: "Two neighboring townhomes", address: "5536 and 5540 County Rd 6 SW, Howard Lake, MN 55349", query: "5536+County+Rd+6+SW,+Howard+Lake,+MN+55349" },
      general: { eyebrow: "Howard Lake, Minnesota", title: "Find Howard Lake Village", address: "5536 and 5540 County Rd 6 SW, Howard Lake, MN 55349", query: "5536+County+Rd+6+SW,+Howard+Lake,+MN+55349" }
    };
    const item = locations[property] || locations.general;
    const source = `https://www.google.com/maps?q=${item.query}&z=15&output=embed`;
    this.innerHTML = `
      <section class="section villa-location" aria-labelledby="location-${property}-title">
        <div class="shell villa-location__grid">
          <div class="villa-location__copy reveal">
            <p class="eyebrow">${item.eyebrow}</p>
            <h2 id="location-${property}-title">${item.title}</h2>
            <address>${item.address}</address>
            <p class="location-contact-links"><a href="tel:+17634382711">+1 763-438-2711</a><a href="mailto:info@howardlakevillagemn.com">info@howardlakevillagemn.com</a></p>
            <p>The map provides location context for your stay. Use the controls to zoom in or out.</p>
          </div>
          <div class="villa-location__map reveal">
            <iframe data-map-frame data-map-base="https://www.google.com/maps?q=${item.query}" data-map-zoom-index="6" src="${source}" title="Map showing Howard Lake Village in Howard Lake, Minnesota" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            <div class="map-control-bar" aria-label="Map zoom controls"><span>Map zoom</span><div class="map-control-actions"><button type="button" data-map-zoom-out aria-label="Zoom map out">−</button><button type="button" data-map-zoom-in aria-label="Zoom map in">+</button></div></div>
            <p class="sr-only" data-map-status aria-live="polite">Map zoom level 15.</p>
          </div>
        </div>
      </section>`;
  }
}

customElements.define("site-header", SiteHeader);
customElements.define("site-footer", SiteFooter);
customElements.define("guest-reviews", GuestReviews);
customElements.define("site-location", SiteLocation);
