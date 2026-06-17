"use client";

import React, { useState, useEffect, useRef } from "react";

interface TrashItem {
  id: string;
  noteText: string;
  color: string;
  deletedAt: number;
}

interface ActiveAlarm {
  time: string;
  display: string;
}

interface StickyNoteWidgetProps {
  theme?: string;
  onThemeChange?: (theme: string) => void;
}

export default function StickyNoteWidget({ theme, onThemeChange }: StickyNoteWidgetProps) {
  // --- Basic State ---
  const [activeTab, setActiveTab] = useState<string>("note");
  const [colorTheme, setColorTheme] = useState<string>("yellow");

  // Sync internal state with external theme prop
  useEffect(() => {
    if (theme) {
      setColorTheme(theme);
    }
  }, [theme]);

  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>("");
  const [charCount, setCharCount] = useState<number>(0);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // --- Settings State ---
  const [alwaysOnTop, setAlwaysOnTop] = useState<boolean>(false);
  const [autoDim, setAutoDim] = useState<boolean>(false);
  const [noteOpacity, setNoteOpacity] = useState<number>(100);
  const [dimOpacity, setDimOpacity] = useState<number>(45);
  const [fontSize, setFontSize] = useState<string>("13px");
  const [enableAI, setEnableAI] = useState<boolean>(true);

  // --- AI Settings State ---
  const [aiProvider, setAiProvider] = useState<string>("gemini");
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [geminiModel, setGeminiModel] = useState<string>("gemini-2.5-flash");
  const [openaiKey, setOpenaiKey] = useState<string>("");
  const [openaiModel, setOpenaiModel] = useState<string>("gpt-4o-mini");
  const [deepseekKey, setDeepseekKey] = useState<string>("");
  const [deepseekModel, setDeepseekModel] = useState<string>("deepseek-chat");
  const [aiTestStatus, setAiTestStatus] = useState<string>("Unchecked");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    gemini: false,
    openai: false,
    deepseek: false,
  });

  // --- Layout/Focus Simulations ---
  const [isFocused, setIsFocused] = useState<boolean>(true);
  const [isScrolledPast, setIsScrolledPast] = useState<boolean>(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // --- Sound Alert State ---
  const [alertOverlayOpen, setAlertOverlayOpen] = useState<boolean>(false);
  const [alertTitle, setAlertTitle] = useState<string>("Timer's Up!");
  const [alertMsg, setAlertMsg] = useState<string>("Your countdown timer has completed.");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alertIntervalRef = useRef<any>(null);

  // --- Timer State ---
  const [timerMin, setTimerMin] = useState<string>("05");
  const [timerSec, setTimerSec] = useState<string>("00");
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerPaused, setTimerPaused] = useState<boolean>(false);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [timerTotal, setTimerTotal] = useState<number>(0);
  const timerIntervalRef = useRef<any>(null);

  // --- Alarm State ---
  const [liveClock, setLiveClock] = useState<string>("00:00:00");
  const [alarmHour, setAlarmHour] = useState<string>("08");
  const [alarmMinute, setAlarmMinute] = useState<string>("00");
  const [alarmAmpm, setAlarmAmpm] = useState<string>("AM");
  const [hourMenuOpen, setHourMenuOpen] = useState<boolean>(false);
  const [minuteMenuOpen, setMinuteMenuOpen] = useState<boolean>(false);
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);
  const [alarmCountdown, setAlarmCountdown] = useState<string>("");
  const alarmCheckIntervalRef = useRef<any>(null);

  // --- Stopwatch State ---
  const [swTime, setSwTime] = useState<number>(0); // in ms
  const [swRunning, setSwRunning] = useState<boolean>(false);
  const [swLaps, setSwLaps] = useState<number[]>([]);
  const swIntervalRef = useRef<any>(null);
  const swStartTimeRef = useRef<any>(null);

  // --- History/Trash State ---
  const [trashList, setTrashList] = useState<TrashItem[]>([]);

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const getRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // --- AI Drawer State ---
  const [aiPanelOpen, setAiPanelOpen] = useState<boolean>(false);
  const [aiView, setAiView] = useState<string>("menu"); // "menu" | "loading" | "result"
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>("");
  const [aiResultText, setAiResultText] = useState<string>("");
  const [aiThinkingText, setAiThinkingText] = useState<string>("");
  const [aiReasoningExpanded, setAiReasoningExpanded] = useState<boolean>(true);

  // --- Load LocalStorage Values ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedText = localStorage.getItem("sticky_demo_text") || "";
      setNoteText(savedText);
      setCharCount(savedText.length);

      const savedTheme = localStorage.getItem("sticky_demo_theme") || "yellow";
      setColorTheme(savedTheme);

      const savedTrash = localStorage.getItem("sticky_demo_trash");
      if (savedTrash) {
        try { setTrashList(JSON.parse(savedTrash)); } catch(e){}
      }
    }
  }, []);

  // --- Save note changes ---
  const handleNoteTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);
    setCharCount(text.length);
    localStorage.setItem("sticky_demo_text", text);
  };

  const handleThemeChange = (color: string) => {
    setColorTheme(color);
    setPaletteOpen(false);
    localStorage.setItem("sticky_demo_theme", color);
    if (onThemeChange) {
      onThemeChange(color);
    }
  };

  // --- Simulating Always-on-top Floating on Scroll ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        setIsScrolledPast(true);
      } else {
        setIsScrolledPast(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Simulating Auto-dim Focus/Blur ---
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      } else {
        setIsFocused(true);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // --- Synthesize Chime (Web Audio API) ---
  const playAlertChime = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }

      const playNote = (freq: number, startTime: number, duration: number) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0.0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      if (ctx) {
        const now = ctx.currentTime;
        // C Major Arpeggio chime
        playNote(523.25, now, 0.4);
        playNote(659.25, now + 0.12, 0.4);
        playNote(783.99, now + 0.24, 0.5);
        playNote(1046.50, now + 0.36, 0.7);
      }
    } catch (err) {
      console.error("Audio synth error:", err);
    }
  };

  const startRingingAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMsg(message);
    setAlertOverlayOpen(true);

    playAlertChime();
    if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);
    alertIntervalRef.current = setInterval(playAlertChime, 1800);
  };

  const stopRingingAlert = () => {
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
    }
    setAlertOverlayOpen(false);
  };

  // --- Timer Operations ---
  const startTimer = (overrideSecs?: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const checkTime = overrideSecs !== undefined ? overrideSecs : timerRemaining;
    let currentRemaining = checkTime;

    timerIntervalRef.current = setInterval(() => {
      if (currentRemaining <= 0) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        setTimerRunning(false);
        setTimerPaused(false);
        startRingingAlert("Timer's Up!", "Your countdown timer has completed.");
        resetTimerState();
        return;
      }
      currentRemaining--;
      setTimerRemaining(currentRemaining);
    }, 1000);
  };

  const handleTimerStart = () => {
    const mins = parseInt(timerMin) || 0;
    const secs = parseInt(timerSec) || 0;
    const total = mins * 60 + secs;
    if (total <= 0) return;

    setTimerTotal(total);
    setTimerRemaining(total);
    setTimerRunning(true);
    setTimerPaused(false);
    startTimer(total);
  };

  const handleTimerPause = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      setTimerPaused(true);
    } else {
      setTimerPaused(false);
      startTimer();
    }
  };

  const resetTimerState = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    setTimerRunning(false);
    setTimerPaused(false);
    setTimerRemaining(0);
    setTimerTotal(0);
  };

  // Timer Circle Progress Math
  const CIRCUMFERENCE = 2 * Math.PI * 72; // r = 72
  const timerCircleOffset = timerTotal > 0
    ? CIRCUMFERENCE - (timerRemaining / timerTotal) * CIRCUMFERENCE
    : CIRCUMFERENCE;

  const formatTimerDigits = (secVal: number) => {
    const m = Math.floor(secVal / 60).toString().padStart(2, '0');
    const s = (secVal % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- Live Clock & Alarm Operations ---
  useEffect(() => {
    const clockInterval = setInterval(() => {
      const now = new Date();
      const hrs = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      const secs = now.getSeconds().toString().padStart(2, '0');
      setLiveClock(`${hrs}:${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  const handleSetAlarm = () => {
    const displayHour = alarmHour;
    const displayMinute = alarmMinute;
    const displayPeriod = alarmAmpm;

    let h24 = parseInt(displayHour);
    if (displayPeriod === "PM" && h24 !== 12) h24 += 12;
    if (displayPeriod === "AM" && h24 === 12) h24 = 0;

    const alarmTimeStr = `${h24.toString().padStart(2, '0')}:${displayMinute}`;

    setActiveAlarm({
      time: alarmTimeStr,
      display: `${displayHour}:${displayMinute} ${displayPeriod}`
    });

    if (alarmCheckIntervalRef.current) clearInterval(alarmCheckIntervalRef.current);

    const checkAlarm = () => {
      const now = new Date();
      const curHrs = now.getHours().toString().padStart(2, '0');
      const curMins = now.getMinutes().toString().padStart(2, '0');
      const curTimeStr = `${curHrs}:${curMins}`;

      // Countdown math
      const target = new Date();
      target.setHours(h24, parseInt(displayMinute), 0, 0);
      if (target < now) {
        target.setDate(target.getDate() + 1);
      }

      const diffMs = target.getTime() - now.getTime();
      const diffMins = Math.ceil(diffMs / (1000 * 60));

      if (diffMins >= 60) {
        const diffHrs = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        setAlarmCountdown(`in ${diffHrs}h ${remainingMins}m`);
      } else {
        setAlarmCountdown(`in ${diffMins}m`);
      }

      if (curTimeStr === alarmTimeStr) {
        clearInterval(alarmCheckIntervalRef.current);
        alarmCheckIntervalRef.current = null;
        setActiveAlarm(null);
        startRingingAlert("Alarm ringing!", `Set for ${displayHour}:${displayMinute} ${displayPeriod}`);
      }
    };

    checkAlarm();
    alarmCheckIntervalRef.current = setInterval(checkAlarm, 5000);
  };

  const handleCancelAlarm = () => {
    if (alarmCheckIntervalRef.current) {
      clearInterval(alarmCheckIntervalRef.current);
      alarmCheckIntervalRef.current = null;
    }
    setActiveAlarm(null);
  };

  // --- Stopwatch Operations ---
  const formatStopwatchTime = (msVal: number) => {
    const totalSecs = Math.floor(msVal / 1000);
    const minutes = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const seconds = (totalSecs % 60).toString().padStart(2, '0');
    const centiseconds = Math.floor((msVal % 1000) / 10).toString().padStart(2, '0');
    return { main: `${minutes}:${seconds}`, ms: `.${centiseconds}` };
  };

  const handleSwStart = () => {
    swStartTimeRef.current = Date.now() - swTime;
    setSwRunning(true);
    swIntervalRef.current = setInterval(() => {
      setSwTime(Date.now() - swStartTimeRef.current);
    }, 10);
  };

  const handleSwPause = () => {
    clearInterval(swIntervalRef.current);
    swIntervalRef.current = null;
    setSwRunning(false);
  };

  const handleSwReset = () => {
    clearInterval(swIntervalRef.current);
    swIntervalRef.current = null;
    setSwRunning(false);
    setSwTime(0);
    setSwLaps([]);
  };

  const handleSwLap = () => {
    setSwLaps((prev) => [swTime, ...prev]);
  };

  // --- Delete note (to trash) & History restore ---
  const handleDeleteNoteText = () => {
    if (noteText.trim().length === 0) return;
    if (confirm("Move current note text to trash?")) {
      const newTrashItem: TrashItem = {
        id: `note-${Date.now()}`,
        noteText: noteText,
        color: colorTheme,
        deletedAt: Date.now()
      };

      const updatedTrash = [newTrashItem, ...trashList].slice(0, 20);
      setTrashList(updatedTrash);
      localStorage.setItem("sticky_demo_trash", JSON.stringify(updatedTrash));

      setNoteText("");
      setCharCount(0);
      localStorage.setItem("sticky_demo_text", "");
      setActiveTab("history");
    }
  };

  const handleRestoreNoteText = (item: TrashItem) => {
    setNoteText(item.noteText);
    setCharCount(item.noteText.length);
    setColorTheme(item.color);
    localStorage.setItem("sticky_demo_text", item.noteText);
    localStorage.setItem("sticky_demo_theme", item.color);

    const updatedTrash = trashList.filter((t) => t.id !== item.id);
    setTrashList(updatedTrash);
    localStorage.setItem("sticky_demo_trash", JSON.stringify(updatedTrash));
    setActiveTab("note");
  };

  const handleClearTrash = () => {
    setTrashList([]);
    localStorage.removeItem("sticky_demo_trash");
  };

  // --- AI Presets and Custom Prompt Simulated Executor ---
  const runSimulatedAI = (actionType: string, customInput: string = "") => {
    if (!noteText.trim() && actionType !== "brainstorm") {
      alert("Please write some notes first so the AI has context to work with!");
      return;
    }

    setAiPanelOpen(true);
    setAiView("loading");

    // Dynamic mock response generation
    setTimeout(() => {
      let thinking = "";
      let result = "";

      switch (actionType) {
        case "improve":
          thinking = "Reading note text...\nAnalyzing tone (found conversational notes)\nRephrasing to add active voice and clarity...\nFormatting spacing...";
          result = `Here is a polished version of your note:\n\n"${noteText.trim()}"\n\n👉 Let's keep refining this idea! Make sure to set a timer to focus on finalizing it.`;
          break;
        case "summarize":
          thinking = "Scanning draft elements...\nCategorizing details...\nSynthesizing main objectives...";
          result = `📝 Draft Summary:\n\n• Key Subject: Creative Brainstorming\n• Length: ${charCount} characters\n• Action: Finalize goals and establish alarms to maintain the timeline.`;
          break;
        case "todos":
          thinking = "Identifying verbs and action phrases in text...\nGenerating checkmarks for incomplete list items...";
          result = `✅ Extracted Tasks:\n\n[ ] Action Item 1: Review notes content\n[ ] Action Item 2: Set timer to organize next steps\n[ ] Action Item 3: Clear resolved items`;
          break;
        case "brainstorm":
          thinking = "Expanding concepts...\nGenerating creative paths for sticky notes...";
          result = `💡 Brainstorming Ideas:\n\n1. Use Alarms to separate blocks of deep work.\n2. Dedicate a Blue note for code logic and a Pink note for daily to-dos.\n3. Make use of Auto-Dim to avoid screen clutter while compiling code.`;
          break;
        default:
          thinking = `Parsing custom request: "${customInput}"...\nApplying model context...\nFormulating target output...`;
          result = `✨ AI response to: "${customInput}"\n\nGreat prompt! Here is some inspiration for your desktop sticky notes: Keep the "Always on Top" pin enabled while referring to these points in other applications.`;
          break;
      }

      setAiThinkingText(thinking);
      setAiResultText(result);
      setAiView("result");
    }, 2000);
  };

  const handleAiReplace = () => {
    const replaced = aiResultText.replace(/^Here is a polished version of your note:\n\n"|^📝 Draft Summary:\n\n|^✅ Extracted Tasks:\n\n|^💡 Brainstorming Ideas:\n\n|"$|👉.*$/g, "");
    setNoteText(replaced);
    setCharCount(replaced.length);
    localStorage.setItem("sticky_demo_text", replaced);
    setAiPanelOpen(false);
  };

  const handleAiInsert = () => {
    const newText = noteText + "\n" + aiResultText;
    setNoteText(newText);
    setCharCount(newText.length);
    localStorage.setItem("sticky_demo_text", newText);
    setAiPanelOpen(false);
  };

  const handleAiAppend = () => {
    const newText = noteText + "\n\n" + aiResultText;
    setNoteText(newText);
    setCharCount(newText.length);
    localStorage.setItem("sticky_demo_text", newText);
    setAiPanelOpen(false);
  };

  const handleAiCopy = () => {
    navigator.clipboard.writeText(aiResultText);
    alert("AI output copied to clipboard!");
  };

  // Determine current widget opacity style based on focus and settings
  const activeOpacity = noteOpacity / 100;
  const dimmedOpacityVal = dimOpacity / 100;
  const opacityStyle = !isFocused && autoDim
    ? Math.min(activeOpacity, dimmedOpacityVal)
    : activeOpacity;

  // Clean cleanup
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (alarmCheckIntervalRef.current) clearInterval(alarmCheckIntervalRef.current);
      if (swIntervalRef.current) clearInterval(swIntervalRef.current);
      if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);
    };
  }, []);

  return (
    <div className="sticky-widget-rotate-container">
      <div
        ref={widgetRef}
        style={{
          opacity: opacityStyle,
          fontSize: fontSize,
        }}
        className={`sticky-widget theme-${colorTheme} ${collapsed ? "collapsed-note" : ""} ${alwaysOnTop && isScrolledPast ? "always-on-top-floating" : ""}`}
      >
        {/* Visual Helper Banner when Always-on-top floats */}
        {alwaysOnTop && !isScrolledPast && (
          <div className="absolute -top-7 left-0 right-0 text-center text-[10px] text-lime-400 font-extrabold uppercase animate-pulse pointer-events-none">
            📌 Pinned! Scroll down to see it float.
          </div>
        )}

        <div className="glass-container">
          {/* --- Header --- */}
          <header className="drag-header">
            <div className="header-left">
              <button
                onClick={() => {
                  setNoteText("");
                  setCharCount(0);
                  localStorage.setItem("sticky_demo_text", "");
                  setActiveTab("note");
                }}
                title="New Sticky Note"
                className="icon-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <button
                onClick={() => setPaletteOpen(!paletteOpen)}
                title="Change Color"
                className="icon-btn theme-indicator-btn"
              >
                <span className="theme-circle-indicator"></span>
              </button>

              {paletteOpen && (
                <div className="color-palette">
                  {["yellow", "blue", "green", "pink", "purple", "dark"].map((col) => (
                    <div
                      key={col}
                      onClick={() => handleThemeChange(col)}
                      className={`color-dot ${col} ${colorTheme === col ? "active" : ""}`}
                      title={col.charAt(0).toUpperCase() + col.slice(1)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="header-center">
              <span className="app-title">Sticky</span>
            </div>

            <div className="header-right">
              <button
                onClick={() => setAlwaysOnTop(!alwaysOnTop)}
                title="Pin to Screen (Always on Top)"
                className={`icon-btn ${alwaysOnTop ? "active-pin" : ""}`}
              >
                <svg className="pin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.56A2 2 0 0 1 15 9.2V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.2a2 2 0 0 1-.78 1.24l-2.78 3.56a2 2 0 0 0-.44 1.24V17z"></path></svg>
              </button>
              <button
                onClick={() => setCollapsed(!collapsed)}
                title="Collapse Note"
                className="icon-btn"
              >
                <svg className="collapse-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="18 15 12 9 6 15"></polyline></svg>
              </button>
              <button
                onClick={handleDeleteNoteText}
                title="Delete Note Text"
                className="icon-btn delete-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </header>

          {/* --- Main Panels --- */}
          <main className="content-area">
            {/* Panel 1: Note */}
            <section className={`panel ${activeTab === "note" ? "active" : ""}`}>
              <div className="editor-toolbar">
                <div className="toolbar-left">{charCount} chars | {getWordCount(noteText)} words</div>
                {enableAI && (
                  <div className="toolbar-right">
                    <button
                      onClick={() => {
                        setAiPanelOpen(true);
                        setAiView("menu");
                      }}
                      className="toolbar-btn"
                      title="AI Assistant"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M13 5l1 1M18 10l-1-1M3 21l9-9M12.2 11.8l1-1"/>
                      </svg>
                      <span>AI Assistant</span>
                    </button>
                  </div>
                )}
              </div>

              <textarea
                id="note-editor"
                value={noteText}
                onChange={handleNoteTextChange}
                placeholder="Write your sticky note here..."
              />

              {/* AI Assistant Drawer */}
              {aiPanelOpen && (
                <div className="ai-assistant-panel">
                  {aiView === "menu" && (
                    <div className="ai-view">
                      <div className="ai-header">
                        <span className="ai-title" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: "var(--theme-accent)" }}>
                            <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M13 5l1 1M18 10l-1-1M3 21l9-9M12.2 11.8l1-1"/>
                          </svg>
                          <span>AI Assistant</span>
                        </span>
                        <button onClick={() => setAiPanelOpen(false)} className="ai-close-btn">&times;</button>
                      </div>

                      <div className="ai-menu-options">
                        <button onClick={() => runSimulatedAI("improve")} className="ai-menu-btn">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                          <span>Improve Writing</span>
                        </button>
                        <button onClick={() => runSimulatedAI("summarize")} className="ai-menu-btn">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
                          </svg>
                          <span>Summarize</span>
                        </button>
                        <button onClick={() => runSimulatedAI("todos")} className="ai-menu-btn">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                          </svg>
                          <span>Extract Tasks</span>
                        </button>
                        <button onClick={() => runSimulatedAI("brainstorm")} className="ai-menu-btn">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .6 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line>
                          </svg>
                          <span>Brainstorm</span>
                        </button>
                      </div>

                      <div className="ai-custom-prompt">
                        <input
                          type="text"
                          value={aiCustomPrompt}
                          onChange={(e) => setAiCustomPrompt(e.target.value)}
                          onKeyDown={(e) => { if(e.key === 'Enter') runSimulatedAI("custom", aiCustomPrompt); }}
                          id="ai-custom-input"
                          placeholder="Ask AI... (e.g. Translate to French)"
                        />
                        <button onClick={() => runSimulatedAI("custom", aiCustomPrompt)} className="ai-submit-btn">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {aiView === "loading" && (
                    <div className="ai-loading-container">
                      <div className="ai-glow-orb">
                        <div className="ai-orb-core"></div>
                        <div className="ai-orb-ring"></div>
                        <div className="ai-orb-ring-double"></div>
                      </div>
                      <span className="ai-loading-text">Analyzing your thoughts...</span>
                    </div>
                  )}

                  {aiView === "result" && (
                    <div className="ai-view">
                      <div className="ai-header">
                        <span className="ai-title" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: "var(--theme-accent)" }}>
                            <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M13 5l1 1M18 10l-1-1M3 21l9-9M12.2 11.8l1-1"/>
                          </svg>
                          <span>AI Result</span>
                        </span>
                        <button onClick={() => setAiPanelOpen(false)} className="ai-close-btn">&times;</button>
                      </div>

                      <div className="ai-result-content-wrapper">
                        <div className={`ai-reasoning-container ${aiReasoningExpanded ? "open" : ""}`}>
                          <button
                            onClick={() => setAiReasoningExpanded(!aiReasoningExpanded)}
                            className="ai-reasoning-toggle"
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: "var(--theme-accent)" }}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-4.12 2.5 2.5 0 0 1 0-4.88A2.5 2.5 0 0 1 9.5 2zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-4.12 2.5 2.5 0 0 0 0-4.88A2.5 2.5 0 0 0 14.5 2z"/></svg>
                              <span>Thinking Process</span>
                            </span>
                            <svg className="chevron-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: aiReasoningExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                          </button>
                          {aiReasoningExpanded && (
                            <div className="ai-reasoning-content">{aiThinkingText}</div>
                          )}
                        </div>

                        <div className="ai-result-text">{aiResultText}</div>
                      </div>

                      <div className="ai-result-actions">
                        <button onClick={handleAiReplace} className="btn btn-primary" title="Replace note text">Replace</button>
                        <button onClick={handleAiInsert} className="btn btn-secondary" title="Insert at cursor">Insert</button>
                        <button onClick={handleAiAppend} className="btn btn-secondary" title="Append to end">Append</button>
                        <button onClick={handleAiCopy} className="btn btn-secondary" title="Copy to clipboard">Copy</button>
                        <button onClick={() => setAiView("menu")} className="btn btn-danger" title="Go back">Back</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Panel 2: Timer */}
            <section className={`panel ${activeTab === "timer" ? "active" : ""}`}>
              <div className="timer-container">
                <div className="timer-display-ring">
                  <svg className="progress-ring" width="160" height="160">
                    <circle className="progress-ring__circle-bg" stroke="rgba(255,255,255,0.15)" strokeWidth="6" fill="transparent" r="72" cx="80" cy="80"/>
                    <circle
                      className="progress-ring__circle"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="transparent"
                      r="72" cx="80" cy="80"
                      strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                      strokeDashoffset={timerCircleOffset}
                    />
                  </svg>
                  <div className="timer-time-label">
                    {timerRunning ? formatTimerDigits(timerRemaining) : `${timerMin}:${timerSec}`}
                  </div>
                </div>

                {!timerRunning && (
                  <div className="timer-inputs">
                    <input
                      type="number"
                      value={timerMin}
                      onChange={(e) => setTimerMin(e.target.value.slice(0,2))}
                      onBlur={() => setTimerMin(timerMin.padStart(2, '0'))}
                      min="0" max="99" placeholder="MM"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      value={timerSec}
                      onChange={(e) => setTimerSec(e.target.value.slice(0,2))}
                      onBlur={() => setTimerSec(timerSec.padStart(2, '0'))}
                      min="0" max="59" placeholder="SS"
                    />
                  </div>
                )}

                <div className="control-buttons">
                  {!timerRunning ? (
                    <button onClick={handleTimerStart} className="btn btn-primary">Start</button>
                  ) : (
                    <>
                      <button onClick={handleTimerPause} className="btn btn-secondary">
                        {timerPaused ? "Resume" : "Pause"}
                      </button>
                      <button onClick={resetTimerState} className="btn btn-danger">Reset</button>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Panel 3: Alarm */}
            <section className={`panel ${activeTab === "alarm" ? "active" : ""}`}>
              <div className="alarm-container">
                <div className="digital-clock-container">
                  <svg className="clock-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <div className="digital-clock">{liveClock}</div>
                </div>

                <div className="alarm-setup">
                  <div className="alarm-time-custom-picker">
                    <div className="custom-dropdown">
                      <button onClick={() => { setHourMenuOpen(!hourMenuOpen); setMinuteMenuOpen(false); }} className={`dropdown-trigger ${hourMenuOpen ? "open" : ""}`}>
                        {alarmHour}
                      </button>
                      {hourMenuOpen && (
                        <div className="dropdown-menu" id="menu-hour">
                          {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((hr) => (
                            <div
                              key={hr}
                              onClick={() => { setAlarmHour(hr); setHourMenuOpen(false); }}
                              className={`dropdown-item ${alarmHour === hr ? "selected" : ""}`}
                            >
                              {hr}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <span>:</span>

                    <div className="custom-dropdown">
                      <button onClick={() => { setMinuteMenuOpen(!minuteMenuOpen); setHourMenuOpen(false); }} className={`dropdown-trigger ${minuteMenuOpen ? "open" : ""}`}>
                        {alarmMinute}
                      </button>
                      {minuteMenuOpen && (
                        <div className="dropdown-menu" id="menu-minute">
                          {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map((min) => (
                            <div
                              key={min}
                              onClick={() => { setAlarmMinute(min); setMinuteMenuOpen(false); }}
                              className={`dropdown-item ${alarmMinute === min ? "selected" : ""}`}
                            >
                              {min}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button onClick={() => setAlarmAmpm(alarmAmpm === "AM" ? "PM" : "AM")} className="ampm-toggle-btn">
                      {alarmAmpm}
                    </button>
                  </div>

                  <button onClick={handleSetAlarm} className="btn btn-primary">Set Alarm</button>
                </div>

                {activeAlarm && (
                  <div className="alarm-card">
                    <div className="alarm-info">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                      <div>
                        <span className="alarm-time">{activeAlarm.display}</span>
                        <span className="alarm-countdown">{alarmCountdown}</span>
                      </div>
                    </div>
                    <button onClick={handleCancelAlarm} className="icon-btn cancel-alarm-btn" title="Cancel Alarm">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Panel 4: Stopwatch */}
            <section className={`panel ${activeTab === "stopwatch" ? "active" : ""}`}>
              <div className="stopwatch-container">
                <div className="stopwatch-display">
                  <span>{formatStopwatchTime(swTime).main}</span>
                  <span className="sw-ms">{formatStopwatchTime(swTime).ms}</span>
                </div>

                <div className="control-buttons">
                  <button onClick={handleSwLap} className="btn btn-secondary" disabled={!swRunning}>Lap</button>
                  {!swRunning ? (
                    <button onClick={handleSwStart} className="btn btn-primary">Start</button>
                  ) : (
                    <button onClick={handleSwPause} className="btn btn-secondary">Pause</button>
                  )}
                  <button onClick={handleSwReset} className="btn btn-danger" style={{ display: !swRunning && swTime > 0 ? "inline-flex" : "none" }}>Reset</button>
                </div>

                <div className="laps-container">
                  <ul>
                    {swLaps.map((lap, idx) => (
                      <li key={idx}>
                        <span>Lap {swLaps.length - idx}</span>
                        <span>{formatStopwatchTime(lap).main}{formatStopwatchTime(lap).ms}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Panel 5: Settings */}
            <section className={`panel ${activeTab === "settings" ? "active" : ""}`}>
              <div className="settings-container">
                <h3 className="settings-title">Note Settings</h3>

                <div className="setting-item">
                  <div className="setting-label">
                    <span>Always on Top</span>
                    <span className="setting-desc">Pin widget floating as you scroll</span>
                  </div>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      id="setting-always-on-top-widget"
                      checked={alwaysOnTop}
                      onChange={(e) => setAlwaysOnTop(e.target.checked)}
                    />
                    <label htmlFor="setting-always-on-top-widget" className="switch-slider"></label>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <span>Auto-Dim when Inactive</span>
                    <span className="setting-desc">Fade widget when clicking outside</span>
                  </div>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      id="setting-auto-dim-widget"
                      checked={autoDim}
                      onChange={(e) => setAutoDim(e.target.checked)}
                    />
                    <label htmlFor="setting-auto-dim-widget" className="switch-slider"></label>
                  </div>
                </div>

                {autoDim && (
                  <div className="setting-item setting-item-col">
                    <div className="setting-label" style={{ width: "100%", flexDirection: "row", justifyContent: "space-between" }}>
                      <span>Dimmed Opacity</span>
                      <span className="setting-desc">{dimOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10" max="90"
                      value={dimOpacity}
                      onChange={(e) => setDimOpacity(parseInt(e.target.value))}
                      className="opacity-slider"
                    />
                  </div>
                )}

                <div className="setting-item setting-item-col">
                  <div className="setting-label" style={{ width: "100%", flexDirection: "row", justifyContent: "space-between" }}>
                    <span>Note Opacity</span>
                    <span className="setting-desc">{noteOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="30" max="100"
                    value={noteOpacity}
                    onChange={(e) => setNoteOpacity(parseInt(e.target.value))}
                    className="opacity-slider"
                  />
                </div>

                <div className="setting-item setting-item-col">
                  <div className="setting-label">
                    <span>Font Size</span>
                    <span className="setting-desc">Adjust note text size</span>
                  </div>
                  <div className="font-size-options">
                    {["13px", "16px", "20px"].map((sz, i) => (
                      <button
                        key={sz}
                        onClick={() => setFontSize(sz)}
                        className={`font-btn ${fontSize === sz ? "active" : ""}`}
                      >
                        {i === 0 ? "Small" : i === 1 ? "Medium" : "Large"}
                      </button>
                    ))}
                  </div>
                </div>

                <h3 className="settings-title">AI Assistant Settings</h3>

                <div className="setting-item">
                  <div className="setting-label">
                    <span>Enable AI Assistant</span>
                    <span className="setting-desc">Show AI toolbar button in notes</span>
                  </div>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      id="setting-enable-ai-widget"
                      checked={enableAI}
                      onChange={(e) => setEnableAI(e.target.checked)}
                    />
                    <label htmlFor="setting-enable-ai-widget" className="switch-slider"></label>
                  </div>
                </div>

                {enableAI && (
                  <div id="ai-settings-group" className="ai-settings-group" style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    <div className="setting-item setting-item-col">
                      <div className="setting-label">
                        <span>Active AI Provider</span>
                        <span className="setting-desc">Choose which AI service to use</span>
                      </div>
                      <select
                        className="setting-select"
                        value={aiProvider}
                        onChange={(e) => {
                          setAiProvider(e.target.value);
                          setAiTestStatus("Unchecked");
                        }}
                      >
                        <option value="gemini">Gemini (Google)</option>
                        <option value="openai">ChatGPT (OpenAI)</option>
                        <option value="deepseek">DeepSeek</option>
                      </select>
                    </div>

                    {/* Gemini Config Section */}
                    {aiProvider === "gemini" && (
                      <div className="ai-provider-config">
                        <div className="setting-item setting-item-col">
                          <div className="setting-label">
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                              <span>Gemini API Key</span>
                            </span>
                            <span className="setting-desc">Enter your Gemini Developer API Key</span>
                          </div>
                          <div className="input-with-button">
                            <input
                              type={showKeys.gemini ? "text" : "password"}
                              value={geminiKey}
                              onChange={(e) => setGeminiKey(e.target.value)}
                              placeholder="AIzaSy..."
                              className="setting-input"
                            />
                            <button
                              onClick={() => setShowKeys({ ...showKeys, gemini: !showKeys.gemini })}
                              className="toggle-password-btn icon-btn"
                              type="button"
                              title="Toggle Visibility"
                            >
                              {!showKeys.gemini ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="setting-item setting-item-col">
                          <div className="setting-label">
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                              <span>Gemini Model</span>
                            </span>
                            <span className="setting-desc">Select model to run</span>
                          </div>
                          <select value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)} className="setting-select">
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Default)</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro (High Quality)</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* OpenAI Config Section */}
                    {aiProvider === "openai" && (
                      <div className="ai-provider-config">
                        <div className="setting-item setting-item-col">
                          <div className="setting-label">
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                              <span>OpenAI API Key</span>
                            </span>
                            <span className="setting-desc">Enter your OpenAI API Key</span>
                          </div>
                          <div className="input-with-button">
                            <input
                              type={showKeys.openai ? "text" : "password"}
                              value={openaiKey}
                              onChange={(e) => setOpenaiKey(e.target.value)}
                              placeholder="sk-proj-..."
                              className="setting-input"
                            />
                            <button
                              onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                              className="toggle-password-btn icon-btn"
                              type="button"
                              title="Toggle Visibility"
                            >
                              {!showKeys.openai ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="setting-item setting-item-col">
                          <div className="setting-label">
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                              <span>ChatGPT Model</span>
                            </span>
                            <span className="setting-desc">Select model to run</span>
                          </div>
                          <select value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)} className="setting-select">
                            <option value="gpt-4o-mini">GPT-4o Mini (Default)</option>
                            <option value="gpt-4o">GPT-4o (High Quality)</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* DeepSeek Config Section */}
                    {aiProvider === "deepseek" && (
                      <div className="ai-provider-config">
                        <div className="setting-item setting-item-col">
                          <div className="setting-label">
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                              <span>DeepSeek API Key</span>
                            </span>
                            <span className="setting-desc">Enter your DeepSeek API Key</span>
                          </div>
                          <div className="input-with-button">
                            <input
                              type={showKeys.deepseek ? "text" : "password"}
                              value={deepseekKey}
                              onChange={(e) => setDeepseekKey(e.target.value)}
                              placeholder="sk-..."
                              className="setting-input"
                            />
                            <button
                              onClick={() => setShowKeys({ ...showKeys, deepseek: !showKeys.deepseek })}
                              className="toggle-password-btn icon-btn"
                              type="button"
                              title="Toggle Visibility"
                            >
                              {!showKeys.deepseek ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="setting-item setting-item-col">
                          <div className="setting-label">
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                              <span>DeepSeek Model</span>
                            </span>
                            <span className="setting-desc">Select model to run</span>
                          </div>
                          <select value={deepseekModel} onChange={(e) => setDeepseekModel(e.target.value)} className="setting-select">
                            <option value="deepseek-chat">DeepSeek Chat (Default)</option>
                            <option value="deepseek-reasoner">DeepSeek Reasoner (R1 - Deep Reasoning)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Test Connection button */}
                    <div className="setting-item ai-test-connection" style={{ gap: "12px", display: "flex", width: "100%" }}>
                      <button
                        onClick={() => {
                          setAiTestStatus("Testing...");
                          setTimeout(() => {
                            setAiTestStatus("Success");
                          }, 1000);
                        }}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: "10px" }}
                        type="button"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px", display: "inline-block", verticalAlign: "middle" }}><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5m-4 0V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5M4 11h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM12 18v4"/></svg>
                        <span>Test Connection</span>
                      </button>
                      <span className={`ai-status-badge ${aiTestStatus === "Success" ? "success" : aiTestStatus === "Failed" ? "error" : ""}`}>
                        {aiTestStatus}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Panel 6: History */}
            <section className={`panel ${activeTab === "history" ? "active" : ""}`}>
              <div className="history-container">
                <div className="history-header">
                  <h3 className="settings-title" style={{ margin: 0, border: "none", padding: 0 }}>Deleted Notes</h3>
                  {trashList.length > 0 && (
                    <button onClick={handleClearTrash} className="btn btn-danger" style={{ padding: "4px 8px", fontSize: "10px", borderRadius: "8px" }}>Clear All</button>
                  )}
                </div>

                <div className="trash-list-container">
                  {trashList.length === 0 ? (
                    <div className="trash-empty-state">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: "8px" }}>
                        <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      <span>No deleted notes.</span>
                    </div>
                  ) : (
                    trashList.map((item) => {
                      const colorClass = item.color ? `color-${item.color}` : "color-yellow";
                      const textSnippet = item.noteText ? item.noteText.trim() : "";
                      const snippetDisplay = textSnippet.length > 60
                        ? textSnippet.substring(0, 60) + "..."
                        : textSnippet || "(Empty note)";
                      const relativeTime = getRelativeTime(item.deletedAt);
                      return (
                        <div key={item.id} className={`trash-item ${colorClass}`}>
                          <div className="trash-item-header">
                            <span className="trash-item-time">{relativeTime}</span>
                          </div>
                          <div className="trash-item-snippet">{snippetDisplay}</div>
                          <div className="trash-item-actions">
                            <button
                              onClick={() => handleRestoreNoteText(item)}
                              className="btn btn-primary btn-restore"
                              title="Restore note"
                              style={{ padding: "4px 8px", fontSize: "10px", borderRadius: "8px" }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "2px", verticalAlign: "middle" }}>
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                              </svg>
                              <span>Restore</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Are you sure you want to permanently delete this note? This action cannot be undone.")) {
                                  const updated = trashList.filter((t) => t.id !== item.id);
                                  setTrashList(updated);
                                  localStorage.setItem("sticky_demo_trash", JSON.stringify(updated));
                                }
                              }}
                              className="btn btn-danger btn-delete-perm"
                              title="Delete permanently"
                              style={{ padding: "4px 8px", fontSize: "10px", borderRadius: "8px" }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "2px", verticalAlign: "middle" }}>
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </main>

          {/* --- Navigation --- */}
          <nav className="bottom-nav">
            <button onClick={() => { setActiveTab("note"); setAiPanelOpen(false); }} className={`nav-item ${activeTab === "note" ? "active" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>Note</span>
            </button>
            <button onClick={() => { setActiveTab("timer"); setAiPanelOpen(false); }} className={`nav-item ${activeTab === "timer" ? "active" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Timer</span>
            </button>
            <button onClick={() => { setActiveTab("alarm"); setAiPanelOpen(false); }} className={`nav-item ${activeTab === "alarm" ? "active" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2 2"></path><path d="M5 3L2 6"></path><path d="M19 3l3 3"></path></svg>
              <span>Alarm</span>
            </button>
            <button onClick={() => { setActiveTab("stopwatch"); setAiPanelOpen(false); }} className={`nav-item ${activeTab === "stopwatch" ? "active" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 15 15"></polyline></svg>
              <span>Watch</span>
            </button>
            <button onClick={() => { setActiveTab("history"); setAiPanelOpen(false); }} className={`nav-item ${activeTab === "history" ? "active" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              <span>History</span>
            </button>
            <button onClick={() => { setActiveTab("settings"); setAiPanelOpen(false); }} className={`nav-item ${activeTab === "settings" ? "active" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* --- Alert overlay --- */}
        {alertOverlayOpen && (
          <div className="alert-overlay">
            <div className="alert-dialog">
              <div className="alert-icon-pulse">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              </div>
              <h2>{alertTitle}</h2>
              <p>{alertMsg}</p>
              <button onClick={stopRingingAlert} className="btn btn-primary">Dismiss</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
