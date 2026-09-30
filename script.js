// script.js - ATM simulator logic
// Basic client-side ATM simulation with localStorage persistence.

(() => {
  // Element refs
  const authScreen = document.getElementById('auth-screen');
  const pinForm = document.getElementById('pin-form');
  const pinInput = document.getElementById('pin-input');
  const authMsg = document.getElementById('auth-msg');
  const resetBtn = document.getElementById('reset-btn');

  const dashboard = document.getElementById('dashboard');
  const logoutBtn = document.getElementById('logout-btn');
  const balanceEl = document.getElementById('balance');
  const withdrawForm = document.getElementById('withdraw-form');
  const withdrawAmount = document.getElementById('withdraw-amount');
  const depositForm = document.getElementById('deposit-form');
  const depositAmount = document.getElementById('deposit-amount');
  const historyEl = document.getElementById('history');
  const clearHistoryBtn = document.getElementById('clear-history');
  const dashMsg = document.getElementById('dash-msg');
  const changePinForm = document.getElementById('change-pin-form');
  const oldPinInput = document.getElementById('old-pin');
  const newPinInput = document.getElementById('new-pin');

  // Quick action buttons
  document.querySelectorAll('.quick-actions button').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = Number(btn.getAttribute('data-amount')) || 0;
      withdrawAmount.value = amount;
    });
  });

  // Local storage keys and default state
  const LS = {
    PIN: 'atm_pin_v1',
    BAL: 'atm_balance_v1',
    HIST: 'atm_history_v1',
    AUTH: 'atm_auth_v1'
  };

  const defaults = {
    pin: '1234',
    balance: 5000.0,
    history: []
  };

  // Utility helpers
  const readLS = (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  };
  const writeLS = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  // Initialize storage on first run
  function initStorage() {
    if (!localStorage.getItem(LS.PIN)) writeLS(LS.PIN, defaults.pin);
    if (!localStorage.getItem(LS.BAL)) writeLS(LS.BAL, defaults.balance);
    if (!localStorage.getItem(LS.HIST)) writeLS(LS.HIST, defaults.history);
    if (!localStorage.getItem(LS.AUTH)) writeLS(LS.AUTH, false);
  }

  // Render functions
  function renderBalance() {
    const bal = Number(readLS(LS.BAL, defaults.balance));
    balanceEl.textContent = `₹${bal.toFixed(2)}`;
  }

  function renderHistory() {
    const hist = readLS(LS.HIST, []);
    historyEl.innerHTML = '';
    if (!hist.length) {
      historyEl.innerHTML = '<div class="empty">No transactions yet.</div>';
      return;
    }
    hist.slice().reverse().forEach(tx => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.textContent = `${tx.time} — ${tx.type.toUpperCase()}: ₹${tx.amount.toFixed(2)}${tx.note ? ' — ' + tx.note : ''}`;
      historyEl.appendChild(div);
    });
  }

  function showDashboard() {
    authScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    dashboard.setAttribute('aria-hidden', 'false');
    renderBalance();
    renderHistory();
    dashMsg.textContent = '';
  }

  function showAuth() {
    authScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
    dashboard.setAttribute('aria-hidden', 'true');
    pinInput.value = '';
    authMsg.textContent = '';
    pinInput.focus();
  }

  // Authentication
  pinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = (pinInput.value || '').trim();
    const stored = readLS(LS.PIN, defaults.pin);
    if (!entered) { authMsg.textContent = 'Enter PIN'; return; }
    if (entered === stored) {
      writeLS(LS.AUTH, true);
      showDashboard();
    } else {
      authMsg.textContent = 'Incorrect PIN';
      pinInput.value = '';
    }
  });

  logoutBtn.addEventListener('click', () => {
    writeLS(LS.AUTH, false);
    showAuth();
  });

  resetBtn.addEventListener('click', () => {
    if (!confirm('Reset app to default state? This clears balance and history.')) return;
    localStorage.removeItem(LS.PIN);
    localStorage.removeItem(LS.BAL);
    localStorage.removeItem(LS.HIST);
    initStorage();
    showAuth();
    alert('App reset to default. Default PIN is 1234 and balance is ₹5000.');
  });

  // Transaction helpers
  function addHistory(type, amount, note = '') {
    const hist = readLS(LS.HIST, []);
    hist.push({ type, amount: Number(amount), time: new Date().toLocaleString(), note });
    writeLS(LS.HIST, hist);
  }

  depositForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amt = Number(depositAmount.value);
    if (!amt || amt <= 0) {
      dashMsg.textContent = 'Enter a valid deposit amount';
      return;
    }
    let bal = Number(readLS(LS.BAL, defaults.balance));
    bal += amt;
    writeLS(LS.BAL, bal);
    addHistory('deposit', amt);
    renderBalance();
    renderHistory();
    depositAmount.value = '';
    dashMsg.style.color = '';
    dashMsg.textContent = `Deposited ₹${amt.toFixed(2)} successfully`;
    setTimeout(()=> dashMsg.textContent = '', 3500);
  });

  withdrawForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amt = Number(withdrawAmount.value);
    if (!amt || amt <= 0) {
      dashMsg.textContent = 'Enter a valid withdrawal amount';
      return;
    }
    let bal = Number(readLS(LS.BAL, defaults.balance));
    if (amt > bal) {
      dashMsg.textContent = 'Insufficient balance';
      return;
    }
    bal -= amt;
    writeLS(LS.BAL, bal);
    addHistory('withdraw', amt);
    renderBalance();
    renderHistory();
    withdrawAmount.value = '';
    dashMsg.textContent = `Withdrew ₹${amt.toFixed(2)} successfully`;
    setTimeout(()=> dashMsg.textContent = '', 3500);
  });

  clearHistoryBtn.addEventListener('click', () => {
    if (!confirm('Clear all transaction history?')) return;
    writeLS(LS.HIST, []);
    renderHistory();
  });

  // Change PIN
  changePinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const oldPin = (oldPinInput.value || '').trim();
    const newPin = (newPinInput.value || '').trim();
    const storedPin = readLS(LS.PIN, defaults.pin);
    if (!oldPin || !newPin) {
      dashMsg.textContent = 'Provide both current and new PIN';
      return;
    }
    if (oldPin !== storedPin) {
      dashMsg.textContent = 'Current PIN is incorrect';
      return;
    }
    if (!/^\d{4,6}$/.test(newPin)) {
      dashMsg.textContent = 'New PIN must be 4-6 digits';
      return;
    }
    writeLS(LS.PIN, newPin);
    oldPinInput.value = '';
    newPinInput.value = '';
    dashMsg.style.color = 'green';
    dashMsg.textContent = 'PIN changed successfully';
    setTimeout(()=> { dashMsg.textContent = ''; dashMsg.style.color = ''; }, 3000);
  });

  // Auto-login if already authenticated (optional)
  function boot() {
    initStorage();
    const authed = readLS(LS.AUTH, false);
    if (authed) showDashboard();
    else showAuth();
  }

  boot();
})();