

document.addEventListener('DOMContentLoaded', () => {
  const nameEl = document.getElementById('profile-name');
  const nickInput = document.getElementById('nick');
  const emailInput = document.getElementById('email');
  const addressInput = document.getElementById('address');
  const addressHint = document.getElementById('address-hint');
  const editBtn = document.getElementById('edit-btn');
  const backBtn = document.getElementById('back-btn');

  const STORAGE_KEY = 'grandhome-profile';
  const EDIT_TEXT = 'Редагувати';
  const SAVE_TEXT = 'Зберегти';
  const BACK_TEXT = 'Повернутися назад';
  const CANCEL_TEXT = 'Скасувати';


  const editableInputs = [nickInput, emailInput];

  let isEditing = false;
  let saved = loadProfile();



  function defaultProfile() {
    return {
      name: nameEl.textContent.trim(),
      nick: nickInput.value,
      email: emailInput.value,
    };
  }

  function loadProfile() {
    const profile = defaultProfile();
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (stored && typeof stored === 'object') {
        ['name', 'nick', 'email'].forEach((key) => {
          if (typeof stored[key] === 'string' && stored[key].trim() !== '') {
            profile[key] = stored[key];
          }
        });
      }
    } catch (error) {

    }
    return profile;
  }

  function saveProfile() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (error) {

    }
  }

  function showProfile(profile) {
    nameEl.textContent = profile.name;
    nickInput.value = profile.nick;
    emailInput.value = profile.email;
  }


  const lockedAddress = addressInput.value;
  addressInput.readOnly = true;

  showProfile(saved);



  function showError(field, text) {
    clearError(field);
    field.classList.add('is-invalid');

    const message = document.createElement('p');
    message.className = 'field-error';
    message.dataset.for = field.id || 'profile-name';
    message.textContent = text;

    if (field === nameEl) {
      nameEl.after(message);
    } else {
      field.after(message);
    }
  }

  function clearError(field) {
    field.classList.remove('is-invalid');
    const id = field.id || 'profile-name';
    document.querySelectorAll('.field-error').forEach((message) => {
      if (message.dataset.for === id) {
        message.remove();
      }
    });
  }

  function clearAllErrors() {
    [nameEl, nickInput, emailInput].forEach(clearError);
  }



  function normalizeNick(value) {
    const nick = value.trim().replace(/^@+/, '');
    return '@' + nick;
  }

  function checkName() {
    const value = nameEl.textContent.replace(/\s+/g, ' ').trim();

    if (value === '') {
      showError(nameEl, 'Введіть ім’я та прізвище');
      return false;
    }

    if (value.length > 40) {
      showError(nameEl, 'Не більше 40 символів');
      return false;
    }

    clearError(nameEl);
    return true;
  }

  function checkNick() {
    const nick = normalizeNick(nickInput.value);

    if (nick.length < 4) {
      showError(nickInput, 'Нік — щонайменше 3 символи');
      return false;
    }

    if (nick.length > 30) {
      showError(nickInput, 'Нік — не більше 30 символів');
      return false;
    }

    if (!/^@[\p{L}\d._]+$/u.test(nick)) {
      showError(nickInput, 'Лише літери, цифри, «.» та «_»');
      return false;
    }

    clearError(nickInput);
    return true;
  }

  function checkEmail() {
    const email = emailInput.value.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      showError(emailInput, 'Введіть коректну пошту');
      return false;
    }

    clearError(emailInput);
    return true;
  }



  function startEditing() {
    isEditing = true;

    nameEl.contentEditable = 'plaintext-only';

    if (nameEl.contentEditable !== 'plaintext-only') {
      nameEl.contentEditable = 'true';
    }
    nameEl.setAttribute('role', 'textbox');
    nameEl.setAttribute('aria-label', 'Ім’я та прізвище');
    nameEl.classList.add('is-editing');

    editableInputs.forEach((input) => {
      input.readOnly = false;
      input.classList.add('is-editing');
    });

    addressInput.classList.add('is-locked');
    addressHint.hidden = false;

    editBtn.textContent = SAVE_TEXT;
    backBtn.textContent = CANCEL_TEXT;
    backBtn.classList.add('is-cancel');

    nickInput.focus();
  }

  function stopEditing() {
    isEditing = false;

    nameEl.removeAttribute('contenteditable');
    nameEl.removeAttribute('role');
    nameEl.removeAttribute('aria-label');
    nameEl.classList.remove('is-editing');

    editableInputs.forEach((input) => {
      input.readOnly = true;
      input.classList.remove('is-editing');
    });

    addressInput.classList.remove('is-locked');
    addressInput.value = lockedAddress;
    addressHint.hidden = true;

    editBtn.textContent = EDIT_TEXT;
    backBtn.textContent = BACK_TEXT;
    backBtn.classList.remove('is-cancel');

    clearAllErrors();
  }

  function cancelEditing() {
    showProfile(saved);
    stopEditing();
  }

  function saveEditing() {

    const nameOk = checkName();
    const nickOk = checkNick();
    const emailOk = checkEmail();

    if (!(nameOk && nickOk && emailOk)) {
      return;
    }

    saved = {
      name: nameEl.textContent.replace(/\s+/g, ' ').trim(),
      nick: normalizeNick(nickInput.value),
      email: emailInput.value.trim(),
    };
    saveProfile();
    showProfile(saved);
    stopEditing();
  }



  editBtn.addEventListener('click', () => {
    if (isEditing) {
      saveEditing();
    } else {
      startEditing();
    }
  });


  backBtn.addEventListener('click', (event) => {
    if (isEditing) {
      event.preventDefault();
      cancelEditing();
    }
  });


  nameEl.addEventListener('keydown', (event) => {
    if (!isEditing) {
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      saveEditing();
    }
  });

  nameEl.addEventListener('paste', (event) => {
    if (!isEditing) {
      return;
    }
    event.preventDefault();
    const text = (event.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, text.replace(/\s+/g, ' '));
  });

  nameEl.addEventListener('input', () => {
    if (nameEl.classList.contains('is-invalid')) {
      checkName();
    }
  });

  nickInput.addEventListener('input', () => {
    if (nickInput.classList.contains('is-invalid')) {
      checkNick();
    }
  });

  emailInput.addEventListener('input', () => {
    if (emailInput.classList.contains('is-invalid')) {
      checkEmail();
    }
  });

  [nickInput, emailInput].forEach((input) => {
    input.addEventListener('keydown', (event) => {
      if (isEditing && event.key === 'Enter') {
        event.preventDefault();
        saveEditing();
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (isEditing && event.key === 'Escape') {
      cancelEditing();
    }
  });


  addressInput.addEventListener('input', () => {
    addressInput.value = lockedAddress;
  });
});
