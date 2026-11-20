
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const userInput = document.getElementById('username');
    const passInput = document.getElementById('password');
    const userError = document.getElementById('username-error');
    const passError = document.getElementById('password-error');
    const toggle = document.getElementById('pwToggle');
    if (!form) return;
  
    const NEXT_PAGE = 'resident_page.html';
    const MIN_PASSWORD = 6;
  
    function setError(input, box, text) {
      box.textContent = text;
      input.classList.toggle('is-invalid', text !== '');
      input.setAttribute('aria-invalid', text !== '' ? 'true' : 'false');
    }
  

    function checkUser() {
      const value = userInput.value.trim();
      let error = '';
  
      if (value === '') {
        error = 'Введіть нік або електронну адресу';
      } else if (value.includes('@') && !value.startsWith('@')) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) error = 'Введіть коректну пошту';
      } else {
        const nick = value.replace(/^@/, '');
        if (nick.length < 3) error = 'Нік — щонайменше 3 символи';
        else if (nick.length > 30) error = 'Нік — не більше 30 символів';
        else if (!/^[\p{L}\d._]+$/u.test(nick)) error = 'Лише літери, цифри, «.» та «_»';
      }
  
      setError(userInput, userError, error);
      return error === '';
    }
  
    function checkPassword() {
      let error = '';
      if (passInput.value === '') error = 'Введіть пароль';
      else if (passInput.value.length < MIN_PASSWORD) error = 'Пароль — щонайменше ' + MIN_PASSWORD + ' символів';
  
      setError(passInput, passError, error);
      return error === '';
    }
  

    userInput.addEventListener('input', () => { if (userInput.classList.contains('is-invalid')) checkUser(); });
    passInput.addEventListener('input', () => { if (passInput.classList.contains('is-invalid')) checkPassword(); });
  

    toggle.addEventListener('click', () => {
      const show = passInput.type === 'password';
      passInput.type = show ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', show ? 'true' : 'false');
      toggle.setAttribute('aria-label', show ? 'Сховати пароль' : 'Показати пароль');
      passInput.focus();
    });
  
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const userOk = checkUser();
      const passOk = checkPassword();
  
      if (!userOk) { userInput.focus(); return; }
      if (!passOk) { passInput.focus(); return; }
  
      window.location.href = NEXT_PAGE;
    });
  });
