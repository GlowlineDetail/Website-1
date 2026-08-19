(function () {
  'use strict';

  var BOOKING_EMAIL = 'glowlinedetail@gmail.com';

  var VEHICLE_LABELS = {
    sedan: 'Sedan',
    suv: 'SUV / Truck',
    thirdrow: '3rd Row'
  };

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
      var bookBtn = card.querySelector('[data-book-package]');
      var currentVehicle = 'sedan';

      function render() {
        var priceInfo = pkg.prices[currentVehicle];
        var amount = priceInfo.amount;
        if (excludeCheckbox && excludeCheckbox.checked && pkg.excludeWashAllowed) {
          amount += pkg.excludeWashDelta;
        }
        priceEl.textContent = formatPrice(amount, priceInfo.plus);
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

      if (bookBtn) {
        bookBtn.addEventListener('click', function () {
          var bookingSection = document.getElementById('booking');
          var packageSelect = document.getElementById('packageChoice');
          var vehicleSelect = document.getElementById('vehicleType');
          var excludeWashField = document.getElementById('excludeWashField');

          if (packageSelect) packageSelect.value = packageKey;
          if (vehicleSelect) vehicleSelect.value = currentVehicle;
          if (excludeWashField) {
            excludeWashField.checked = !!(excludeCheckbox && excludeCheckbox.checked && pkg.excludeWashAllowed);
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
      '',
      'PACKAGE & SCHEDULE',
      'Package: ' + (data.packageLabel || data.packageChoice),
      'Exclude exterior wash: ' + (data.excludeWash ? 'Yes' : 'No'),
      'Preferred date: ' + (data.preferredDate || '—'),
      'Preferred time: ' + (data.preferredTime || '—'),
      '',
      'NOTES',
      data.notes || '—'
    ];
    return lines.join('\n');
  }

  function initBookingForm() {
    var form = document.getElementById('bookingForm');
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

      var packageSelect = document.getElementById('packageChoice');
      var packageLabelText = packageSelect.options[packageSelect.selectedIndex]
        ? packageSelect.options[packageSelect.selectedIndex].text
        : packageSelect.value;

      var data = {
        fullName: form.fullName.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        vehicleType: form.vehicleType.value,
        vehicleYMM: form.vehicleYMM.value.trim(),
        vehicleColor: form.vehicleColor.value.trim(),
        packageChoice: form.packageChoice.value,
        packageLabel: packageLabelText,
        excludeWash: form.excludeWash.checked,
        preferredDate: form.preferredDate.value,
        preferredTime: form.preferredTime.value,
        notes: form.notes.value.trim()
      };

      var subject = 'Booking Request — ' + data.fullName + ' (' + (data.packageLabel || 'Glowline') + ')';
      var body = buildBookingEmailBody(data);

      var mailtoUrl = 'mailto:' + BOOKING_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      window.location.href = mailtoUrl;
    });
  }

  function initYear() {
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeaderNav();
    initPackageCards();
    initExcludeWashFieldGuard();
    initBookingForm();
    initYear();
  });
})();
