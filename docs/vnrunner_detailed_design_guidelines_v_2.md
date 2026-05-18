# VNRunner Detailed Design Guidelines

## Overview

VNRunner is an AI-powered race discovery and running ecosystem focused on performance, motivation, community, and intelligent personalization.

The design language should communicate:

- Motion
- Energy
- Athletic achievement
- Technical intelligence
- Premium digital experience
- Confidence and clarity

The visual system combines immersive dark interfaces with vibrant orange accents to create a modern athletic product identity.

---

# 1. Brand Foundation

## 1.1 Brand Personality

| Attribute | Design Interpretation |
|---|---|
| Energetic | Dynamic layouts, motion transitions, strong CTAs |
| Modern | Minimal interfaces, clean spacing, simple geometry |
| Premium | Elegant dark surfaces, restrained color usage |
| Intelligent | AI-driven UI patterns and predictive experiences |
| Athletic | Performance dashboards, movement-inspired visuals |
| Motivational | Achievement-focused interactions and microcopy |

---

# 2. Visual Identity

## 2.1 Design Philosophy

VNRunner interfaces should feel:

- Fast
- Lightweight
- Focused
- Immersive
- Intelligent
- Motivating

The UI should avoid:

- Heavy skeuomorphic styling
- Excessive gradients
- Crowded interfaces
- Dense text blocks
- Unnecessary decorative elements

The design should prioritize:

- Readability
- Scannability
- Performance visibility
- AI-driven guidance
- Conversion optimization

---

# 3. Color System

## 3.1 Primary Palette

| Token | Hex | Usage |
|---|---|---|
| Primary Orange | #FF5A1F | Primary CTA, highlights, AI indicators |
| Background Dark | #0F0E0C | App background |
| Surface Dark | #1A1815 | Cards, containers |
| Text Primary | #FAF7F2 | Main text |
| Text Secondary | rgba(255,255,255,0.6) | Secondary text |

---

## 3.2 Extended Color Palette

### Neutral Scale

| Token | Hex |
|---|---|
| Neutral 900 | #0F0E0C |
| Neutral 800 | #1A1815 |
| Neutral 700 | #24211D |
| Neutral 600 | #302C27 |
| Neutral 500 | #4B463F |
| Neutral 400 | #706960 |
| Neutral 300 | #9C958B |
| Neutral 200 | #C7C0B7 |
| Neutral 100 | #FAF7F2 |

---

## 3.3 Semantic Colors

| Semantic | Hex | Usage |
|---|---|---|
| Success | #22C55E | Completed runs, achievements |
| Warning | #F59E0B | Registration urgency |
| Error | #EF4444 | Failed actions, alerts |
| Info | #3B82F6 | Informational states |

---

## 3.4 Color Usage Rules

### Orange Accent Guidelines

Use orange for:

- Primary actions
- AI recommendations
- Interactive states
- Selected items
- Achievement indicators
- Performance highlights
- Urgent race actions

Do not use orange for:

- Large reading surfaces
- Dense backgrounds
- Full-page fills
- Excessive repeated UI elements

Recommended ratio:

- 80% dark neutrals
- 15% white typography
- 5% accent orange

---

# 4. Typography System

## 4.1 Font Strategy

Primary font stack:

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  sans-serif;
```

Recommended alternatives:

- Inter
- SF Pro Display
- Geist
- Manrope

---

## 4.2 Typography Principles

Typography should feel:

- Confident
- Athletic
- Modern
- High contrast
- Minimal
- Readable

Avoid:

- Decorative fonts
- Condensed typography
- Thin low-contrast weights
- Excessive uppercase usage

---

## 4.3 Typography Scale

| Style | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| Display XL | 64px | 700 | 72px | Hero sections |
| Display L | 48px | 700 | 56px | Landing headers |
| H1 | 36px | 600 | 44px | Page titles |
| H2 | 28px | 600 | 36px | Section titles |
| H3 | 22px | 500 | 30px | Card headings |
| Body Large | 18px | 400 | 28px | Intro text |
| Body | 16px | 400 | 24px | Main content |
| Caption | 13px | 400 | 18px | Metadata |
| Micro | 11px | 500 | 14px | Labels |

---

## 4.4 Typography Usage

### Headlines

- Use short impactful statements
- Maintain strong hierarchy
- Limit line length to 2–3 lines
- Prefer sentence case

### Body Text

- Maintain 16px minimum size
- Use high contrast
- Keep paragraphs short
- Optimize for mobile readability

---

# 5. Layout System

## 5.1 Grid System

| Device | Columns | Margin |
|---|---|---|
| Mobile | 4 | 16px |
| Tablet | 8 | 24px |
| Desktop | 12 | 32px |

---

## 5.2 Layout Principles

Interfaces should:

- Use generous spacing
- Emphasize vertical rhythm
- Prioritize content hierarchy
- Use immersive full-width sections
- Minimize visual clutter

Preferred patterns:

- Card-based layouts
- Layered dark surfaces
- Modular sections
- Sticky contextual navigation

---

## 5.3 Spacing System

Base spacing unit: 4px

| Token | Value |
|---|---|
| XS | 4px |
| SM | 8px |
| MD | 16px |
| LG | 24px |
| XL | 32px |
| XXL | 48px |
| XXXL | 64px |

---

## 5.4 Content Widths

| Content Type | Width |
|---|---|
| Reading Content | 720px |
| Dashboard Content | 1280px |
| Hero Sections | Full width |
| Cards | Responsive |

---

# 6. Elevation & Surfaces

## 6.1 Surface Hierarchy

| Level | Usage |
|---|---|
| Background | Main app background |
| Surface | Cards and panels |
| Elevated | Modals and overlays |
| Floating | Navigation and action buttons |

---

## 6.2 Shadows

### Card Shadow

```css
box-shadow:
  0 1px 4px rgba(0,0,0,0.12);
