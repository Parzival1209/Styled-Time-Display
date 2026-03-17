/* ===================== GLOBAL STATE ===================== */
let wakeLock = null;
let timezoneOffsets = {};

/* ===================== CLOCK ===================== */
function updateClock() {
	const tzSelector = document.querySelector(".timezone-selector");
	const selected = tzSelector.value;

	localStorage.setItem("savedTimezone", selected);

	const now = new Date();
	const utc = now.getTime() + now.getTimezoneOffset() * 60000;
	const offset = timezoneOffsets[selected] || 0;
	const adjusted = new Date(utc + offset * 3600000);

	const h = adjusted.getHours().toString().padStart(2, "0");
	const m = adjusted.getMinutes().toString().padStart(2, "0");
	const s = adjusted.getSeconds().toString().padStart(2, "0");

	document.querySelector(".time").textContent = `${h}:${m}:${s}`;

	document.querySelector(".binary").innerHTML =
		`${parseInt(h).toString(2).padStart(8,"0")}<br>
		 ${parseInt(m).toString(2).padStart(8,"0")}<br>
		 ${parseInt(s).toString(2).padStart(8,"0")}`;

	document.querySelector(".hex").textContent =
		`${parseInt(h).toString(16).toUpperCase().padStart(2,"0")}:` +
		`${parseInt(m).toString(16).toUpperCase().padStart(2,"0")}:` +
		`${parseInt(s).toString(16).toUpperCase().padStart(2,"0")}`;

	const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
	const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

	const day = adjusted.getDate();
	const suffix = (day >= 11 && day <= 13) ? "th" :
		["th","st","nd","rd"][Math.min(day % 10, 4)] || "th";

	document.querySelector(".date").innerHTML =
		`${days[adjusted.getDay()]} ${adjusted.getFullYear()}<br>
		 ${months[adjusted.getMonth()]} ${day}${suffix}`;
}

/* ===================== FULLSCREEN ===================== */
function fullscreen() {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen?.();
	} else {
		document.exitFullscreen?.();
	}
}

function fullscreenBackground() {
	if (document.fullscreenElement) {
		document.body.style.backgroundColor = "#000000";
	} else {
		document.body.style.backgroundColor = "#ffffff";
	}
}

function fullscreenCursor() {
	const el = document.querySelector(".time");
	el.style.cursor = document.fullscreenElement
		? "url('./Image assests/Exit-full-screen.png') 12 12, pointer"
		: "url('./Image assests/Enter-full-screen.png') 12 12, pointer";
}

/* ===================== UI TOGGLES ===================== */
function toggleTimezoneSelector() {
	const el = document.querySelector(".timezone-selector");
	el.style.display = (el.style.display === "none") ? "block" : "none";
	timezoneCursor();
}

function toggleAuthorInfo() {
	const el = document.querySelector(".author-info");
	el.style.display =
		window.getComputedStyle(el).display === "none" ? "block" : "none";
}

function timezoneCursor() {
	const tz = document.querySelector(".timezone-selector");
	const binary = document.querySelector(".binary");

	binary.style.cursor =
		tz.style.display === "block"
		? "url('./Image assests/Aero-up.png') 12 1, pointer"
		: "url('./Image assests/Aero-down.png') 12 24, pointer";
}

/* ===================== WAKE LOCK ===================== */
async function updateWakeLock() {
	try {
		if (document.fullscreenElement && document.visibilityState === "visible") {
			if (!wakeLock) wakeLock = await navigator.wakeLock.request("screen");
		} else if (wakeLock) {
			await wakeLock.release();
			wakeLock = null;
		}
	} catch (e) {
		console.error("Wake lock fail:", e);
	}
}

/* ===================== EVENT SETUP ===================== */
function setupListeners() {
	const time = document.querySelector(".time");
	const binary = document.querySelector(".binary");
	const hex = document.querySelector(".hex");
	const author = document.querySelector(".author-info");

	time.onclick = fullscreen;
	binary.onclick = toggleTimezoneSelector;
	hex.onclick = toggleAuthorInfo;
	author.onclick = toggleAuthorInfo;

	document.addEventListener("fullscreenchange", fullscreenBackground);
	document.addEventListener("fullscreenchange", fullscreenCursor);
	document.addEventListener("fullscreenchange", updateWakeLock);
	document.addEventListener("visibilitychange", updateWakeLock);

	window.addEventListener("resize", fullscreenCursor);

	document.addEventListener("keydown", e => {
		if (e.key === "F11") {
			e.preventDefault();
			fullscreen();
		}
	});
}

/* ===================== INIT WITH CACHE ===================== */
document.addEventListener("DOMContentLoaded", async () => {
	const tzSelector = document.querySelector(".timezone-selector");

	/* -------- LOAD TIMEZONES WITH CACHE -------- */
	let timezones = {};

	try {
		const res = await fetch("https://raw.githubusercontent.com/Parzival1209/Styled-Time-Display/refs/heads/main/Timezone%20lists/timezones.JSON");
		timezones = await res.json();
		localStorage.setItem("timezones", JSON.stringify(timezones));
	} catch (e) {
		console.log("Using cached timezones.");
		timezones = JSON.parse(localStorage.getItem("timezones")) || {};
	}

	/* -------- BUILD DROPDOWN -------- */
	const divider = document.createElement("option");
	divider.disabled = true;

	divider.textContent = "───────────────────────── No DST Timezones ─────────────────────────";
	tzSelector.appendChild(divider.cloneNode(true));

	Object.entries(timezones).forEach(([k,v]) => {
		const opt = document.createElement("option");
		opt.value = k;
		opt.textContent = v;
		tzSelector.appendChild(opt);
	});

	divider.textContent = "───────────────────────── DST Timezones (Soon) ─────────────────────────";
	tzSelector.appendChild(divider);

	/* -------- LOAD OFFSETS WITH CACHE -------- */
	try {
		const res = await fetch("https://raw.githubusercontent.com/Parzival1209/Styled-Time-Display/refs/heads/main/Timezone%20lists/timezoneOffsets.JSON");
		timezoneOffsets = await res.json();
		localStorage.setItem("timezoneOffsets", JSON.stringify(timezoneOffsets));
	} catch (e) {
		console.log("Using cached offsets.");
		timezoneOffsets = JSON.parse(localStorage.getItem("timezoneOffsets")) || {};
	}

	/* -------- RESTORE STATE -------- */
	const saved = localStorage.getItem("savedTimezone");
	if (saved) tzSelector.value = saved;

	setupListeners();

	updateClock();
	setInterval(updateClock, 1000);
});
