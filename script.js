// DOM Elements
const button = document.getElementById("overthinkButton");
const userInput = document.getElementById("userInput");
const result = document.getElementById("result");
const charCount = document.getElementById("charCount");
const randomBtn = document.getElementById("randomBtn");
const presetChips = document.querySelectorAll(".chip");

// Voice Input Elements
const voiceButton = document.getElementById("voiceButton");
const voiceButtonText = document.getElementById("voiceButtonText");
const voiceStatus = document.getElementById("voiceStatus");

// Report Card Elements
const reportSection = document.getElementById("reportSection");
const reportCard = document.getElementById("reportCard");
const reportSituation = document.getElementById("reportSituation");
const reportLevel = document.getElementById("reportLevel");
const reportBar = document.getElementById("reportBar");
const reportVerdict = document.getElementById("reportVerdict");
const reportThoughtsList = document.getElementById("reportThoughtsList");
const reportStamp = document.getElementById("reportStamp");
const reportDate = document.getElementById("reportDate");
const downloadReportBtn = document.getElementById("downloadReportBtn");
const shareReportBtn = document.getElementById("shareReportBtn");
const clearBtn = document.getElementById("clearBtn");
const toast = document.getElementById("toast");

// Set current date in report card footer
if (reportDate) {
    const now = new Date();
    reportDate.textContent = now.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

// Keep track of latest generation state
let currentReportData = null;

// ==========================================================
// Event Listeners
// ==========================================================

button.addEventListener("click", overthink);

// Allow Ctrl+Enter to submit
userInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        overthink();
    }
});

// Character Counter
userInput.addEventListener("input", () => {
    charCount.textContent = `${userInput.value.length} / 400`;
});

// Preset Chips
presetChips.forEach(chip => {
    chip.addEventListener("click", () => {
        userInput.value = chip.getAttribute("data-text");
        charCount.textContent = `${userInput.value.length} / 400`;
        userInput.focus();
        showToast("✨ Scenario loaded! Click OVERTHINK THIS.");
    });
});

// Random Dilemma Generator
const randomScenarios = [
    "Why did my friend see my message but not reply?",
    "Rinziya is not replying to my texts",
    "My manager asked: 'Can we chat for 2 minutes?'",
    "The person at the gym looked in my direction twice",
    "I said 'good morning' at 4:30 PM",
    "My crush liked a 3-year-old photo on my Instagram",
    "I waved back at someone who was actually waving at the person behind me",
    "They typed for 5 minutes and then sent a thumbs-up emoji"
];

randomBtn.addEventListener("click", () => {
    const randomChoice = randomScenarios[Math.floor(Math.random() * randomScenarios.length)];
    userInput.value = randomChoice;
    charCount.textContent = `${userInput.value.length} / 400`;
    userInput.focus();
    showToast("🎲 Random dilemma loaded!");
});

// Start Over Button
clearBtn.addEventListener("click", () => {
    userInput.value = "";
    charCount.textContent = "0 / 400";
    result.innerHTML = "";
    reportSection.classList.add("hidden");
    currentReportData = null;
    userInput.focus();
});

// ==========================================================
// Main Overthinking Action
// ==========================================================

async function overthink() {
    const situation = userInput.value.trim();

    if (situation === "") {
        result.innerHTML = `
            <div class="thought error-msg">
                😭 Give me something to overthink first!
            </div>
        `;
        userInput.focus();
        return;
    }

    // Hide previous report card while generating new one
    reportSection.classList.add("hidden");

    // Show progressive loading states
    result.innerHTML = `
        <div class="thought loading-step">
            🧠 AI is reading your situation...
        </div>
        <div class="thought loading-step">
            🔍 Finding problems that probably don't exist...
        </div>
        <div class="thought loading-step">
            💀 Making the situation unnecessarily complicated...
        </div>
    `;

    button.disabled = true;
    button.innerHTML = `<span>🧠 OVERTHINKING...</span>`;

    try {
        const response = await fetch("/api/overthink", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ situation })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to contact overthinking engine");
        }

        // Parse thoughts from response
        let thoughts = [];
        if (Array.isArray(data.thoughts) && data.thoughts.length > 0) {
            thoughts = data.thoughts;
        } else if (typeof data.result === "string") {
            thoughts = data.result
                .split("\n")
                .map(line => line.trim())
                .filter(line => line !== "");
        }

        // Overthinking Level & Verdict
        const level = data.level || (Math.floor(Math.random() * 20) + 80);
        let verdict = data.verdict;
        if (!verdict) {
            verdict = level >= 95 ? "💀 EXTREME DELULU" : "😭 YOU NEED TO RELAX";
        }

        // Cache current generation for share/download
        currentReportData = {
            situation,
            thoughts,
            level,
            verdict
        };

        // Render thoughts progressively for dramatic comedic timing
        result.innerHTML = "";
        
        for (let i = 0; i < thoughts.length; i++) {
            const thoughtDiv = document.createElement("div");
            thoughtDiv.className = "thought";
            thoughtDiv.innerHTML = escapeHTML(thoughts[i]);
            result.appendChild(thoughtDiv);
            
            // Micro-stagger delay
            if (i < thoughts.length - 1) {
                await new Promise(r => setTimeout(r, 140));
            }
        }

        // Append Level Banner
        const levelDiv = document.createElement("div");
        levelDiv.className = "level-banner";
        levelDiv.innerHTML = `
            <h3>🧠 OVERTHINKING LEVEL</h3>
            <div class="score">${level}%</div>
            <div class="verdict">${escapeHTML(verdict)}</div>
        `;
        result.appendChild(levelDiv);

        // Populate & Reveal Shareable Report Card (Version 7)
        populateReportCard(currentReportData);
        reportSection.classList.remove("hidden");
        
        // Smooth scroll to the report card
        reportSection.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (error) {
        console.error("Overthink error:", error);

        result.innerHTML = `
            <div class="thought error-msg">
                😭 The AI got confused.
            </div>
            <div class="thought error-msg">
                🔌 Check whether your Node.js server is running on port 3000.
            </div>
            <div class="thought error-msg">
                💀 Even the AI is overthinking this problem: ${escapeHTML(error.message || "Unknown error")}
            </div>
        `;
    } finally {
        button.disabled = false;
        button.innerHTML = `<span>🧠 OVERTHINK THIS</span>`;
    }
}