```

### Modal Shadow

```css
box-shadow:
  0 10px 30px rgba(0,0,0,0.35);
```

---

# 7. Border Radius System

| Token | Value |
|---|---|
| Small | 6px |
| Medium | 10px |
| Large | 16px |
| XL | 24px |
| Pill | 999px |

Guidelines:

- Use larger radii for modern premium feel
- Keep consistency across components
- Use pill radius for tags and chips

---

# 8. Navigation Design

## 8.1 Desktop Navigation

Structure:

- Left aligned logo
- Center navigation menu
- Right action area
- Sticky top behavior

Navigation items:

- Discover
- Races
- Community
- Training
- AI Coach
- Dashboard

---

## 8.2 Mobile Navigation

Use:

- Bottom tab navigation
- Large touch targets
- Gesture-friendly spacing
- Floating quick actions

Recommended tabs:

- Home
- Discover
- Saved
- Community
- Profile

---

# 9. Button System

## 9.1 Primary Buttons

| Property | Value |
|---|---|
| Background | #FF5A1F |
| Text | #FFFFFF |
| Radius | 10px |
| Height | 48px |

States:

- Default
- Hover
- Active
- Focused
- Disabled
- Loading

Behavior:

- Strong contrast
- Clear action language
- Subtle hover animation
- Instant interaction feedback

---

## 9.2 Secondary Buttons

| Property | Value |
|---|---|
| Background | Transparent |
| Border | 1px solid rgba(255,255,255,0.12) |
| Text | #FAF7F2 |

Usage:

- Secondary actions
- Filters
- Modals
- Less prominent navigation

---

## 9.3 Ghost Buttons

Use for:

- Minimal actions
- Toolbar interactions
- Inline actions

Avoid overusing ghost buttons in critical flows.

---

# 10. Form Controls

## 10.1 Input Fields

| Property | Value |
|---|---|
| Background | #1A1815 |
| Border | rgba(255,255,255,0.08) |
| Focus Border | #FF5A1F |
| Radius | 10px |

---

## 10.2 Form Guidelines

Forms should:

- Minimize friction
- Use progressive disclosure
- Show immediate validation
- Prioritize mobile usability
- Reduce typing whenever possible

Use:

- Smart defaults
- AI autofill
- Inline validation
- Clear labels
- Helpful placeholder text

---

# 11. Card Design

## 11.1 Standard Card

| Property | Value |
|---|---|
| Background | #1A1815 |
| Padding | 24px |
| Radius | 16px |
| Border | 1px solid rgba(255,255,255,0.06) |

---

## 11.2 Card Principles

Cards should:

- Be highly scannable
- Emphasize primary metrics
- Use layered spacing
- Maintain strong visual hierarchy
- Support responsive layouts

---

## 11.3 Race Cards

Race cards should prioritize:

- Race image
- Distance
- Date
- Location
- Urgency
- Popularity
- Registration CTA

Use AI highlights for:

- Personalized matches
- Trending races
- Best-fit recommendations

---

# 12. AI Experience Design

## 12.1 AI Personality

AI should feel:

- Intelligent
- Helpful
- Predictive
- Human-centered
- Encouraging
- Non-intrusive

Avoid:

- Robotic messaging
- Excessive notifications
- Overly technical language

---

## 12.2 AI UI Patterns

Use:

- Recommendation cards
- Confidence indicators
- AI explanation labels
- Predictive suggestions
- Personalized onboarding

Visual cues:

- Orange glow accents
- Soft gradients
- Highlight borders
- Smart suggestion chips

---

## 12.3 AI Copywriting

Tone should be:

- Motivational
- Clear
- Friendly
- Performance-focused

Examples:

- “Recommended for your next PR.”
- “Best race for your current training load.”
- “Trending among runners like you.”

---

# 13. Motion Design

## 13.1 Motion Principles

Animations should be:

- Fast
- Responsive
- Purposeful
- Smooth
- Lightweight

Avoid:

- Excessive bouncing
- Slow transitions
- Distracting effects

---

## 13.2 Motion Timing

| Token | Duration |
|---|---|
| Fast | 120ms |
| Normal | 220ms |
| Slow | 350ms |

---

## 13.3 Easing

```css
cubic-bezier(0.4, 0, 0.2, 1)
```

---

## 13.4 Recommended Animations

Use:

- Fade in
- Slide up
- Scale hover
- Loading shimmer
- Skeleton transitions
- Progress animations

Avoid:

- Heavy parallax
- Excessive rotation
- Long motion sequences

---

# 14. Data Visualization

## 14.1 Chart Guidelines

Charts should:

- Use minimal axes
- Emphasize key metrics
- Use dark backgrounds
- Maintain high contrast
- Use orange for highlights

---

## 14.2 Important Metrics

Prioritize:

- Pace
- Distance
- Elevation
- Heart rate
- Weekly volume
- Race popularity
- Registration urgency
- Training consistency

---

## 14.3 Visualization Style

Preferred styles:

- Rounded bars
- Smooth line charts
- Minimal labels
- Interactive tooltips
- Clean spacing

---

# 15. Accessibility

## 15.1 Accessibility Standards

Target:

- WCAG AA minimum
- Prefer AAA for text-heavy areas

---

## 15.2 Touch Targets

Minimum size:

- 44x44px

---

## 15.3 Accessibility Rules

Ensure:

- High contrast text
- Keyboard navigation
- Visible focus states
- Screen reader compatibility
- Clear error messaging

Avoid:

- Low-contrast UI
- Tiny tap areas
- Color-only indicators

---

# 16. Responsive Design

## 16.1 Breakpoints

| Device | Width |
|---|---|
| Mobile | < 768px |
| Tablet | 768px–1024px |
| Desktop | > 1024px |

---

## 16.2 Mobile-First Guidelines

Design mobile-first.

Prioritize:

- Vertical scrolling
- Thumb-friendly actions
- Simplified navigation
- Quick race discovery
- Fast loading states

---

# 17. Imagery & Media

## 17.1 Photography Style

Images should:

- Capture motion
- Show authentic runners
- Use cinematic lighting
- Feel aspirational
- Maintain high contrast

Avoid:

- Overly staged imagery
- Stock-looking photography
- Flat lighting

---

## 17.2 Illustration Style

Illustrations should be:

- Minimal
- Geometric
- Modern
- Motion-oriented

---

# 18. Iconography

## 18.1 Icon Style

Icons should be:

- Line-based
- Rounded
- Minimal
- Consistent stroke width

Recommended libraries:

- Lucide
- Heroicons
- Material Symbols Rounded

---

# 19. Empty States

## 19.1 Empty State Principles

Empty states should:

- Educate users
- Encourage action
- Maintain motivation
- Provide next steps

Examples:

- “No races saved yet.”
- “Let AI recommend your next challenge.”

---

# 20. Loading States

## 20.1 Loading Experience

Use:

- Skeleton loaders
- Progressive rendering
- Animated placeholders
- Optimistic UI patterns

Avoid:

- Blank screens
- Blocking overlays
- Long spinner-only experiences

---

# 21. Notification Design

## 21.1 Notification Types

| Type | Usage |
|---|---|
| Success | Registration completed |
| Info | Race reminders |
| Warning | Registration closing soon |
| Error | Failed payment |

---

## 21.2 Notification Behavior

Notifications should:

- Be contextual
- Avoid interruption
- Support quick actions
- Prioritize relevance

---

# 22. Gamification Guidelines

## 22.1 Achievement Design

Achievements should:

- Feel rewarding
- Use celebratory motion
- Highlight milestones
- Encourage progression

Potential systems:

- Streaks
- Badges
- Milestone medals
- AI performance insights

---

# 23. Design Tokens

## 23.1 Example Token Structure

```json
{
  "colors": {
    "primary": "#FF5A1F",
    "background": "#0F0E0C",
    "surface": "#1A1815",
    "textPrimary": "#FAF7F2"
  },
  "radius": {
    "md": "10px",
    "lg": "16px"
  },
  "spacing": {
    "sm": "8px",
    "md": "16px",
    "lg": "24px"
  }
}
```

---

# 24. Recommended Technology Stack

## Frontend

- React
- Next.js
- TailwindCSS
- Framer Motion

---

## Mobile

- React Native
- Expo

---

## Design Tools

- Figma
- Figma AI
- Tokens Studio
- Storybook

---

# 25. Design QA Checklist

Before shipping designs, verify:

- Visual consistency
- Responsive behavior
- Accessibility compliance
- Motion performance
- Dark mode quality
- AI UI clarity
- Typography hierarchy
- Interaction consistency
- Loading state coverage
- Empty state handling

---

# 26. Future Design Extensions

Planned expansions:

- Light mode
- AMOLED mode
- Organizer dashboard
- Wearable UI system
- AI coach assistant visuals
- Community gamification system
- Advanced analytics dashboard

---

# 27. Final Design Principles

VNRunner should always feel:

- Motivational
- Fast
- Intelligent
- Premium
- Human-centered
- Athletic
- Modern

Every interface should help runners:

- Discover races faster
- Stay motivated
- Improve performance
- Feel part of a running community
- Trust AI-driven recommendations

