/* ─── Family Finance Tracker — Main JS ─── */

document.addEventListener('DOMContentLoaded', function () {
  // ─── Auto-dismiss alerts after 5 seconds ────────────────────
  document.querySelectorAll('.alert-dismissible').forEach(function (alert) {
    setTimeout(function () {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      bsAlert.close();
    }, 5000);
  });

  // ─── Dark Mode Toggle ───────────────────────────────────────
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('ff-theme') || 'light';

  // Apply saved theme on load
  html.setAttribute('data-bs-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const current = html.getAttribute('data-bs-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-bs-theme', next);
      localStorage.setItem('ff-theme', next);
      updateThemeIcon(next);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggle) return;
    const icon = themeToggle.querySelector('i');
    if (icon) {
      icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    }
  }

  // ─── Animated Number Counters ─────────────────────────────
  document.querySelectorAll('[data-count-to]').forEach(function (el) {
    const target = parseFloat(el.dataset.countTo) || 0;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals) || 0;
    const duration = 800;
    const startTime = performance.now();

    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = target * easeOut(progress);
      el.textContent =
        prefix +
        current.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) +
        suffix;
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  });

  // ─── Keyboard shortcuts ───────────────────────────────────
  document.addEventListener('keydown', function (e) {
    // 'n' to open quick-add / new transaction modal (when not in an input)
    if (e.key === 'n' && !isTyping(e)) {
      e.preventDefault();
      const modal =
        document.getElementById('addTransactionModal') ||
        document.getElementById('quickAddCollapse');
      if (modal) {
        const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
        bsModal.show();
      }
      // Focus amount field in quick add
      const amountField = document.querySelector('#id_amount, [name="amount"]');
      if (amountField) {
        setTimeout(() => amountField.focus(), 300);
      }
    }

    // '/' to focus search
    if (e.key === '/' && !isTyping(e)) {
      e.preventDefault();
      const search = document.querySelector('[name="q"]');
      if (search) search.focus();
    }
  });

  function isTyping(e) {
    const tag = e.target.tagName.toLowerCase();
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      e.target.isContentEditable
    );
  }

  // ─── Smooth progress bar animations on scroll ─────────────
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.width =
            entry.target.dataset.width || entry.target.style.width;
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );

  document.querySelectorAll('.progress-bar').forEach(function (bar) {
    const width = bar.style.width;
    bar.dataset.width = width;
    bar.style.width = '0%';
    observer.observe(bar);
  });

  // ─── Confirm delete with nicer UX ─────────────────────────
  document
    .querySelectorAll('form[onsubmit*="confirm"]')
    .forEach(function (form) {
      form.removeAttribute('onsubmit');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (
          confirm(
            'Are you sure you want to delete this? This cannot be undone.',
          )
        ) {
          form.submit();
        }
      });
    });

  // ─── Auto-select expense type in quick add ────────────────
  const descField = document.querySelector(
    '.quick-add-card [name="description"]',
  );
  const typeField = document.querySelector(
    '.quick-add-card [name="transaction_type"]',
  );
  if (descField && typeField) {
    const incomeKeywords = [
      'salary',
      'wage',
      'pay',
      'bonus',
      'transfer in',
      'refund',
      'dividend',
    ];
    descField.addEventListener('input', function () {
      const val = descField.value.toLowerCase();
      const isIncome = incomeKeywords.some((kw) => val.includes(kw));
      typeField.value = isIncome ? 'income' : 'expense';
    });
  }
});