// ==========================================================
// Version 7: Shareable Report Card
// ==========================================================

function populateReportCard({ situation, thoughts, level, verdict }) {
    reportSituation.textContent = `"${situation}"`;
    reportLevel.textContent = `${level}%`;
    reportBar.style.width = `${Math.min(level, 100)}%`;
    reportVerdict.textContent = verdict;

    // Dynamic stamp badge
    if (situation.toLowerCase().includes("rinziya")) {
        reportStamp.textContent = "RINZIYA DANGER";
    } else if (level >= 95) {
        reportStamp.textContent = "CERTIFIED DELULU";
    } else if (level >= 88) {
        reportStamp.textContent = "HIGH RISK SPIRAL";
    } else {
        reportStamp.textContent = "CHILL DEFICIT";
    }

    // Populate thoughts list
    reportThoughtsList.innerHTML = "";
    thoughts.forEach((thought, index) => {
        const item = document.createElement("div");
        item.className = "report-thought-item";
        item.innerHTML = `
            <span class="report-thought-num">${index + 1}</span>
            <span>${escapeHTML(thought)}</span>
        `;
        reportThoughtsList.appendChild(item);
    });
}

// 📸 Download Report Card as PNG
downloadReportBtn.addEventListener("click", async () => {
    if (!currentReportData) return;

    downloadReportBtn.disabled = true;
    const originalText = downloadReportBtn.innerHTML;
    downloadReportBtn.innerHTML = `⏳ GENERATING PNG...`;

    try {
        if (typeof html2canvas === "function") {
            const canvas = await html2canvas(reportCard, {
                backgroundColor: "#090d16",
                scale: 2, // High resolution for crisp export
                useCORS: true,
                logging: false
            });

            const link = document.createElement("a");
            link.download = `overthinking-report-${Date.now()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            showToast("📸 Report downloaded as PNG!");
        } else {
            // Fallback native canvas drawing
            downloadFallbackCanvasReport(currentReportData);
            showToast("📸 Report card image generated!");
        }
    } catch (err) {
        console.error("Download report failed:", err);
        showToast("⚠️ Could not generate image. Trying fallback...");
        downloadFallbackCanvasReport(currentReportData);
    } finally {
        downloadReportBtn.disabled = false;
        downloadReportBtn.innerHTML = originalText;
    }
});

// Native Canvas Fallback Export
function downloadFallbackCanvasReport({ situation, thoughts, level, verdict }) {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1400;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Accent header border
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#8b5cf6");
    gradient.addColorStop(0.5, "#ec4899");
    gradient.addColorStop(1, "#8b5cf6");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 10);

    // Header text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText("🧠 OVERTHINKING REPORT", 80, 100);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "24px sans-serif";
    ctx.fillText("Official Diagnostic Assessment", 80, 140);

    // Situation box
    ctx.fillStyle = "#131b2e";
    ctx.fillRect(80, 200, 1040, 120);
    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("SITUATION UNDER INVESTIGATION:", 100, 240);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "italic 24px sans-serif";
    ctx.fillText(`"${situation.slice(0, 70)}${situation.length > 70 ? '...' : ''}"`, 100, 285);

    // Score & Verdict
    ctx.fillStyle = "#131b2e";
    ctx.fillRect(80, 360, 500, 140);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "20px sans-serif";
    ctx.fillText("OVERTHINKING LEVEL", 100, 400);
    ctx.fillStyle = "#c4b5fd";
    ctx.font = "bold 56px sans-serif";
    ctx.fillText(`${level}%`, 100, 470);

    ctx.fillStyle = "#131b2e";
    ctx.fillRect(620, 360, 500, 140);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "20px sans-serif";
    ctx.fillText("FINAL VERDICT", 640, 400);
    ctx.fillStyle = "#f472b6";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(verdict, 640, 460);

    // Thoughts
    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("THOUGHT SPIRAL EVIDENCE:", 80, 560);

    let yOffset = 620;
    ctx.font = "24px sans-serif";
    thoughts.slice(0, 7).forEach((th, idx) => {
        ctx.fillStyle = "#131b2e";
        ctx.fillRect(80, yOffset - 35, 1040, 60);
        ctx.fillStyle = "#f8fafc";
        ctx.fillText(`${idx + 1}. ${th}`, 100, yOffset);
        yOffset += 80;
    });

    // Footer
    ctx.fillStyle = "#64748b";
    ctx.font = "20px sans-serif";
    ctx.fillText("Generated by Overthinking Generator AI", 80, 1340);

    const link = document.createElement("a");
    link.download = `overthinking-report-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
}

// 📤 Share Report Button
shareReportBtn.addEventListener("click", async () => {
    if (!currentReportData) return;

    const { situation, thoughts, level, verdict } = currentReportData;
    const shareText = `🧠 OVERTHINKING REPORT\n\n📌 Situation: "${situation}"\n🔥 Level: ${level}%\n💀 Verdict: ${verdict}\n\nThought Spiral:\n${thoughts.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\n— Generated by Overthinking Generator AI`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: "🧠 My Overthinking Report",
                text: shareText,
                url: window.location.href
            });
            showToast("🚀 Shared successfully!");
        } catch (err) {
            if (err.name !== "AbortError") {
                copyToClipboard(shareText);
            }
        }
    } else {
        copyToClipboard(shareText);
    }
});

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast("📋 Report copied to clipboard!");
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const tempInput = document.createElement("textarea");
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand("copy");
        showToast("📋 Report copied to clipboard!");
    } catch (e) {
        showToast("⚠️ Could not copy report.");
    }
    document.body.removeChild(tempInput);
}

