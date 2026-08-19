(function () {
  'use strict';

  var BOOKING_EMAIL = 'glowlinedetail@gmail.com';
  var FORMSPREE_URL = 'https://formspree.io/f/xppakawo';

  var VEHICLE_LABELS = {
    sedan: 'Sedan',
    suv: 'SUV / Truck',
    thirdrow: '3rd Row'
  };

  var ODOR_ADDON_DELTA = 50;

  // Base prices per package per vehicle size.
  // "plus: true" marks the Standard package's 3rd-row price as a starting ("$300+") price.
  var PACKAGES = {
    standard: {
      label: 'Standard Package',
      excludeWashAllowed: true,
      excludeWashDelta: -20,
      prices: {
        sedan: { amount: 229.99 },
        suv: { amount: 269.99 },
        thirdrow: { amount: 300.00, plus: true }
      }
    },
    signature: {
      label: 'Signature Package',
      excludeWashAllowed: false,
      excludeWashDelta: 0,
      prices: {
        sedan: { amount: 269.99 },
        suv: { amount: 299.99 },
        thirdrow: { amount: 339.99 }
      }
    },
    premium: {
      label: 'Premium Detail — Showroom Ready',
      excludeWashAllowed: false,
      excludeWashDelta: 0,
      prices: {
        sedan: { amount: 310.00 },
        suv: { amount: 350.00 },
        thirdrow: { amount: 390.00 }
      }
    }
  };

  function formatPrice(amount, plus) {
    var formatted = '$' + amount.toFixed(2);
    return plus ? formatted + '+' : formatted;
  }

  function initHeaderNav() {
    var header = document.getElementById('siteHeader');
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('mainNav');
    if (!toggle || !header || !nav) return;

    toggle.addEventListener('click', function () {
      var isOpen = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        header.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initPackageCards() {
    var cards = document.querySelectorAll('.package-card');

    cards.forEach(function (card) {
      var packageKey = card.getAttribute('data-package');
      var pkg = PACKAGES[packageKey];
      if (!pkg) return;

      var vehButtons = card.querySelectorAll('.veh-btn');
      var priceEl = card.querySelector('[data-price-display]');
      var excludeCheckbox = card.querySelector('[data-exclude-wash]');
      var odorCheckbox = card.querySelector('[data-odor-addon]');
      var priceNote = card.querySelector('[data-price-note]');
      var bookBtn = card.querySelector('[data-book-package]');
      var currentVehicle = 'sedan';

      function render() {
        var priceInfo = pkg.prices[currentVehicle];
        var amount = priceInfo.amount;
        var washExcluded = !!(excludeCheckbox && excludeCheckbox.checked && pkg.excludeWashAllowed);
        var odorAdded = !!(odorCheckbox && odorCheckbox.checked);
        if (washExcluded) amount += pkg.excludeWashDelta;
        if (odorAdded) amount += ODOR_ADDON_DELTA;

        priceEl.textContent = formatPrice(amount, priceInfo.plus);

        if (priceNote) {
          var notes = [];
          if (washExcluded) notes.push('Exterior wash excluded');
          if (odorAdded) notes.push('Odor removal added');
          priceNote.textContent = notes.join(' · ');
          priceNote.hidden = notes.length === 0;
        }
      }

      vehButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          vehButtons.forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');
          currentVehicle = btn.getAttribute('data-vehicle');
          render();
        });
      });

      if (excludeCheckbox) {
        excludeCheckbox.addEventListener('change', render);
      }
      if (odorCheckbox) {
        odorCheckbox.addEventListener('change', render);
      }

      if (bookBtn) {
        bookBtn.addEventListener('click', function () {
          var bookingSection = document.getElementById('booking');
          var packageSelect = document.getElementById('packageChoice');
          var vehicleSelect = document.getElementById('vehicleType');
          var excludeWashField = document.getElementById('excludeWashField');
          var odorAddOnField = document.getElementById('odorAddOnField');

          if (packageSelect) packageSelect.value = packageKey;
          if (vehicleSelect) vehicleSelect.value = currentVehicle;
          if (excludeWashField) {
            excludeWashField.checked = !!(excludeCheckbox && excludeCheckbox.checked && pkg.excludeWashAllowed);
          }
          if (odorAddOnField) {
            odorAddOnField.checked = !!(odorCheckbox && odorCheckbox.checked);
          }

          if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }

      render();
    });
  }

  function initExcludeWashFieldGuard() {
    // The "exclude exterior wash" option only applies to the Standard package.
    var packageSelect = document.getElementById('packageChoice');
    var excludeWashField = document.getElementById('excludeWashField');
    if (!packageSelect || !excludeWashField) return;

    function sync() {
      var isStandard = packageSelect.value === 'standard';
      excludeWashField.disabled = !isStandard;
      if (!isStandard) excludeWashField.checked = false;
    }

    packageSelect.addEventListener('change', sync);
    sync();
  }

  function buildBookingEmailBody(data) {
    var lines = [
      'New booking request from the Glowline Detailing website:',
      '',
      'CLIENT INFO',
      'Name: ' + data.fullName,
      'Phone: ' + data.phone,
      'Email: ' + data.email,
      '',
      'VEHICLE INFO',
      'Vehicle size: ' + (VEHICLE_LABELS[data.vehicleType] || data.vehicleType),
      'Year/Make/Model: ' + (data.vehicleYMM || '—'),
      'Color: ' + (data.vehicleColor || '—'),
      'Photos selected (attach manually — this fallback email cannot carry them): ' + (data.photoFileNames.length ? data.photoFileNames.join(', ') : '—'),
      '',
      'PACKAGE & SCHEDULE',
      'Package: ' + (data.packageLabel || data.packageChoice),
      'Exclude exterior wash: ' + (data.excludeWash ? 'Yes' : 'No'),
      'Add odor removal treatment (+$50): ' + (data.odorAddOn ? 'Yes' : 'No'),
      'Preferred date: ' + (data.preferredDate || '—'),
      'Preferred time: ' + (data.preferredTime || '—'),
      '',
      'NOTES',
      data.notes || '—'
    ];
    return lines.join('\n');
  }

  function setFormStatus(el, message, kind) {
    if (!el) return;
    el.textContent = message;
    el.className = 'form-status' + (kind ? ' is-' + kind : '');
    el.hidden = !message;
  }

  function collectBookingData(form) {
    var packageSelect = document.getElementById('packageChoice');
    var packageLabelText = packageSelect.options[packageSelect.selectedIndex]
      ? packageSelect.options[packageSelect.selectedIndex].text
      : packageSelect.value;

    return {
      fullName: form.fullName.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      vehicleType: form.vehicleType.value,
      vehicleYMM: form.vehicleYMM.value.trim(),
      vehicleColor: form.vehicleColor.value.trim(),
      photoFileNames: form.vehiclePhotos.files
        ? Array.prototype.map.call(form.vehiclePhotos.files, function (f) { return f.name; })
        : [],
      packageChoice: form.packageChoice.value,
      packageLabel: packageLabelText,
      excludeWash: form.excludeWash.checked,
      odorAddOn: form.odorAddOn.checked,
      preferredDate: form.preferredDate.value,
      preferredTime: form.preferredTime.value,
      notes: form.notes.value.trim()
    };
  }

  function sendViaMailtoFallback(data) {
    var subject = 'Booking Request — ' + data.fullName + ' (' + (data.packageLabel || 'Glowline') + ')';
    var body = buildBookingEmailBody(data);
    var mailtoUrl = 'mailto:' + BOOKING_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
    window.location.href = mailtoUrl;
  }

  function initBookingForm() {
    var form = document.getElementById('bookingForm');
    var statusEl = document.getElementById('formStatus');
    var submitBtn = document.getElementById('bookingSubmitBtn');
    var subjectField = document.getElementById('formSubject');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var requiredFields = form.querySelectorAll('[required]');
      var firstInvalid = null;
      requiredFields.forEach(function (field) {
        if (!field.value) {
          field.setAttribute('aria-invalid', 'true');
          if (!firstInvalid) firstInvalid = field;
        } else {
          field.removeAttribute('aria-invalid');
        }
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      var data = collectBookingData(form);

      if (subjectField) {
        subjectField.value = 'Booking Request — ' + data.fullName + ' (' + (data.packageLabel || 'Glowline') + ')';
      }

      setFormStatus(statusEl, 'Sending your request…', 'pending');
      if (submitBtn) submitBtn.disabled = true;

      var formData = new FormData(form);

      fetch(FORMSPREE_URL, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      }).then(function (response) {
        if (response.ok) {
          setFormStatus(statusEl, "Thanks! Your booking request is in — we'll confirm shortly by phone, text, or email.", 'success');
          form.reset();
          var photoList = document.getElementById('photoFileList');
          if (photoList) { photoList.hidden = true; photoList.textContent = ''; }
          initExcludeWashFieldGuard();
        } else {
          throw new Error('Formspree responded with ' + response.status);
        }
      }).catch(function () {
        setFormStatus(statusEl, "Couldn't reach our booking service — opening your email app instead so your request still goes through.", 'error');
        sendViaMailtoFallback(data);
      }).finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  function initPhotoField() {
    var input = document.getElementById('vehiclePhotos');
    var list = document.getElementById('photoFileList');
    if (!input || !list) return;

    input.addEventListener('change', function () {
      if (!input.files || !input.files.length) {
        list.hidden = true;
        list.textContent = '';
        return;
      }
      var names = Array.prototype.map.call(input.files, function (f) { return f.name; });
      list.textContent = 'Selected: ' + names.join(', ');
      list.hidden = false;
    });
  }

  function initYear() {
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  function initScrollReveal() {
    var elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window) ||
        (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      elements.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    // Stagger siblings within the same grid/parent so cards cascade in
    // instead of popping together.
    var delayCounters = new WeakMap();
    elements.forEach(function (el) {
      var parent = el.parentElement;
      var index = delayCounters.get(parent) || 0;
      el.style.transitionDelay = Math.min(index * 70, 350) + 'ms';
      delayCounters.set(parent, index + 1);
    });

    function onIntersect(entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }

    // Below-the-fold content waits until it's meaningfully scrolled into
    // view. Hero content reveals immediately on load regardless of exact
    // viewport height, so it never gets stuck hidden on short screens.
    var belowFold = new IntersectionObserver(onIntersect, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    var aboveFold = new IntersectionObserver(onIntersect, { threshold: 0 });

    elements.forEach(function (el) {
      var observer = el.closest('.hero') ? aboveFold : belowFold;
      observer.observe(el);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeaderNav();
    initPackageCards();
    initExcludeWashFieldGuard();
    initBookingForm();
    initPhotoField();
    initYear();
    initScrollReveal();
  });
})();
