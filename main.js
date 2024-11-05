import './style.css'

const symbols = [
  { icon: '7️⃣', weight: 1, name: 'seven', payout: 100 },
  { icon: '💎', weight: 2, name: 'diamond', payout: 50 },
  { icon: '🔔', weight: 3, name: 'bell', payout: 25 },
  { icon: '🍒', weight: 4, name: 'cherry', payout: 10 },
  { icon: '🍋', weight: 5, name: 'lemon', payout: 5 }
];

let isSpinning = false;
let credits = 100;

function getWeightedSymbol() {
  const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const symbol of symbols) {
    random -= symbol.weight;
    if (random <= 0) return symbol;
  }
  return symbols[0];
}

function createSlotStrip() {
  return [...symbols, ...symbols, ...symbols]
    .map(symbol => `<div class="slot-item" data-symbol="${symbol.name}">${symbol.icon}</div>`)
    .join('');
}

function createPaytable() {
  return symbols
    .map(symbol => `
      <div class="payline">
        <span>${symbol.icon} ${symbol.icon} ${symbol.icon}</span>
        <span>${symbol.payout}x</span>
      </div>
    `)
    .join('');
}

function createSlotMachine() {
  document.querySelector('#app').innerHTML = `
    <div class="slot-machine">
      <div class="machine-top">
        <h1>🎰 Lucky Slots 🎰</h1>
        <div class="credits">Credits: <span id="creditDisplay">${credits}</span></div>
      </div>
      
      <div class="game-container">
        <div class="light-strip"></div>
        <div class="slots">
          ${Array(3).fill().map(() => `
            <div class="slot-container">
              <div class="slot-strip">
                ${createSlotStrip()}
              </div>
              <div class="slot-overlay"></div>
            </div>
          `).join('')}
        </div>
        <div class="light-strip"></div>
      </div>

      <button id="spinButton" class="spin-button">
        <span class="button-text">SPIN (1 Credit)</span>
        <span class="button-glare"></span>
      </button>
      
      <div id="result" class="result"></div>

      <div class="paytable">
        <h2>Paytable</h2>
        ${createPaytable()}
      </div>
    </div>
  `;

  const lightStrips = document.querySelectorAll('.light-strip');
  lightStrips.forEach(strip => {
    for (let i = 0; i < 10; i++) {
      const light = document.createElement('div');
      light.className = 'light';
      strip.appendChild(light);
    }
  });
}

function updateCredits() {
  document.getElementById('creditDisplay').textContent = credits;
  const spinButton = document.getElementById('spinButton');
  spinButton.disabled = credits < 1;
}

function animateSlot(strip, finalSymbol, delay, duration) {
  return new Promise(resolve => {
    const symbolHeight = 60; // Updated to match new slot height
    const totalSymbols = symbols.length * 3;
    const finalIndex = symbols.findIndex(s => s.name === finalSymbol.name) + symbols.length;
    const finalPosition = -(finalIndex * symbolHeight);

    setTimeout(() => {
      strip.style.transition = `transform ${duration * 0.3}ms cubic-bezier(0.17, 0.67, 0.83, 0.67)`;
      strip.style.transform = `translateY(${-(totalSymbols * symbolHeight * 0.5)}px)`;

      setTimeout(() => {
        strip.style.transition = `transform ${duration * 0.4}ms linear`;
        strip.style.transform = `translateY(${-(totalSymbols * symbolHeight * 1.5)}px)`;

        setTimeout(() => {
          strip.style.transition = `transform ${duration * 0.3}ms cubic-bezier(0.17, 0.67, 0.83, 0.67)`;
          strip.style.transform = `translateY(${finalPosition}px)`;
          
          setTimeout(resolve, duration * 0.3);
        }, duration * 0.4);
      }, duration * 0.3);
    }, delay);
  });
}

function animateLights(isWin) {
  const lights = document.querySelectorAll('.light');
  lights.forEach((light, i) => {
    light.style.animation = isWin ? 
      `winPulse 0.5s ${i * 0.1}s infinite` : 
      `spin 2s ${i * 0.2}s infinite`;
  });
}

function stopLightAnimation() {
  const lights = document.querySelectorAll('.light');
  lights.forEach(light => {
    light.style.animation = '';
  });
}

function calculateWin(results) {
  if (results[0].name === results[1].name && results[1].name === results[2].name) {
    return results[0].payout;
  }
  
  const cherryCount = results.filter(r => r.name === 'cherry').length;
  if (cherryCount === 3) {
    return 2;
  }
  
  return 0;
}

async function spin() {
  if (isSpinning || credits < 1) return;
  
  isSpinning = true;
  credits--;
  updateCredits();
  
  const spinButton = document.getElementById('spinButton');
  spinButton.disabled = true;
  document.getElementById('result').textContent = '';
  
  animateLights(false);
  
  const strips = document.querySelectorAll('.slot-strip');
  const results = [getWeightedSymbol(), getWeightedSymbol(), getWeightedSymbol()];
  
  await Promise.all([
    animateSlot(strips[0], results[0], 0, 2000),
    animateSlot(strips[1], results[1], 250, 2250),
    animateSlot(strips[2], results[2], 500, 2500)
  ]);
  
  const multiplier = calculateWin(results);
  const resultElement = document.getElementById('result');
  
  if (multiplier > 0) {
    const winAmount = multiplier;
    credits += winAmount;
    updateCredits();
    resultElement.textContent = `🎉 WIN ${winAmount} CREDITS! 🎉`;
    resultElement.className = 'result win';
    animateLights(true);
  } else {
    resultElement.textContent = 'Try Again!';
    resultElement.className = 'result lose';
    stopLightAnimation();
  }
  
  spinButton.disabled = credits < 1;
  isSpinning = false;
}

createSlotMachine();
document.getElementById('spinButton').addEventListener('click', spin);