// ==========================================================
// Version 6: Voice Input (Web Speech API)
// ==========================================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN"; // English India as requested

    let isListening = false;

    voiceButton.addEventListener("click", () => {
        if (isListening) {
            recognition.stop();
            return;
        }

        try {
            recognition.start();
        } catch (e) {
            console.warn("Speech recognition already running or error:", e);
        }
    });

    recognition.onstart = () => {
        isListening = true;
        voiceButton.classList.add("listening");
        voiceButton.classList.remove("success");
        voiceButtonText.textContent = "Listening...";
        voiceStatus.textContent = "🎤 Listening... speak your situation now.";
        voiceStatus.className = "voice-status active";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
            // Append or replace
            if (userInput.value.trim() === "") {
                userInput.value = transcript;
            } else {
                userInput.value = `${userInput.value.trim()} ${transcript}`;
            }
            charCount.textContent = `${userInput.value.length} / 400`;
            showToast("✅ Speech recognized!");
        }
    };

    recognition.onspeechend = () => {
        recognition.stop();
    };

    recognition.onend = () => {
        isListening = false;
        voiceButton.classList.remove("listening");
        voiceButton.classList.add("success");
        voiceButtonText.textContent = "Got it!";
        voiceStatus.textContent = "✅ Got it! You can edit above or click OVERTHINK THIS.";
        voiceStatus.className = "voice-status";

        setTimeout(() => {
            voiceButton.classList.remove("success");
            voiceButtonText.textContent = "SPEAK";
            voiceStatus.textContent = "";
        }, 3000);
    };

    recognition.onerror = (event) => {
        isListening = false;
        voiceButton.classList.remove("listening");
        voiceButtonText.textContent = "SPEAK";

        let message = "⚠️ Voice error occurred.";
        if (event.error === "not-allowed") {
            message = "⚠️ Microphone access was denied. Please allow mic permission.";
        } else if (event.error === "no-speech") {
            message = "⚠️ No speech detected. Try speaking again.";
        }

        voiceStatus.textContent = message;
        voiceStatus.className = "voice-status";
        setTimeout(() => {
            voiceStatus.textContent = "";
        }, 4000);
    };

} else {
    // Graceful fallback for unsupported browsers
    voiceButton.addEventListener("click", () => {
        showToast("⚠️ Speech Recognition is not supported in this browser. Please type!");
        userInput.focus();
    });
}

// ==========================================================
// Toast Notification Utility
// ==========================================================

let toastTimeout;
function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3200);
}

// ==========================================================
// Security helper
// ==========================================================

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
