"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import client-only widget to prevent hydration errors
const StickyNoteWidget = dynamic(
  () => import("../components/StickyNoteWidget"),
  { ssr: false }
);

export default function Home() {
  // --- Site Theme Switching State ---
  const [siteTheme, setSiteTheme] = useState<string>("yellow");
  const [sitePaletteOpen, setSitePaletteOpen] = useState<boolean>(false);

  // Sync html and body class with siteTheme on mount and change
  useEffect(() => {
    document.documentElement.className = `theme-${siteTheme}`;
    document.body.className = `theme-${siteTheme}`;
  }, [siteTheme]);

  // Google Analytics Event Tracker Helper
  const trackSiteEvent = (eventName: string, params: Record<string, any> = {}) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", eventName, params);
      console.log(`[GA Event] ${eventName}`, params);
    }
  };

  const handleDownload = (platform: "mac" | "windows") => {
    trackSiteEvent("download_app", { platform });
    window.location.href = `/downloads/${platform}`;
  };

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* Background Neon Glow Orbs */}
      <div className="mesh-gradient-glow" />
      <div className="mesh-gradient-glow-2" />

      {/* --- Navbar --- */}
      <header className="container" style={{ position: "relative", zIndex: 100 }}>
        <nav className="nav-bar">
          <a href="#" className="logo-container" onClick={() => trackSiteEvent("click_logo")}>
            <img src="/icon.png" alt="MyStickyNote Logo" className="logo-icon-img" />
            <span>MyStickyNote</span>
          </a>
          
          <ul className="nav-links">
            <li><a href="#demo" className="nav-link" onClick={() => trackSiteEvent("nav_click", { target: "playground" })}>Playground</a></li>
            <li><a href="#features" className="nav-link" onClick={() => trackSiteEvent("nav_click", { target: "features" })}>Features</a></li>
            <li><a href="#compare" className="nav-link" onClick={() => trackSiteEvent("nav_click", { target: "compare" })}>Compare</a></li>
            <li><a href="#faq" className="nav-link" onClick={() => trackSiteEvent("nav_click", { target: "faq" })}>FAQ</a></li>
            <li><a href="#download" className="nav-link" onClick={() => trackSiteEvent("nav_click", { target: "download" })}>Download</a></li>
          </ul>

          <div style={{ display: "flex", alignItems: "center" }}>
            {/* Color Theme Selector Dropdown */}
            <div className="site-theme-picker-container">
              <button
                onClick={() => {
                  setSitePaletteOpen(!sitePaletteOpen);
                  trackSiteEvent("toggle_theme_picker");
                }}
                className="site-theme-trigger"
                title="Change Website Theme Color"
              />
              {sitePaletteOpen && (
                <div className="site-theme-palette">
                  {["yellow", "blue", "green", "pink", "purple", "dark"].map((theme) => (
                    <div
                      key={theme}
                      onClick={() => {
                        setSiteTheme(theme);
                        setSitePaletteOpen(false);
                        trackSiteEvent("select_theme", { color: theme });
                      }}
                      className={`site-theme-dot ${theme} ${siteTheme === theme ? "active" : ""}`}
                      title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <a href="#download" className="btn-landing btn-landing-primary" onClick={() => trackSiteEvent("click_nav_download")}>
              Download App
            </a>
          </div>
        </nav>
      </header>

      {/* --- Hero Section --- */}
      <section className="container hero-section" style={{ position: "relative", zIndex: 20 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
          <div className="glass-badge yellow" style={{ display: "flex", alignItems: "center" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            Ditch the browser tabs
          </div>
          <div className="glass-badge blue" style={{ display: "flex", alignItems: "center" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>
            AI Deep Reasoning
          </div>
        </div>

        <h1 className="hero-title">
          Pin it. Stick it.<br />
          <span className="gradient-text">AI it on your screen.</span>
        </h1>

        <p className="hero-desc">
          Because opening a heavy web browser just to write a simple 3-word memo is a waste. MyStickyNote is a lightweight, glassmorphic desktop companion that stays on top, dims when ignored, and helps you brainstorm using DeepSeek R1, Gemini, and ChatGPT.
        </p>

        <div className="hero-actions">
          <a href="#download" className="btn-landing btn-landing-primary" style={{ padding: "16px 32px", fontSize: "14px" }} onClick={() => trackSiteEvent("hero_download_click")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Install Desktop Client
          </a>
          <a href="#demo" className="btn-landing btn-landing-secondary" style={{ padding: "16px 32px", fontSize: "14px" }} onClick={() => {
            trackSiteEvent("hero_demo_click");
            document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Play Online Demo
          </a>
        </div>
      </section>

      {/* --- Interactive Desktop Playground --- */}
      <section id="demo" className="container demo-section" style={{ position: "relative", zIndex: 20 }}>
        <div className="glass-badge blue" style={{ display: "flex", alignItems: "center" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
          Tactile Sandbox
        </div>
        <h2 className="demo-title">Test Drive the Widget</h2>
        <p className="demo-desc">
          This isn't a static image. Type your notes, change color styles, set timer alarms, or ask the simulated AI drawer to summarize your inputs.
        </p>

        <div className="mock-desktop">
          <div className="mock-desktop-bg-pattern" />
          <div className="mock-desktop-header">
            <div className="mock-desktop-mac-dots">
              <span className="mac-dot mac-dot-red"></span>
              <span className="mac-dot mac-dot-yellow"></span>
              <span className="mac-dot mac-dot-green"></span>
            </div>
            <div className="mock-desktop-title">MyStickyNote Desktop Simulation</div>
            <div style={{ width: 44 }}></div>
          </div>

          {/* Interactive Widget */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%", padding: "20px" }}>
            <StickyNoteWidget theme={siteTheme} onThemeChange={(newTheme) => {
              setSiteTheme(newTheme);
              trackSiteEvent("widget_theme_change", { color: newTheme });
            }} />
          </div>

          <div className="mock-desktop-instructions">
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, flexShrink: 0 }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              Try setting a 5-sec Timer, or toggle 'Always on Top' in Settings!
            </span>
          </div>
        </div>
      </section>

      {/* --- Features Grid Section --- */}
      <section id="features" className="container features-section" style={{ position: "relative", zIndex: 20 }}>
        <div className="section-tagline">Why it kicks ass</div>
        <h2 className="section-title">Features Checklist</h2>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></svg>
            </div>
            <h3 className="feature-card-title">Live Meeting Notes</h3>
            <p className="feature-card-desc">Choose Zoom, Teams, or Meet and turn system audio plus your microphone into a live transcript that can be dropped straight into a sticky note.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12a10 10 0 1 1-10-10"/><path d="m22 2-10 10"/><path d="M16 2h6v6"/></svg>
            </div>
            <h3 className="feature-card-title">Background Video Notes</h3>
            <p className="feature-card-desc">Capture a selected browser window while you work elsewhere, preserving the video title and continuously building searchable notes.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h5M8 17h3"/></svg>
            </div>
            <h3 className="feature-card-title">Source-Aware Context</h3>
            <p className="feature-card-desc">Automatically associates each session with the selected application and window title, so meeting and video notes remain recognizable later.</p>
          </div>

          {/* Card 1 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <h3 className="feature-card-title">Open AI Providers</h3>
            <p className="feature-card-desc">
              Plugin your own API key for DeepSeek (R1), Google Gemini, or OpenAI. Watch it process reasoning steps in a collapsible thinking box directly inside the note tab.
            </p>
          </div>

          {/* Card 2 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="17" x2="12" y2="22"></line>
                <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.56A2 2 0 0 1 15 9.2V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.2a2 2 0 0 1-.78 1.24l-2.78 3.56a2 2 0 0 0-.44 1.24V17z"></path>
              </svg>
            </div>
            <h3 className="feature-card-title">Real Always-on-Top</h3>
            <p className="feature-card-desc">
              Pins note above everything else. On macOS, this supports floating above full-screen spaces and virtual desktops, automatically hiding the Dock to prevent screen noise.
            </p>
          </div>

          {/* Card 3 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h3 className="feature-card-title">Auto-Dim Inactive States</h3>
            <p className="feature-card-desc">
              When clicking away, the note window automatically dims to a customized opacity value (like 45%), keeping it unobtrusive until you click back to make notes active.
            </p>
          </div>

          {/* Card 4 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <h3 className="feature-card-title">Alarms & Watch Tools</h3>
            <p className="feature-card-desc">
              Ditch separate timers. Track lap times on the Stopwatch, schedule a focus countdown on the Timer, or set an Alarm with built-in synthesized arpeggios that sound on time.
            </p>
          </div>

          {/* Card 5 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>
            <h3 className="feature-card-title">Draft Recovery Bin</h3>
            <p className="feature-card-desc">
              Accidentally wiped a text block and hit delete? The local recycle bin automatically stores deleted drafts. Open the history panel to restore them instantly.
            </p>
          </div>

          {/* Card 6 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="10" y1="14" x2="3" y2="21"></line>
              </svg>
            </div>
            <h3 className="feature-card-title">Header Collapse & Hover</h3>
            <p className="feature-card-desc">
              Minimize the widget into a neat 44px title bar by double-clicking the header. Hovering over it expands it temporarily to read contents, then collapses when you mouse out.
            </p>
          </div>
        </div>
      </section>

      {/* --- Open Source Community Section --- */}
      <section className="container testimonials-section">
        <div className="section-tagline">Built in the Open</div>
        <h2 className="section-title">Open Source & Community Driven</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="feature-icon-wrapper" style={{ margin: "0 auto 12px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </div>
            <h3 className="feature-card-title">100% Open Source</h3>
            <p className="feature-card-desc">
              Every line of code is public on GitHub. Fork it, customize it, contribute to it — this app belongs to the community.
            </p>
            <a href="https://github.com/Prince10z/MyStickyNote" target="_blank" rel="noopener noreferrer" className="btn-landing btn-landing-secondary" style={{ marginTop: "12px", fontSize: "12px", padding: "10px 20px" }} onClick={() => trackSiteEvent("click_github")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}>
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                <path d="M9 18c-4.51 2-5-2-7-2"></path>
              </svg>
              View on GitHub
            </a>
          </div>
          <div className="testimonial-card">
            <div className="feature-icon-wrapper" style={{ margin: "0 auto 12px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h3 className="feature-card-title">Privacy by Design</h3>
            <p className="feature-card-desc">
              No accounts, no cloud servers, no telemetry. Your notes and API keys never leave your machine. Verify it yourself in the source code.
            </p>
          </div>
          <div className="testimonial-card">
            <div className="feature-icon-wrapper" style={{ margin: "0 auto 12px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="feature-card-title">Built for Developers</h3>
            <p className="feature-card-desc">
              Created by a developer who was tired of clunky note apps hiding behind full-screen IDEs. Contributions, issues, and feature requests are welcome.
            </p>
          </div>
        </div>
      </section>

      {/* --- Comparison Section (SEO Optimization) --- */}
      <section id="compare" className="container comparison-section">
        <div className="section-tagline">Feature Showdown</div>
        <h2 className="section-title">Why Choose MyStickyNote?</h2>
        <p className="demo-desc">
          Compare MyStickyNote to standard system widgets. No other tool packs always-on-top overlays, dimming, alarms, and local AI reasoning.
        </p>
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>MyStickyNote</th>
                <th>Mac Stickies</th>
                <th>Windows Sticky Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>AI Deep Reasoning (R1/Gemini)</strong></td>
                <td><span className="comparison-check">Yes (Local Keys)</span></td>
                <td><span className="comparison-cross">No</span></td>
                <td><span className="comparison-cross">No</span></td>
              </tr>
              <tr>
                <td><strong>True Always-on-Top (IDE Float)</strong></td>
                <td><span className="comparison-check">Yes</span></td>
                <td><span className="comparison-cross">Yes</span></td>
                <td><span className="comparison-cross">No (loses focus)</span></td>
              </tr>
              <tr>
                <td><strong>Auto-Dim when Inactive</strong></td>
                <td><span className="comparison-check">Yes</span></td>
                <td><span className="comparison-cross">No</span></td>
                <td><span className="comparison-cross">No</span></td>
              </tr>
              <tr>
                <td><strong>Timer, Alarm & Stopwatch Widgets</strong></td>
                <td><span className="comparison-check">Yes</span></td>
                <td><span className="comparison-cross">No</span></td>
                <td><span className="comparison-cross">No</span></td>
              </tr>
              <tr>
                <td><strong>Draft Recovery Bin (Recycle)</strong></td>
                <td><span className="comparison-check">Yes</span></td>
                <td><span className="comparison-cross">No</span></td>
                <td><span className="comparison-cross">No</span></td>
              </tr>
              <tr>
                <td><strong>Zero Subscriptions & Local Storage</strong></td>
                <td><span className="comparison-check">Yes (Free)</span></td>
                <td><span className="comparison-check">Yes</span></td>
                <td><span className="comparison-check">Yes</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>


      {/* --- FAQ Section (SEO Schema helper) --- */}
      <section id="faq" className="container faq-section">
        <div className="section-tagline">Got Questions?</div>
        <h2 className="section-title" style={{ textAlign: "center" }}>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3 className="faq-question">How does the "Always on Top" mode work?</h3>
            <p className="faq-answer">
              When toggled, MyStickyNote pins itself above all active applications. On macOS, this includes full-screen spaces, IDEs, and virtual desktops. The Dock auto-hides momentarily to keep your coding environment distraction-free.
            </p>
          </div>
          <div className="faq-item">
            <h3 className="faq-question">Are my notes or API keys saved on any servers?</h3>
            <p className="faq-answer">
              Absolutely not. MyStickyNote is built with privacy in mind. All your note drafts, configs, and custom API keys for Google Gemini, OpenAI, or DeepSeek are stored locally on your machine.
            </p>
          </div>
          <div className="faq-item">
            <h3 className="faq-question">Is it possible to recover a note I deleted by mistake?</h3>
            <p className="faq-answer">
              Yes. Every note text block you delete is stored in the local History Recycle Bin. Simply click the History tab on the bottom navigation bar to preview and restore it.
            </p>
          </div>
          <div className="faq-item">
            <h3 className="faq-question">How do I get my own API key for DeepSeek or Gemini?</h3>
            <p className="faq-answer">
              You can easily register for API keys at DeepSeek's Developer Platform or Google's AI Studio. They offer free tier requests that are perfect for personal note expansion, summarizing, and brainstorming.
            </p>
          </div>
        </div>
      </section>

      {/* --- Download Section --- */}
      <section id="download" className="container download-section" style={{ position: "relative", zIndex: 20 }}>
        <div className="download-box">
          <div className="glass-badge yellow" style={{ position: "absolute", top: "-18px", left: "24px", margin: 0, display: "flex", alignItems: "center" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Ready to Install
          </div>
          <h2 className="download-title">Free & Open Source</h2>
          <p className="download-desc">
            No subscription. No tracking. Connect your own API keys for AI and keep all notes stored locally on your disk.
          </p>

          <div className="download-platforms">
            {/* macOS Card */}
            <div className="download-card" onClick={() => handleDownload("mac")}>
              {/* Apple SVG Logo */}
              <svg className="download-card-icon-wrapper" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.56 2.95-1.39z"/>
              </svg>
              <span className="download-card-title">macOS Client</span>
              <span className="download-card-meta">dmg • v1.0.0 • 74 MB</span>
              <button className="btn-landing btn-landing-primary">
                Download for Mac
              </button>
            </div>

            {/* Windows Card */}
            <div className="download-card" onClick={() => handleDownload("windows")}>
              {/* Windows SVG Logo */}
              <svg className="download-card-icon-wrapper" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM10.8 1.95L24 0v11.55H10.8V1.95zM10.8 12.45H24v11.55l-13.2-1.95v-9.6z"/>
              </svg>
              <span className="download-card-title">Windows App</span>
              <span className="download-card-meta">exe • v1.0.0 • 68 MB</span>
              <button className="btn-landing btn-landing-secondary">
                Download for Windows
              </button>
            </div>
          </div>

          <p className="system-reqs">
            Supports macOS 11.0 Big Sur or later (Apple Silicon/M1/M2/M3/Intel) and Windows 10/11 x64.
          </p>

          <div className="gatekeeper-notice" style={{
            marginTop: "20px",
            padding: "16px 20px",
            background: "rgba(0,0,0,0.06)",
            borderRadius: "12px",
            fontSize: "12px",
            lineHeight: "1.6",
            textAlign: "left",
            maxWidth: "520px",
            margin: "20px auto 0"
          }}>
            <strong style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "13px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              macOS Users: Opening an Unsigned App
            </strong>
            <span style={{ opacity: 0.85 }}>
              Since MyStickyNote is a free, open-source app distributed outside the Mac App Store, macOS Gatekeeper may show a security warning on first launch.
              To open it: <strong>Right-click</strong> (or Control-click) the app → click <strong>Open</strong> → click <strong>Open</strong> again.
              Alternatively, go to <strong>System Settings → Privacy &amp; Security</strong> and click <strong>Open Anyway</strong>.
            </span>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="footer" style={{ position: "relative", zIndex: 20 }}>
        <div className="container">
          <div className="footer-logo">
            <img src="/icon.png" alt="MyStickyNote Logo" className="logo-icon-img" style={{ width: 22, height: 22, borderRadius: 6 }} />
            <span>MyStickyNote</span>
          </div>
          <p style={{ fontSize: "11px", letterSpacing: "0.03em" }}>
            © 2026 MyStickyNote. Created by <a href="https://www.linkedin.com/in/piyush-thakur10z/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "inherit" }}>Piyush Thakur</a> (<a href="https://piyushportfolio.fastdeploy.in/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "inherit" }}>Portfolio</a>). Made for developers who write notes.
          </p>
          <p style={{ fontSize: "11px", letterSpacing: "0.03em", marginTop: "4px", opacity: 0.7 }}>
            Need support? Contact at <a href="mailto:piyush22122@gmail.com" style={{ textDecoration: "underline", color: "inherit" }}>piyush22122@gmail.com</a> or connect on <a href="https://www.linkedin.com/in/piyush-thakur10z/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "inherit" }}>LinkedIn</a>.
          </p>
        </div>
      </footer>
    </div>
  );
}
