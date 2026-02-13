window.addEventListener("load", function () {
    let minerals = 0;
    let totalMined = 0;
    let clickValue = 1;
    let totalUpgrades = 0;
    let autoClickInterval = null;
    let autoClickSpeed = 0;
    let clickUpgrades = [
        {
            id: "pickaxe",
            name: "Better Pickaxe",
            desc: "+1 per click",
            baseCost: 15,
            costMultiplier: 1.4,
            bonus: 1,
            owned: 0
        },
        {
            id: "laser",
            name: "Laser Drill",
            desc: "+5 per click",
            baseCost: 75,
            costMultiplier: 1.5,
            bonus: 5,
            owned: 0
        },
        {
            id: "plasma",
            name: "Plasma Cutter",
            desc: "+25 per click",
            baseCost: 500,
            costMultiplier: 1.6,
            bonus: 25,
            owned: 0
        }
    ];
    let autoUpgrade = {
        id: "drone",
        name: "Mining Drone",
        desc: "Auto-mines minerals",
        baseCost: 100,
        costMultiplier: 1.8,
        owned: 0,
        speeds: [3000, 2400, 1800, 1300, 900, 600, 400, 250, 150, 100]
    };
    let rewards = [
        {
            id: "first100",
            name: "First Steps",
            icon: "\u2B50",
            description: "Collect 100 minerals total",
            check: function () { return totalMined >= 100; },
            earned: false
        },
        {
            id: "first1000",
            name: "Getting Rich",
            icon: "\uD83D\uDCA0",
            description: "Collect 1,000 minerals total",
            check: function () { return totalMined >= 1000; },
            earned: false
        },
        {
            id: "first10000",
            name: "Space Tycoon",
            icon: "\uD83D\uDE80",
            description: "Collect 10,000 minerals total",
            check: function () { return totalMined >= 10000; },
            earned: false
        },
        {
            id: "firstUpgrade",
            name: "First Upgrade",
            icon: "\uD83D\uDD27",
            description: "Purchase your first upgrade",
            check: function () { return totalUpgrades >= 1; },
            earned: false
        },
        {
            id: "firstDrone",
            name: "Automation",
            icon: "\u2699\uFE0F",
            description: "Purchase your first Mining Drone",
            check: function () { return autoUpgrade.owned >= 1; },
            earned: false
        },
        {
            id: "tenUpgrades",
            name: "Fully Loaded",
            icon: "\uD83C\uDFC6",
            description: "Own 10 total upgrades",
            check: function () { return totalUpgrades >= 10; },
            earned: false
        },
        {
            id: "fiveDrones",
            name: "Speed Demon",
            icon: "\u26A1",
            description: "Purchase 5 Mining Drone upgrades",
            check: function () { return autoUpgrade.owned >= 5; },
            earned: false
        }
    ];
    let milestones = [100, 1000, 10000, 100000, 1000000];
    let mineralCountEl = document.getElementById("mineral-count");
    let clickValueEl = document.getElementById("click-value");
    let totalMinedEl = document.getElementById("total-mined");
    let upgradesOwnedEl = document.getElementById("upgrades-owned");
    let progressBar = document.getElementById("progress-bar");
    let progressLabel = document.getElementById("progress-label");
    let mineBtn = document.getElementById("mine-btn");
    let upgradeListClick = document.getElementById("upgrade-list-click");
    let upgradeListAuto = document.getElementById("upgrade-list-auto");
    let rewardsList = document.getElementById("rewards-list");
    let congratsBanner = document.getElementById("congrats-banner");
    let congratsMessage = document.getElementById("congrats-message");
    let helpBtn = document.getElementById("help-btn");
    let helpModal = document.getElementById("help-modal");
    let closeHelp = document.getElementById("close-help");
    let clickArea = document.querySelector(".click-area");
    function getUpgradeCost(upgrade) {
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
    }
    function formatNumber(n) {
        return n.toLocaleString();
    }
    function getNextMilestone() {
        for (let i = 0; i < milestones.length; i++) {
            if (totalMined < milestones[i]) {
                return milestones[i];
            }
        }
        return milestones[milestones.length - 1];
    }
    function getPrevMilestone() {
        for (let i = 0; i < milestones.length; i++) {
            if (totalMined < milestones[i]) {
                return i === 0 ? 0 : milestones[i - 1];
            }
        }
        return milestones[milestones.length - 2];
    }
    function renderScoreboard() {
        mineralCountEl.textContent = formatNumber(minerals);
        clickValueEl.textContent = formatNumber(clickValue);
        totalMinedEl.textContent = formatNumber(totalMined);
        upgradesOwnedEl.textContent = formatNumber(totalUpgrades);
        let next = getNextMilestone();
        let prev = getPrevMilestone();
        let range = next - prev;
        let progress = totalMined - prev;
        let percent = Math.min(100, (progress / range) * 100);
        progressBar.style.width = percent + "%";
        progressLabel.textContent = formatNumber(totalMined) + " / " + formatNumber(next);
    }
    function renderClickUpgrades() {
        upgradeListClick.innerHTML = "";
        for (let i = 0; i < clickUpgrades.length; i++) {
            let upgrade = clickUpgrades[i];
            let cost = getUpgradeCost(upgrade);
            let canAfford = minerals >= cost;
            // Create button element
            let btn = document.createElement("button");

            // Set class name based on affordability
            if (canAfford) {
                btn.className = "upgrade-btn";
            } else {
                btn.className = "upgrade-btn disabled";
            }

            // Set button HTML content
            btn.innerHTML = `
                <div class="upgrade-info">
                    <span class="upgrade-name">${upgrade.name}</span>
                    <span class="upgrade-desc">${upgrade.desc}</span>
                </div>
                <div class="upgrade-right">
                    <span class="upgrade-cost">${formatNumber(cost)} minerals</span>
                    <span class="upgrade-owned">Owned: ${upgrade.owned}</span>
                </div>`;

            // Add click event listener
            // Because we used 'let' in the for loop, 'i' is correct for each button
            btn.addEventListener("click", function () {
                buyClickUpgrade(i);
            });

            upgradeListClick.appendChild(btn);
        }
    }
    function renderAutoUpgrade() {
        upgradeListAuto.innerHTML = "";
        let cost = getUpgradeCost(autoUpgrade);
        let canAfford = minerals >= cost;
        let speedInfo = "";
        if (autoUpgrade.owned === 0) {
            speedInfo = "Starts auto-mining (every 3s)";
        } else {
            let nextSpeedIdx = Math.min(autoUpgrade.owned, autoUpgrade.speeds.length - 1);
            let nextSpeed = autoUpgrade.speeds[nextSpeedIdx];
            speedInfo = "Current: " + (autoClickSpeed / 1000).toFixed(1) +
                "s | Next: " + (nextSpeed / 1000).toFixed(1) + "s";
        }
        // Create button element
        let btn = document.createElement("button");

        // Set class name based on affordability
        if (canAfford) {
            btn.className = "upgrade-btn";
        } else {
            btn.className = "upgrade-btn disabled";
        }

        // Set button HTML content
        btn.innerHTML = `
            <div class="upgrade-info">
                <span class="upgrade-name">${autoUpgrade.name}</span>
                <span class="upgrade-desc">${speedInfo}</span>
            </div>
            <div class="upgrade-right">
                <span class="upgrade-cost">${formatNumber(cost)} minerals</span>
                <span class="upgrade-owned">Owned: ${autoUpgrade.owned}</span>
            </div>`;

        btn.addEventListener("click", function () {
            buyAutoUpgrade();
        });
        upgradeListAuto.appendChild(btn);
    }
    function renderRewards() {
        rewardsList.innerHTML = "";
        for (let i = 0; i < rewards.length; i++) {
            let reward = rewards[i];
            // Determine class name based on earned status
            let badgeClass = "reward-badge locked";
            if (reward.earned) {
                badgeClass = "reward-badge earned";
            }

            let badge = document.createElement("div");
            badge.className = badgeClass;
            badge.id = "reward-" + reward.id;

            let iconToCheck = "?";
            if (reward.earned) {
                iconToCheck = reward.icon;
            }

            badge.innerHTML = `
                <span class="reward-icon">${iconToCheck}</span>
                <span class="reward-name">${reward.name}</span>`;

            rewardsList.appendChild(badge);
        }
    }
    function showCongrats(message) {
        congratsMessage.textContent = message;
        congratsBanner.classList.remove("hidden");
        // Simple timeout to hide it after 3 seconds, no fancy animation
        setTimeout(function () {
            congratsBanner.classList.add("hidden");
        }, 3000);
    }
    function showClickFeedback(amount) {
        // No visual feedback for basic version
    }
    function checkRewards() {
        for (let i = 0; i < rewards.length; i++) {
            let reward = rewards[i];
            if (!reward.earned && reward.check()) {
                reward.earned = true;
                renderRewards();
                let badgeEl = document.getElementById("reward-" + reward.id);
                if (badgeEl) {
                    // No animation class needed
                }
                showCongrats("Reward Earned: " + reward.name + "!");
            }
        }
    }
    function renderAll() {
        renderScoreboard();
        renderClickUpgrades();
        renderAutoUpgrade();
    }
    function mine(showFeedback) {
        minerals += clickValue;
        totalMined += clickValue;
        if (showFeedback) {
            showClickFeedback(clickValue);
        }
        renderAll();
        checkRewards();
    }
    function buyClickUpgrade(index) {
        let upgrade = clickUpgrades[index];
        let cost = getUpgradeCost(upgrade);
        if (minerals >= cost) {
            minerals -= cost;
            upgrade.owned++;
            clickValue += upgrade.bonus;
            totalUpgrades++;
            renderAll();
            checkRewards();
        }
    }
    function buyAutoUpgrade() {
        let cost = getUpgradeCost(autoUpgrade);
        if (minerals >= cost) {
            minerals -= cost;
            autoUpgrade.owned++;
            totalUpgrades++;
            let speedIdx = Math.min(autoUpgrade.owned - 1, autoUpgrade.speeds.length - 1);
            let newSpeed = autoUpgrade.speeds[speedIdx];
            if (autoClickInterval !== null) {
                clearInterval(autoClickInterval);
                autoClickInterval = null;
            }
            autoClickSpeed = newSpeed;
            autoClickInterval = setInterval(function () {
                mine(false);
            }, autoClickSpeed);
            renderAll();
            checkRewards();
        }
    }
    mineBtn.addEventListener("click", function () {
        console.log("Mine button clicked");
        mine(true);
    });
    helpBtn.addEventListener("click", function () {
        console.log("Help opened");
        helpModal.classList.remove("hidden");
    });
    closeHelp.addEventListener("click", function () {
        helpModal.classList.add("hidden");
    });
    helpModal.addEventListener("click", function (e) {
        if (e.target === helpModal) {
            helpModal.classList.add("hidden");
        }
    });

    console.log("Game initialized. Minerals: " + minerals);
    renderAll();
    renderRewards();
});