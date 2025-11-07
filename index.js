document.addEventListener('DOMContentLoaded', () => {
  let count = 0;
  let thrown = 0;
  let whackScore = 0;
  let cabbageLimit = 200;
  let limitUpgradeBought = false;
  let leafyLimitUpgradeBought = false;
  let lastClickTime = Date.now();
  let throwUnlocked = false;
  let exploreUnlocked = false;
  let exploreActivated = false;
  let whackGameActive = false;
  let moleTimer;
  let carnivalGameActive = false;
  let carnivalScore = 0;
  let carnivalInterval;
  
  // Region unlock tracking
  let sproutValleyUnlocked = false;
  let leafyLakeUnlocked = false;
  let crunchCavernsUnlocked = false;
  
  // Mining game variables
  let crystalCount = 0;
  let selectedTool = 'pickaxe';
  let miningGrid = [];
  let miningGameActive = false;

  // Visit Town / Parkour variables
  let visitTownUnlocked = false;
  let parkourActive = false;
  let parkourCompleted = false;
  let currentLocation = 'home'; // 'home' or 'town'
  let parkourLoopId = null;
  let parkourState = {
    canvas: null,
    ctx: null,
    player: null,
    keys: {},
    platforms: [],
    levelWidth: 1600,
    cameraX: 0,
    portalX: 1500
  };

  // parkour particle and entering flag
  let parkourEntering = false;

  // New for fishing minigame
  let fishingGameActive = false;
  let cabbishCount = 0;
  let fishingInterval;
  let movingLinePos = 0;
  let movingLineDirection = 1;
  let targetStart = 50; // px from left
  let targetWidth = 60; // px

  const $ = id => document.getElementById(id);

  const updateDisplay = () => {
    $('cabbageCount').textContent = `Cabbage: ${count}`;
    $('thrownCount').textContent = `Thrown: ${thrown}`;
    $('whackScore').textContent = `Mole Cabbage: ${whackScore}`;
    $('cabbageLimit').textContent = `Limit: ${cabbageLimit}`;
    $('cabbageLimit').style.display = count >= cabbageLimit - 25 ? 'inline-block' : 'none';
    $('cabbishCount').textContent = `Cabbish: ${cabbishCount}`;
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
      
      // Show bonus button when 500 cabbages are thrown (only at home)
      if (thrown >= 500 && currentLocation === 'home' && $('bonusButton').style.display === 'none') {
        $('bonusButton').style.display = 'block';
      }
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
    // Show appropriate panel depending on current location
    if (currentLocation === 'home') {
      $('exploreInterface').style.display = exploreActivated ? 'block' : 'none';
    } else {
      $('townPanel').style.display = 'block';
    }
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
      $('warning').textContent = 'Not enough Mole Cabbage for limit upgrade.';
    }
  });

  $('buyLeafyLimitUpgrade').addEventListener('click', () => {
    if (leafyLimitUpgradeBought) return;
    if (cabbishCount >= 50) {
      cabbishCount -= 50;
      cabbageLimit = 500;
      leafyLimitUpgradeBought = true;
      $('leafyLimitUpgradeCost').textContent = 'Already bought';
      updateDisplay();
    } else {
      $('warning').textContent = 'Not enough Cabbish for limit upgrade.';
    }
  });

  const generateNoise = len => Array.from({ length: len }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join('');

  $('exportButton').addEventListener('click', () => {
    // Serialize mining grid in a compact form
    const miningGridSave = miningGrid && miningGrid.length ? miningGrid.map(row => row.map(cell => ({ revealed: !!cell.revealed, hasCrystal: !!cell.hasCrystal, health: cell.health || 0 }))) : null;

    const save = btoa(JSON.stringify({ 
      count, thrown, whackScore, cabbageLimit, limitUpgradeBought, 
      leafyLimitUpgradeBought, throwUnlocked, exploreUnlocked, 
      exploreActivated, cabbishCount, crystalCount, carnivalScore,
      bonusUnlocked: thrown >= 500,
      // Region unlock states
      sproutValleyUnlocked,
      leafyLakeUnlocked,
      crunchCavernsUnlocked,
      // Visit town / location
      visitTownUnlocked,
      currentLocation,
      // Parkour state
      parkourActive,
      parkourPlayer: parkourState.player ? { x: parkourState.player.x, y: parkourState.player.y, vy: parkourState.player.vy, onGround: !!parkourState.player.onGround } : null,
      parkourCamera: parkourState.cameraX || 0,
      // Mining grid
      miningGrid: miningGridSave
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
      leafyLimitUpgradeBought = !!data.leafyLimitUpgradeBought;
      throwUnlocked = !!data.throwUnlocked;
      exploreUnlocked = !!data.exploreUnlocked;
      exploreActivated = !!data.exploreActivated;
      cabbishCount = data.cabbishCount || 0;
      crystalCount = data.crystalCount || 0;
      carnivalScore = data.carnivalScore || 0;

      // Load region unlock states
      sproutValleyUnlocked = !!data.sproutValleyUnlocked;
      leafyLakeUnlocked = !!data.leafyLakeUnlocked;
      crunchCavernsUnlocked = !!data.crunchCavernsUnlocked;

      // Load visit town / location
      visitTownUnlocked = !!data.visitTownUnlocked;
      currentLocation = data.currentLocation || 'home';

        // restore parkour player and parkourActive state
        if (data.parkourPlayer) {
          parkourState.player = Object.assign({ w:24, h:30, vy:0, onGround:false }, data.parkourPlayer);
        }
        parkourActive = !!data.parkourActive;
        // restore camera
        parkourState.cameraX = data.parkourCamera || 0;

      // Load mining grid if present
      if (data.miningGrid) {
        try { loadMiningGrid(data.miningGrid); } catch { generateMiningGrid(); }
      } else {
        generateMiningGrid();
      }

      // Update UI based on loaded location
      if (currentLocation === 'town') {
        $('topNav').style.display = 'block';
        $('townPanel').style.display = 'block';
        $('exploreInterface').style.display = 'none';
        if ($('bonusButton')) $('bonusButton').style.display = 'none';
      } else {
        $('topNav').style.display = 'none';
        $('townPanel').style.display = 'none';
        $('exploreInterface').style.display = exploreActivated ? 'block' : 'none';
        if ($('bonusButton')) $('bonusButton').style.display = (thrown >= 500) ? 'block' : 'none';
      }

      $('carnivalScore').textContent = `Targets Hit: ${carnivalScore}`;
      $('throwSection').style.display = throwUnlocked ? 'flex' : 'none';
      $('exploreSection').style.display = exploreUnlocked ? 'flex' : 'none';
      $('limitUpgradeCost').textContent = limitUpgradeBought ? 'Already bought' : 'Cost: 50 Mole Cabbage';
      updateMiningDisplay();
      lastClickTime = Date.now();
      updateDisplay();
      // If the save indicated parkour was active at home, restore it
      if (parkourActive && currentLocation === 'home') {
        const pc = $('parkourContainer');
        if (pc) pc.style.display = 'block';
        startParkour();
      }
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
    scoreDisplay.textContent = `Mole Cabbage: ${whackScore}`;

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
      $('fishingGame').style.display = 'none';
      $('leafyLimitUpgrade').style.display = 'none';
      $('miningGame').style.display = 'none';

      if (region === 'sprout') {
        // Check if region should be unlocked
        if (count >= 200) {
          sproutValleyUnlocked = true;
        }
        
        if (sproutValleyUnlocked) {
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
        // Check if region should be unlocked
        if (count >= 300) {
          leafyLakeUnlocked = true;
        }
        
        if (leafyLakeUnlocked) {
          desc = 'Leafy Lake: A shimmering lake with floating cabbage pads.';
          $('fishingGame').style.display = 'block';
          if (!fishingGameActive) {
            startFishingGame();
          }
          if (!leafyLimitUpgradeBought) {
            $('leafyLimitUpgrade').style.display = 'flex';
          }
        } else {
          desc = 'Locked. Requires 300 cabbages.';
        }
      } else if (region === 'crunch') {
        // Check if region should be unlocked
        if (count >= 500) {
          crunchCavernsUnlocked = true;
        }
        
        if (crunchCavernsUnlocked) {
          desc = 'Crunch Caverns: Underground tunnels echoing with crunchy echoes.';
          $('miningGame').style.display = 'block';
          if (!miningGameActive) {
            startMiningGame();
          }
        } else {
          desc = 'Locked. Requires 500 cabbages.';
        }
      }

      regionDescription.textContent = desc;
    });
  });

  function startFishingGame() {
    if (fishingGameActive) return;
    fishingGameActive = true;

    const bar = $('fishingBar');
    const target = $('targetArea');
    const line = $('movingLine');
    const castButton = $('castButton');

    // Initialize target area randomly within bar width
    const barWidth = bar.clientWidth;
    targetStart = Math.floor(Math.random() * (barWidth - targetWidth));
    target.style.left = targetStart + 'px';
    target.style.width = targetWidth + 'px';

    movingLinePos = 0;
    movingLineDirection = 1;
    line.style.left = movingLinePos + 'px';

    if (fishingInterval) clearInterval(fishingInterval);

    fishingInterval = setInterval(() => {
      movingLinePos += movingLineDirection * 5;
      if (movingLinePos <= 0 || movingLinePos >= barWidth) {
        movingLineDirection *= -1;
      }
      line.style.left = movingLinePos + 'px';
    }, 20);

    castButton.onclick = () => {
      // Check if moving line is within target area
      if (movingLinePos >= targetStart && movingLinePos <= targetStart + targetWidth) {
        cabbishCount++;
        updateDisplay();

        // Move target area randomly
        targetStart = Math.floor(Math.random() * (barWidth - targetWidth));
        target.style.left = targetStart + 'px';
      }
    };
  }

  function updateMiningDisplay() {
    if (!$('crystalCount')) return;
    $('crystalCount').textContent = crystalCount;
    
    const tools = document.querySelectorAll('.mining-tool');
    tools.forEach(tool => {
      tool.classList.toggle('selected', tool.dataset.tool === selectedTool);
    });
    // Update Visit Town visibility if crystals changed
    updateVisitTownVisibility();
  }

  function generateMiningGrid() {
    const grid = $('miningGrid');
    grid.innerHTML = '';
    miningGrid = [];

    // Create empty 8x8 grid
    for (let i = 0; i < 8; i++) {
      miningGrid[i] = [];
      for (let j = 0; j < 8; j++) {
        const cell = document.createElement('div');
        cell.className = 'mining-cell';
        cell.dataset.row = i;
        cell.dataset.col = j;
        
        miningGrid[i][j] = {
          revealed: false,
          hasCrystal: false,
          health: 2
        };

        cell.addEventListener('click', () => mineTile(i, j));
        grid.appendChild(cell);
      }
    }

    // Place 2-3 crystal cabbages randomly
    const numCrystals = Math.floor(Math.random() * 2) + 2; // 2 or 3
    for (let i = 0; i < numCrystals; i++) {
      placeCrystalRandomly();
    }
  }

  function loadMiningGrid(serialized) {
    const grid = $('miningGrid');
    grid.innerHTML = '';
    miningGrid = [];
    for (let i = 0; i < 8; i++) {
      miningGrid[i] = [];
      for (let j = 0; j < 8; j++) {
        const cellData = (serialized && serialized[i] && serialized[i][j]) ? serialized[i][j] : { revealed: false, hasCrystal: false, health: 2 };
        const cell = document.createElement('div');
        cell.className = 'mining-cell' + (cellData.revealed ? ' revealed' : '');
        cell.dataset.row = i;
        cell.dataset.col = j;

        miningGrid[i][j] = {
          revealed: !!cellData.revealed,
          hasCrystal: !!cellData.hasCrystal,
          health: cellData.health || (cellData.hasCrystal ? 3 : 2)
        };

        if (miningGrid[i][j].revealed && miningGrid[i][j].hasCrystal) {
          cell.classList.add('gem');
          cell.textContent = '💎';
        }

        cell.addEventListener('click', () => mineTile(i, j));
        grid.appendChild(cell);
      }
    }
    updateMiningDisplay();
  }

  function placeCrystalRandomly() {
    let placed = false;
    while (!placed) {
      const row = Math.floor(Math.random() * 8);
      const col = Math.floor(Math.random() * 8);
      if (!miningGrid[row][col].hasCrystal && !miningGrid[row][col].revealed) {
        miningGrid[row][col].hasCrystal = true;
        miningGrid[row][col].health = 3;
        placed = true;
      }
    }
  }

  function startMiningGame() {
    if (miningGameActive) return;
    miningGameActive = true;

    generateMiningGrid();

    // Tool selection and refresh button
    const tools = document.querySelectorAll('.mining-tool');
    tools.forEach(tool => {
      if (tool.id === 'refreshMining') {
        tool.addEventListener('click', generateMiningGrid);
      } else {
        tool.addEventListener('click', () => {
          selectedTool = tool.dataset.tool;
          tools.forEach(t => t.classList.toggle('selected', t === tool));
        });
      }
    });

    updateMiningDisplay();
  }

  function mineTile(row, col) {
    if (!miningGrid[row][col] || miningGrid[row][col].revealed) return;

    const tile = miningGrid[row][col];
    const cell = document.querySelector(`.mining-cell[data-row="${row}"][data-col="${col}"]`);

    tile.health--;
    if (tile.health <= 0) {
      revealTile(row, col, tile, cell);
    } else {
      cell.style.backgroundColor = `rgb(${119 + (3 - tile.health) * 20}, ${119 + (3 - tile.health) * 20}, ${119 + (3 - tile.health) * 20})`;
    }

    updateMiningDisplay();
  }

  function revealTile(row, col, tile, cell) {
    tile.revealed = true;
    cell.classList.add('revealed');
    
    if (tile.hasCrystal) {
      cell.classList.add('gem');
      cell.textContent = '💎';
      crystalCount++;
      
      // Remove the crystal from this location
      tile.hasCrystal = false;
      
      // Place a new crystal in a random location
      placeCrystalRandomly();

    }
    // Update mining display and Visit Town visibility
    updateMiningDisplay();
    updateVisitTownVisibility();
  }

  // Visit Town / Parkour helpers
  function updateVisitTownVisibility() {
    // Unlock Visit Town when player has 5 or more crystal cabbages
    if (!visitTownUnlocked && crystalCount >= 5) visitTownUnlocked = true;
  const container = $('visitTownContainer');
  // hide Visit Town if parkour already completed
  if (container) container.style.display = (visitTownUnlocked && !parkourCompleted) ? 'block' : 'none';
    // Bonus only shows at home
    if (currentLocation !== 'home') {
      if ($('bonusButton')) $('bonusButton').style.display = 'none';
    } else {
      if ($('bonusButton')) $('bonusButton').style.display = (thrown >= 500) ? 'block' : 'none';
    }

    // Hide main action UI when in Town
    if (currentLocation === 'town') {
      if ($('clicker')) $('clicker').style.display = 'none';
      if ($('throwSection')) $('throwSection').style.display = 'none';
      if ($('exploreSection')) $('exploreSection').style.display = 'none';
    } else {
      // show on home / other locations
      if ($('clicker')) $('clicker').style.display = 'inline-block';
      if ($('throwSection')) $('throwSection').style.display = 'flex';
      if ($('exploreSection')) $('exploreSection').style.display = 'flex';
    }

    // Top nav should only be visible after parkour has been completed
    if ($('topNav')) {
      $('topNav').style.display = (parkourCompleted && (currentLocation === 'home' || currentLocation === 'town')) ? 'flex' : 'none';
    }
  }

  // Parkour / simple side-scroller implementation
  function startParkour() {
    if (parkourActive) return;
    parkourActive = true;
    const canvas = $('parkourCanvas');
    if (!canvas) return;
    parkourState.canvas = canvas;
    parkourState.ctx = canvas.getContext('2d');
    // init player (preserve position if already set from save)
    if (!parkourState.player) {
      parkourState.player = { x:50, y:140, w:24, h:30, vy:0, onGround:false };
    } else {
      // ensure dimensions exist
      parkourState.player.w = parkourState.player.w || 24;
      parkourState.player.h = parkourState.player.h || 30;
      parkourState.player.vy = parkourState.player.vy || 0;
      parkourState.player.onGround = !!parkourState.player.onGround;
    }
    // only initialize camera if not restored from a save
    if (typeof parkourState.cameraX === 'undefined' || parkourState.cameraX === null) {
      parkourState.cameraX = 0;
    }
    parkourState.particles = [];
    parkourEntering = false;
    // more interesting platforms: multiple segments, some moving, create gaps and elevated platforms
    parkourState.platforms = [
      {x:0,y:180,w:300,h:40},
      {x:380,y:180,w:200,h:40},
      {x:620,y:140,w:120,h:40},
      {x:780,y:180,w:200,h:40, moving: {min:780, max:980, vx:1.6}},
      {x:940,y:140,w:160,h:40, moving: {min:940, max:1160, vx:1.0}},
      {x:1140,y:160,w:120,h:40},
      {x:1320,y:180,w:180,h:40},
      {x:1560,y:180,w:200,h:40}
    ];
    parkourState.portalX = parkourState.levelWidth - 120;
    // spikes placed in gaps
    parkourState.spikes = [
      {x:320,y:200,w:20,h:20},
      {x:600,y:200,w:20,h:20},
      {x:920,y:200,w:20,h:20},
      {x:1600,y:200,w:20,h:20}
    ];

    function keyDown(e){ parkourState.keys[e.code]=true; }
    function keyUp(e){ parkourState.keys[e.code]=false; }
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    parkourState._keyDown = keyDown; parkourState._keyUp = keyUp;

    function loop(){
      const ctx = parkourState.ctx;
      const p = parkourState.player;
      // physics
      if (parkourState.keys['ArrowLeft']) p.x -= 4;
      if (parkourState.keys['ArrowRight']) p.x += 4;
      if ((parkourState.keys['Space'] || parkourState.keys['ArrowUp']) && p.onGround) { p.vy = -10; p.onGround=false; }
      const gravity = 0.7;
      p.vy += gravity; p.y += p.vy;

      // platform collision: check all platforms and land on top when falling onto them
      p.onGround = false;
      for (let pi = 0; pi < parkourState.platforms.length; pi++) {
        const plat = parkourState.platforms[pi];
        // if player is horizontally overlapping this platform
        if (p.x + p.w > plat.x && p.x < plat.x + plat.w) {
          // if player's feet are below or touching platform top and previous frame was above (landing)
          if (p.y + p.h >= plat.y && (p.y + p.h - p.vy) <= plat.y + 2 && p.vy >= 0) {
            p.y = plat.y - p.h;
            p.vy = 0;
            p.onGround = true;
            // if platform is moving, carry the player a bit
            if (plat.moving) p.x += plat.moving.vx;
          }
        }
      }

      // clamp
      if (p.x < 0) p.x = 0;
      if (p.x > parkourState.levelWidth - p.w) p.x = parkourState.levelWidth - p.w;

      // camera
      parkourState.cameraX = Math.max(0, Math.min(parkourState.levelWidth - canvas.width, p.x - 120));

      // draw
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#87CEEB'; ctx.fillRect(0,0,canvas.width,canvas.height);
      // draw platforms
      ctx.fillStyle = '#654321';
      for (let pi = 0; pi < parkourState.platforms.length; pi++) {
        const plat = parkourState.platforms[pi];
        // update moving platforms
        if (plat.moving) {
          plat.x += plat.moving.vx;
          if (plat.x < plat.moving.min || plat.x + plat.w > plat.moving.max) {
            plat.moving.vx *= -1; // reverse
            plat.x += plat.moving.vx * 2;
          }
        }
        ctx.fillRect(plat.x - parkourState.cameraX, plat.y, plat.w, plat.h);
        // platform edge highlight
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(plat.x - parkourState.cameraX, plat.y, plat.w, 6);
        ctx.fillStyle = '#654321';
      }
      const g = parkourState.platforms[0];
      // draw portal (procedural sprite: glowing ring + inner swirl)
      const portalXScreen = parkourState.portalX - parkourState.cameraX;
      const t = Date.now() / 250;
      const baseR = 18;
      const pulse = baseR + Math.sin(t) * 3;
      ctx.save();
      ctx.translate(portalXScreen + 20, g.y - 20);
      // outer glow
      const grad = ctx.createRadialGradient(0,0,pulse*0.2, 0,0,pulse*1.2);
      grad.addColorStop(0, 'rgba(255,230,180,0.95)');
      grad.addColorStop(0.5, 'rgba(160,220,120,0.8)');
      grad.addColorStop(1, 'rgba(80,140,60,0.15)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.ellipse(0,0,pulse*1.1,pulse*0.7,0,0,Math.PI*2); ctx.fill();
      // ring
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,80,30,0.9)';
      ctx.beginPath(); ctx.ellipse(0,0,baseR,baseR*0.6,0,0,Math.PI*2); ctx.stroke();
      // inner swirl lines
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      for (let a = 0; a < 6; a++) {
        ctx.beginPath();
        const ang = a * (Math.PI*2/6) + (t % (Math.PI*2)) * 0.3;
        ctx.moveTo(Math.cos(ang)*6, Math.sin(ang)*3);
        ctx.lineTo(Math.cos(ang+0.8)*12, Math.sin(ang+0.8)*6);
        ctx.stroke();
      }
      // center core
      const core = ctx.createRadialGradient(0,0,0,0,0,6);
      core.addColorStop(0, 'rgba(255,255,220,1)');
      core.addColorStop(1, 'rgba(200,240,180,0.0)');
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill();
      ctx.restore();

      // draw portal particle effects and spikes
      if (parkourState.particles && parkourState.particles.length) {
        for (let i = parkourState.particles.length - 1; i >= 0; i--) {
          const part = parkourState.particles[i];
          part.vy += 0.12;
          part.x += part.vx;
          part.y += part.vy;
          part.life -= 1;
          ctx.globalAlpha = Math.max(0, part.life / part.maxLife);
          ctx.fillStyle = part.color;
          ctx.fillRect(part.x - parkourState.cameraX, part.y, part.size, part.size);
          ctx.globalAlpha = 1;
          if (part.life <= 0) parkourState.particles.splice(i,1);
        }
      }
      // draw spikes
      if (parkourState.spikes) {
        for (const s of parkourState.spikes) {
          const sx = s.x - parkourState.cameraX;
          ctx.fillStyle = '#333';
          ctx.beginPath();
          ctx.moveTo(sx, s.y + s.h);
          ctx.lineTo(sx + s.w/2, s.y);
          ctx.lineTo(sx + s.w, s.y + s.h);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#fff'; ctx.fillRect(sx + 2, s.y + s.h - 4, s.w - 4, 2);
        }
      }
  // draw player (simple sprite: body + helmet)
  const px = p.x - parkourState.cameraX;
  ctx.fillStyle = '#c33'; ctx.fillRect(px, p.y, p.w, p.h);
  ctx.fillStyle = '#ffdddd'; ctx.fillRect(px, p.y, p.w, 6);

      // check spike collisions
      if (parkourState.spikes) {
        for (const s of parkourState.spikes) {
          if (p.x + p.w > s.x && p.x < s.x + s.w && p.y + p.h > s.y) {
            // hit spike: respawn
            p.x = 50; p.y = 140; p.vy = 0; p.onGround = false;
            parkourState.cameraX = 0;
            parkourState.particles && spawnPortalParticles(6);
          }
        }
      }

      // check portal collision
      if (!parkourEntering && p.x + p.w >= parkourState.portalX && p.y + p.h >= g.y - 40) {
        // entered portal
        parkourEntering = true;
        spawnPortalParticles(60);
        // show portal message and after short delay finish and enter town
        $('portalMsg').style.display = 'block';
        setTimeout(() => {
          $('portalMsg').style.display = 'none';
          // stop parkour and transition
          stopParkour();
            currentLocation = 'town';
            // mark parkour as completed so it cannot be replayed and top nav can appear
            parkourCompleted = true;
            updateVisitTownVisibility();
          $('townPanel').style.display = 'block';
          $('exploreInterface').style.display = 'none';
          if ($('bonusButton')) $('bonusButton').style.display = 'none';
        }, 700);
        // allow loop to continue a bit so particles render
      }

      parkourLoopId = requestAnimationFrame(loop);
    }

    loop();
  }

  function stopParkour() {
    parkourActive = false;
    if (parkourLoopId) cancelAnimationFrame(parkourLoopId);
    if (parkourState._keyDown) { window.removeEventListener('keydown', parkourState._keyDown); window.removeEventListener('keyup', parkourState._keyUp); }
    parkourState.canvas && parkourState.ctx && parkourState.ctx.clearRect(0,0,parkourState.canvas.width,parkourState.canvas.height);
  }

  function spawnPortalParticles(count) {
    if (!parkourState.particles) parkourState.particles = [];
    const baseX = parkourState.portalX;
    const baseY = parkourState.platforms[0].y - 20;
    for (let i = 0; i < count; i++) {
      parkourState.particles.push({
        x: baseX + 20 + (Math.random()-0.5) * 40,
        y: baseY + (Math.random()-0.5) * 20,
        vx: (Math.random()-0.5) * 6,
        vy: (Math.random()-1.5) * 6,
        life: 40 + Math.floor(Math.random()*40),
        maxLife: 40 + Math.floor(Math.random()*40),
        size: 4 + Math.random()*6,
        color: ['#ffd700','#ff7f50','#90EE90'][Math.floor(Math.random()*3)]
      });
    }
  }

  function enterTown() {
    // legacy: direct enterTown is no-op because portal collision is handled inside the loop with particles
    // Keep for backward compatibility: if called directly, perform a quick transition
    spawnPortalParticles(40);
    $('portalMsg').style.display = 'block';
    setTimeout(() => {
      $('portalMsg').style.display = 'none';
      stopParkour();
      currentLocation = 'town';
      parkourCompleted = true;
      updateVisitTownVisibility();
      $('townPanel').style.display = 'block';
      $('exploreInterface').style.display = 'none';
      if ($('bonusButton')) $('bonusButton').style.display = 'none';
    }, 700);
  }

  function goHome() {
    currentLocation = 'home';
    $('townPanel').style.display = 'none';
    updateVisitTownVisibility();
    $('exploreInterface').style.display = exploreActivated ? 'block' : 'none';
    // show bonus if unlocked (updateVisitTownVisibility will also handle this)
    if ($('bonusButton')) $('bonusButton').style.display = (thrown >= 500) ? 'block' : 'none';
  }

  // wire Visit Town button
  const visitBtn = $('visitTownButton');
  if (visitBtn) {
    visitBtn.addEventListener('click', () => {
      if (parkourCompleted) {
        if ($('warning')) $('warning').textContent = 'Parkour already completed.';
        return;
      }
      const pc = $('parkourContainer');
      if (!pc) return;
      const showing = pc.style.display === 'block';
      pc.style.display = showing ? 'none' : 'block';
      if (!showing) startParkour(); else stopParkour();
    });
  }

  // top nav handlers
  const homeTop = $('homeTopBtn');
  const townTop = $('townTopBtn');
  if (homeTop) homeTop.addEventListener('click', goHome);
  if (townTop) townTop.addEventListener('click', () => { $('townPanel').style.display = 'block'; currentLocation = 'town'; });

  // ensure VisitTown visibility on load
  updateVisitTownVisibility();

  // Carnival Game Logic
  $('bonusButton').addEventListener('click', () => {
    const isBonus = $('bonusButton').textContent === 'Bonus';
    $('bonusButton').textContent = isBonus ? 'Back' : 'Bonus';
    $('exploreInterface').style.display = isBonus ? 'none' : 'block';
    $('carnivalGame').style.display = isBonus ? 'block' : 'none';

    if (isBonus) {
      startCarnivalGame();
    } else {
      stopCarnivalGame();
    }
  });

  function startCarnivalGame() {
    if (carnivalGameActive) return;
    carnivalGameActive = true;
    carnivalScore = 0;
    $('carnivalScore').textContent = 'Targets Hit: 0';

    // Click handler for throwing cabbages
    const gameArea = $('carnivalGame');
    gameArea.addEventListener('click', throwCabbageAt);

    function spawnCabbage() {
      const shelf = ['topShelf', 'middleShelf', 'bottomShelf'][Math.floor(Math.random() * 3)];
      const cabbage = document.createElement('div');
      cabbage.className = 'carnival-cabbage';
      
      // Random position on shelf
      const position = Math.random() * (600 - 40); // container width - cabbage width
      cabbage.style.left = position + 'px';
      
      $(shelf).appendChild(cabbage);

      // Remove after 1.5 seconds if not clicked
      setTimeout(() => {
        if (cabbage.parentNode) {
          cabbage.remove();
        }
      }, 1500);

      cabbage.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent throwing cabbage when clicking target
        carnivalScore++;
        $('carnivalScore').textContent = `Targets Hit: ${carnivalScore}`;
        cabbage.remove();
      });
    }

    // Spawn cabbages every 0.8 seconds
    carnivalInterval = setInterval(spawnCabbage, 800);
  }

  function stopCarnivalGame() {
    if (!carnivalGameActive) return;
    carnivalGameActive = false;
    clearInterval(carnivalInterval);
    
    // Clean up any remaining cabbages
    document.querySelectorAll('.carnival-cabbage').forEach(c => c.remove());
    
    // Remove click handler
    $('carnivalGame').removeEventListener('click', throwCabbageAt);
  }

  function throwCabbageAt(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const throwCabbage = document.createElement('div');
    throwCabbage.className = 'cabbage-throw';
    throwCabbage.style.left = x + 'px';
    throwCabbage.style.top = y + 'px';

    event.currentTarget.appendChild(throwCabbage);

    // Remove the thrown cabbage after animation
    setTimeout(() => throwCabbage.remove(), 500);
  }

  updateDisplay();
});
