#!/usr/bin/env python3
"""Second pass: handle ternary color expressions and remaining cases."""
import sys
from pathlib import Path

REPLACEMENTS = [
    # SVG stroke ternary (active tab icons)
    ('stroke={active ? "#3182f6" : "#8b95a1"}',
     'stroke={active ? "var(--c-blue)" : "var(--c-text-secondary)"}'),

    # Span color ternary in BottomTabBar
    ('color: activeTab === tab ? "#3182f6" : "#8b95a1"',
     'color: activeTab === tab ? "var(--c-blue)" : "var(--c-text-secondary)"'),

    # --- Active/selected button patterns ---
    # Daily goal / card order buttons (active = blue bg, white text)
    ('color: active ? "#ffffff" : "#333d4b"',
     'color: active ? "#ffffff" : "var(--c-text-body)"'),
    ('background: active ? "#3182f6" : "#f2f4f6"',
     'background: active ? "var(--c-blue)" : "var(--c-bg-input)"'),

    # Category/difficulty chips (selected = blue tint)
    ('color: selected ? "#3182f6" : "#6b7684"',
     'color: selected ? "var(--c-blue)" : "var(--c-text-caption)"'),
    ('background: selected ? "#e8f3ff" : "#f2f4f6"',
     'background: selected ? "var(--c-blue-tint)" : "var(--c-bg-input)"'),

    # Day-of-week notification buttons
    ('color: active ? "#3182f6" : "#8b95a1"',
     'color: active ? "var(--c-blue)" : "var(--c-text-secondary)"'),
    ('background: active ? "#e8f3ff" : "#f2f4f6"',
     'background: active ? "var(--c-blue-tint)" : "var(--c-bg-input)"'),

    # TermsPage tab
    ('color: active ? "#3182f6" : "#8b95a1",',
     'color: active ? "var(--c-blue)" : "var(--c-text-secondary)",'),

    # Overlays
    ('background: "rgba(25,31,40,0.5)"', 'background: "var(--c-overlay)"'),

    # Box shadows
    ('"0 1px 3px rgba(25,31,40,0.15)"', '"0 1px 3px var(--c-shadow)"'),
    ('"0 1px 3px rgba(25,31,40,0.04)"', '"0 1px 3px var(--c-shadow)"'),
    ('"0 4px 24px rgba(25,31,40,0.10)"', '"0 4px 24px var(--c-shadow)"'),

    # StudyCardPage: progress bar bg, border
    ('background: "#e5e8eb", borderRadius: 2', 'background: "var(--c-border)", borderRadius: 2'),
    ('border: "2px solid #e5e8eb"', 'border: "2px solid var(--c-border)"'),

    # StudyCard swipe-hint card background
    ('background: swipeHint === "easy" ? "#e8f3ff" : swipeHint === "hard" ? "#fff1f0" : "#ffffff"',
     'background: swipeHint === "easy" ? "var(--c-blue-tint)" : swipeHint === "hard" ? "var(--c-red-tint)" : "var(--c-bg-card)"'),

    # SettingsPage: feedback send button
    ('background: text.trim() ? "#3182f6" : "#e5e8eb"',
     'background: text.trim() ? "var(--c-blue)" : "var(--c-border)"'),
    ('color: text.trim() ? "#ffffff" : "#8b95a1"',
     'color: text.trim() ? "#ffffff" : "var(--c-text-secondary)"'),

    # OnboardingPage step dots
    ('background: i <= step ? "#3182f6" : "#e5e8eb"',
     'background: i <= step ? "var(--c-blue)" : "var(--c-border)"'),

    # OnboardingPage: border on card
    ('border: "1.5px solid #e5e8eb"', 'border: "1.5px solid var(--c-border)"'),

    # OnboardingPage inner tag outline (small dots in category chip)
    ('background: selected ? "#c9e2ff" : "#e5e8eb"',
     'background: selected ? "var(--c-blue-tint)" : "var(--c-border)"'),
]

FILES = [
    "src/App.tsx",
    "src/pages/SettingsPage.tsx",
    "src/pages/StudyCardPage.tsx",
    "src/pages/OnboardingPage.tsx",
    "src/pages/TermsPage.tsx",
]

def apply(path: Path, dry_run=False):
    content = path.read_text(encoding="utf-8")
    original = content
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    if content != original:
        changed = sum(1 for a, b in zip(original.splitlines(), content.splitlines()) if a != b)
        print(f"  {path}: {changed} lines changed")
        if not dry_run:
            path.write_text(content, encoding="utf-8")
    else:
        print(f"  {path}: no changes")

root = Path("/home/yoojins2/dj-nativefit")
dry = "--dry" in sys.argv
if dry:
    print("DRY RUN")
for f in FILES:
    apply(root / f, dry_run=dry)
print("Done.")
