document.addEventListener('DOMContentLoaded', () => {
  let count = 0, thrown = 0, lastClickTime = Date.now();
  let throwUnlocked = false, exploreUnlocked = false, exploreActivated = false;

  const $ = id => document.getElementById(id);

  const updateDisplay = () => {
    $('cabbageCount').textContent = `Cabbage: ${count}`;
    $('thrownCount').textContent = `Thrown: ${thrown}`;
    $('cabbageLimit').style.display = count >= 175 ? 'inline-block' : 'none';
  };

  $('clicker').addEventListener('click', () => {
    const now = Date.now();
    if (now - lastClickTime < 50) {
      count = 0;
      $('warning').textContent = 'Auto-clicker detected! Cabbage reset.';
    } else if (count < 200) {
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

  const generateNoise = len => Array.from({ length: len }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
  ).join('');

  $('exportButton').addEventListener('click', () => {
    const save = btoa(JSON.stringify({ count, thrown, throwUnlocked, exploreUnlocked, exploreActivated }));
    $('exportText').textContent = generateNoise(10) + save + generateNoise(10);
  });

  $('importButton').addEventListener('click', () => {
    try {
      const raw = $('importArea').value.trim();
      const decoded = atob(raw.slice(10, -10));
      const data = JSON.parse(decoded);

      count = Math.min(data.count || 0, 200);
      thrown = data.thrown || 0;
      throwUnlocked = !!data.throwUnlocked;
      exploreUnlocked = !!data.exploreUnlocked;
      exploreActivated = !!data.exploreActivated;

      updateDisplay();
      $('throwSection').style.display = throwUnlocked ? 'flex' : 'none';
      $('exploreSection').style.display = exploreUnlocked ? 'flex' : 'none';
      $('exploreInterface').style.display = exploreActivated ? 'block' : 'none';
      lastClickTime = Date.now();
    } catch {
      alert('Invalid save string.');
    }
  });

  const regionDescription = $('regionDescription');
  const regionButtons = document.querySelectorAll('#regionList button');

  regionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const region = btn.dataset.region;
      let desc = '';
      if (region === 'sprout') {
        desc = count >= 200
          ? 'Sprout Valley: Gentle hills where cabbages first sprouted.'
          : 'Locked. Requires 200 cabbages.';
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
});

