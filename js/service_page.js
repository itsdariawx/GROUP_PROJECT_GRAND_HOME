document.addEventListener('DOMContentLoaded', () => {

  const tabs = document.querySelectorAll('input[name="service-type"]');
  const debtInput = document.getElementById('debt');
  const amountInput = document.getElementById('amount');
  const payCardRadio = document.getElementById('pay-card');
  const cardNumberInput = document.getElementById('card-number');
  const cardDateInput = document.getElementById('card-date');
  const cvvInputs = document.querySelectorAll('.cvv-box');
  const payButton = document.querySelector('.btn-pay-submit');
  const payLoader = document.getElementById('pay-loader');

  const PAYMENT_DELAY = 1800;

  const MAX_CARD_YEARS = 10;
  let isProcessing = false;

  const START_DEBTS = [100, 245, 180];
  const STORAGE_KEY = 'grandhome-debts';

  function loadDebts() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length === START_DEBTS.length) {

        if (saved.every((debt) => debt === 0)) {
          return START_DEBTS.slice();
        }
        return saved;
      }
    } catch (error) {

    }
    return START_DEBTS.slice();
  }

  function saveDebts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(debts));
    } catch (error) {

    }
  }

  const debts = loadDebts();

  const HISTORY_KEY = 'grandhome-payments';
  const MAX_HISTORY = 100;

  function saveHistory(entry) {
    try {
      const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      list.unshift(entry);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
    } catch (error) {

    }
  }

  function currentTabIndex() {
    return Array.from(tabs).findIndex((tab) => tab.checked);
  }

  debtInput.addEventListener('focus', () => debtInput.blur());

  function showDebt() {
    const debt = debts[currentTabIndex()];
    debtInput.value = debt;
    if (debt > 0 && Number(amountInput.value) > debt) {
      amountInput.value = debt;
    }
  }

  showDebt();

  function showError(box, text) {
    box.classList.add('is-invalid');

    const group = box.closest('.info-group');
    let message = group.querySelector('.error-message');

    if (!message) {
      message = document.createElement('span');
      message.className = 'error-message';
      group.appendChild(message);
    }

    message.textContent = text;
    placeMessage(box, message);
  }

  function placeMessage(box, message) {
    message.style.left = box.offsetLeft + 'px';
    message.style.top = box.offsetTop + box.offsetHeight + 6 + 'px';
  }

  window.addEventListener('resize', () => {
    document.querySelectorAll('.is-invalid').forEach((box) => {
      const message = box.closest('.info-group').querySelector('.error-message');
      if (message) {
        placeMessage(box, message);
      }
    });
  });

  function clearError(box) {
    box.classList.remove('is-invalid');

    const message = box.closest('.info-group').querySelector('.error-message');
    if (message) {
      message.remove();
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('change', () => {
      showDebt();

      if (amountInput.parentElement.classList.contains('is-invalid')) {
        checkAmount();
      }
    });
  });

  function checkAmount() {
    const box = amountInput.parentElement;
    const value = amountInput.value.trim();
    const amount = Number(value);

    const debt = debts[currentTabIndex()];

    if (debt === 0) {
      showError(box, 'Заборгованості немає');
      return false;
    }

    if (value === '') {
      showError(box, 'Введіть суму');
      return false;
    }

    if (!(amount > 0)) {
      showError(box, 'Сума має бути більшою за 0');
      return false;
    }

    if (amount > debt) {
      showError(box, 'Не більше ніж ' + debt + ' грн');
      return false;
    }

    clearError(box);
    return true;
  }

  amountInput.addEventListener('input', () => {

    if (amountInput.parentElement.classList.contains('is-invalid')) {
      checkAmount();
    }
  });

  cardNumberInput.addEventListener('input', () => {
    const digits = cardNumberInput.value.replace(/\D/g, '').slice(0, 16);

    cardNumberInput.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');

    if (cardNumberInput.parentElement.classList.contains('is-invalid')) {
      checkCardNumber();
    }
  });

  function checkCardNumber() {
    const box = cardNumberInput.parentElement;
    const digits = cardNumberInput.value.replace(/\D/g, '');

    if (digits.length !== 16) {
      showError(box, 'Номер картки — 16 цифр');
      return false;
    }

    clearError(box);
    return true;
  }

  cardDateInput.addEventListener('input', (event) => {
    let digits = cardDateInput.value.replace(/\D/g, '').slice(0, 4);

    if (digits.length >= 3 || (digits.length === 2 && event.inputType !== 'deleteContentBackward')) {
      digits = digits.slice(0, 2) + '/' + digits.slice(2);
    }

    cardDateInput.value = digits;

    if (cardDateInput.parentElement.classList.contains('is-invalid')) {
      checkCardDate();
    }
  });

  cardDateInput.addEventListener('blur', () => {
    if (cardDateInput.value !== '') {
      checkCardDate();
    }
  });

  function checkCardDate() {
    const box = cardDateInput.parentElement;
    const match = cardDateInput.value.match(/^(\d{2})\/(\d{2})$/);

    if (!match) {
      showError(box, 'Формат ММ/РР');
      return false;
    }

    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);

    if (month < 1 || month > 12) {
      showError(box, 'Місяць від 01 до 12');
      return false;
    }

    const now = new Date();

    if (year < now.getFullYear()) {
      showError(box, 'Термін дії минув');
      return false;
    }

    if (year > now.getFullYear() + MAX_CARD_YEARS) {
      showError(box, 'Некоректний рік');
      return false;
    }

    const expired = year < now.getFullYear() ||
      (year === now.getFullYear() && month < now.getMonth() + 1);

    if (expired) {
      showError(box, 'Термін дії минув');
      return false;
    }

    clearError(box);
    return true;
  }

  const cvvBox = document.querySelector('.cvv-boxes');

  cvvInputs.forEach((input, index) => {

    input.addEventListener('focus', () => input.select());
    input.addEventListener('click', () => input.select());

    input.addEventListener('input', () => {

      const digit = input.value.replace(/\D/g, '').slice(0, 1);

      input.dataset.digit = digit;
      input.value = digit ? '*' : '';

      if (digit && index < cvvInputs.length - 1) {
        cvvInputs[index + 1].focus();
      }

      if (cvvBox.classList.contains('is-invalid')) {
        checkCvv();
      }
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !input.value && index > 0) {
        cvvInputs[index - 1].focus();
      }
    });
  });

  function checkCvv() {
    const filled = Array.from(cvvInputs).every((input) => /^\d$/.test(input.dataset.digit || ''));

    if (!filled) {
      showError(cvvBox, 'Введіть 3 цифри');
      return false;
    }

    clearError(cvvBox);
    return true;
  }

  document.querySelectorAll('input[name="pay-method"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!payCardRadio.checked) {
        clearError(cardNumberInput.parentElement);
        clearError(cardDateInput.parentElement);
        clearError(cvvBox);
      }
    });
  });

  function showLoader() {
    payLoader.classList.add('is-visible');
    payLoader.setAttribute('aria-hidden', 'false');
  }

  function hideLoader() {
    payLoader.classList.remove('is-visible');
    payLoader.setAttribute('aria-hidden', 'true');
    isProcessing = false;
  }

  if (payLoader) {
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        hideLoader();
      }
    });
  }

  payButton.addEventListener('click', (event) => {

    if (isProcessing) {
      event.preventDefault();
      return;
    }

    let isValid = checkAmount();

    if (payCardRadio.checked) {

      const numberOk = checkCardNumber();
      const dateOk = checkCardDate();
      const cvvOk = checkCvv();
      isValid = isValid && numberOk && dateOk && cvvOk;
    }

    if (!isValid) {
      event.preventDefault();
      return;
    }

    const index = currentTabIndex();
    const before = debts[index];
    const paid = Number(amountInput.value);
    const left = before - paid;
    debts[index] = Math.round(left * 100) / 100;
    saveDebts();
    saveHistory({
      service: tabs[index].parentElement.querySelector('.tab-text').textContent,
      before: before,
      paid: paid,
      after: debts[index],
      method: payCardRadio.checked ? 'card' : 'paypal',
      date: new Date().toISOString()
    });

    if (!payLoader) {
      return;
    }

    event.preventDefault();
    isProcessing = true;
    showLoader();

    setTimeout(() => {
      window.location.href = payButton.getAttribute('href');
    }, PAYMENT_DELAY);
  });
});
