document.addEventListener('DOMContentLoaded', () => {
  let count = 0;
  let thrown = 0;
  let whackScore = 0;
  let cabbageLimit = 200;
  let limitUpgradeBought = false;
  let lastClickTime = Date.now();
  let throwUnlocked = false;
  let exploreUnlocked = false;
  let exploreActivated = false;
  let whackGameActive = false;
  let moleTimer;

  const $ = id => document.getElementById(id);

  const updateDisplay = () => {
    $('cabbageCount').textContent = `Cabbage: ${count}`;
    $('thrownCount').textContent = `Thrown: ${thrown}`;
    $('whackScore').textContent = `Score: ${whackScore}`;
    $('cabbageLimit').textContent = `Limit: ${cabbageLimit}`;
    $('cabbageLimit').style.display = count >= cabbageLimit - 25 ? 'inline-block' : 'none';
  };

  $('clicker').addEventListener('click', () => {
    const now = Date.now();
    if (now - lastClickTime < 50) {
      count = 0;
      $('warning').textContent = 'Auto-clicker detected! Cabbage reset.';
    } else if (count < cabbageLimit) {
      count++;
      $('warning').textContent = '';
    } else {
      $('warning').textContent = 'Cabbage limit reached.';
    }
    lastClickTime = now;
    updateDisplay();

    if (!throwUnlocked && count >= 50) {
      throwUnlocked = true;
      $('throwSection').style.display = 'flex';
    }
    if (!exploreUnlocked && count >= 100) {
      exploreUnlocked = true;
      $('exploreSection').style.display = 'flex';
    }
  });

  $('throwButton').addEventListener('click', () => {
    const amount = parseInt($('throwAmount').value, 10);
    if (amount > 0 && amount <= count) {
      count -= amount;
      thrown += amount;
      updateDisplay();
    }
  });

  $('exploreButton').addEventListener('click', () => {
    if (count >= 150 && !exploreActivated) {
      count -= 150;
      exploreActivated = true;
      updateDisplay();
      $('exploreInterface').style.display = 'block';
    }
  });

  $('optionsButton').addEventListener('click', () => {
    $('exploreInterface').style.display = 'none';
    $('optionsPanel').style.display = 'block';
    $('optionsButton').style.display = 'none';
    $('backButton').style.display = 'inline-block';
  });

  $('backButton').addEventListener('click', () => {
    $('optionsPanel').style.display = 'none';
    $('exploreInterface').style.display = exploreActivated ? 'block' : 'none';
    $('backButton').style.display = 'none';
    $('optionsButton').style.display = 'inline-block';
  });

  $('buyLimitUpgrade').addEventListener('click', () => {
    if (limitUpgradeBought) return;
    if (whackScore >= 50) {
      whackScore -= 50;
      cabbageLimit = 300;
      limitUpgradeBought = true;
      $('limitUpgradeCost').textContent = 'Already bought';
      updateDisplay();
    } else {
      $('warning').textContent = 'Not enough score for limit upgrade.';
    }
  });

  const generateNoise = len => Array.from({ length: len }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
  ).join('');

  $('exportButton').addEventListener('click', () => {
    const save = btoa(JSON.stringify({
      count,
      thrown,
      whackScore,
      cabbageLimit,
      limitUpgradeBought,
      throwUnlocked,
      exploreUnlocked,
      exploreActivated
    }));
    $('exportText').textContent = generateNoise(10) + save + generateNoise(10);
  });

  $('importButton').addEventListener('click', () => {
    try {
      const raw = $('importArea').value.trim();
      const decoded = atob(raw.slice(10, -10));
      const data = JSON.parse(decoded);

      count = Math.min(data.count || 0, data.cabbageLimit || 200);
      thrown = data.thrown || 0;
      whackScore = data.whackScore || 0;
      cabbageLimit = data.cabbageLimit || 200;
      limitUpgradeBought = !!data.limitUpgradeBought;
      throwUnlocked = !!data.throwUnlocked;
      exploreUnlocked = !!data.exploreUnlocked;
      exploreActivated = !!data.exploreActivated;

      $('throwSection').style.display = throwUnlocked ? 'flex' : 'none';
      $('exploreSection').style.display = exploreUnlocked ? 'flex' : 'none';
      $('exploreInterface').style.display = exploreActivated ? 'block' : 'none';
      $('limitUpgradeCost').textContent = limitUpgradeBought ? 'Already bought' : 'Cost: 50 score';
      lastClickTime = Date.now();
      updateDisplay();
    } catch {
      alert('Invalid save string.');
    }
  });

  function startWhackGame() {
    if (whackGameActive) return;
    whackGameActive = true;

    const grid = $('grid');
    const scoreDisplay = $('whackScore');
    const game = $('whackGame');
    game.style.display = 'block';
    grid.innerHTML = '';
    scoreDisplay.textContent = `Score: ${whackScore}`;

    for (let i = 0; i < 9; i++) {
      const hole = document.createElement('div');
      hole.className = 'mole-hole';
      hole.dataset.index = i;
      grid.appendChild(hole);
    }

    function popMole() {
      const holes = document.querySelectorAll('.mole-hole');
      holes.forEach(h => h.innerHTML = '');

      const index = Math.floor(Math.random() * 9);
      const mole = document.createElement('div');
      mole.className = 'mole';
      holes[index].appendChild(mole);

      mole.onclick = () => {
        whackScore++;
        updateDisplay();
        mole.remove();
      };
    }

    moleTimer = setInterval(popMole, 800);
  }

  const regionDescription = $('regionDescription');
  const regionButtons = document.querySelectorAll('#regionList button');

  regionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const region = btn.dataset.region;
      let desc = '';

      // Hide all region-specific features first
      $('whackGame').style.display = 'none';
      $('limitUpgrade').style.display = 'none';

      if (region === 'sprout') {
        if (count >= 200) {
          desc = 'Sprout Valley: Gentle hills where cabbages first sprouted.';
          $('whackGame').style.display = 'block';
          if (!limitUpgradeBought) {
            $('limitUpgrade').style.display = 'flex';
          }
          startWhackGame();
        } else {
          desc = 'Locked. Requires 200 cabbages.';
        }
      } else if (region === 'leafy') {
        desc = count >= 300
          ? 'Leafy Lake: A shimmering lake with floating cabbage pads.'
          : 'Locked. Requires 300 cabbages.';
      } else if (region === 'crunch') {
        desc = count >= 500
          ? 'Crunch Caverns: Underground tunnels echoing with crunchy echoes.'
          : 'Locked. Requires 500 cabbages.';
      }

      regionDescription.textContent = desc;
    });
  });

  updateDisplay();
});
