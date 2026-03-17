# Full-Screen Chatbot Design Specification

## Overview
Redesign the trial signup chatbot from a small popup widget to a full-screen messaging interface that mimics modern messaging apps on desktop and native texting apps on mobile.

## Desktop Layout (≥768px)

### Structure
```
┌─────────────────────────────────────────────────────────┐
│ Header                                                   │
│ ┌─────────┐ MYDOJO ASSISTANT                      [X]   │
│ │  Logo   │ Start Your Free Trial                       │
│ └─────────┘                                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Messages Area (scrollable)                              │
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │ Bot: Hey there! 👋 Ready to start...     │           │
│  │ 2:30 PM · Read                            │           │
│  └──────────────────────────────────────────┘           │
│                                                          │
│           ┌──────────────────────────────────┐          │
│           │ User: John Doe                    │          │
│           │ 2:31 PM · Delivered               │          │
│           └──────────────────────────────────┘          │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ Input Area                                               │
│ ┌─────────────────────────────────────────────────┐     │
│ │ Type your message...                      [Send]│     │
│ └─────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### Features
- Full-screen overlay with semi-transparent backdrop
- Clean white background for message area
- Bot messages: left-aligned, light gray background
- User messages: right-aligned, MyDojo red background, white text
- Message status: "Sending...", "Sent", "Delivered", "Read"
- Typing indicator with three bouncing dots
- Close button (X) in top-right corner

## Mobile Layout (<768px)

### Structure
```
┌─────────────────────────┐
│ ← MYDOJO ASSISTANT      │
│   Start Your Free Trial │
├─────────────────────────┤
│                         │
│  Messages (full-screen) │
│                         │
│  Bot: Hey there! 👋     │
│  2:30 PM · Read         │
│                         │
│         User: John Doe  │
│         2:31 PM · Read  │
│                         │
├─────────────────────────┤
│ Type message...   [Send]│
└─────────────────────────┘
```

### Features
- Full-screen takeover (100vh)
- Back arrow (←) to close chat
- Native texting app aesthetic
- Messages fill entire width with padding
- Status indicators below each message
- Auto-scroll to latest message
- Keyboard-aware layout (input stays above keyboard)

## Message Status Indicators

### States
1. **Sending** - Gray clock icon, "Sending..."
2. **Sent** - Single gray checkmark, "Sent"
3. **Delivered** - Double gray checkmarks, "Delivered"
4. **Read** - Double blue checkmarks, "Read"

### Implementation
- Bot messages always show "Read" immediately (user sees them)
- User messages progress through states:
  - Sending → Sent (immediate after submit)
  - Sent → Delivered (after bot receives, ~500ms)
  - Delivered → Read (after bot responds, ~1-2s)

## Button Groups
When bot shows button options (e.g., "Who are the lessons for?"):
- Desktop: Horizontal button grid, max 2 columns
- Mobile: Vertical stack, full-width buttons
- Buttons styled like quick-reply chips in messaging apps

## Animations
- Messages slide in from bottom with fade
- Typing indicator bounces smoothly
- Status changes animate (checkmark transitions)
- Smooth scroll to new messages

## Color Scheme
- Bot messages: `bg-gray-100 text-gray-900`
- User messages: `bg-primary (red) text-white`
- Status text: `text-gray-500 text-xs`
- Read checkmarks: `text-blue-500`
- Background: `bg-white`
- Backdrop: `bg-black/50`

## Responsive Breakpoints
- Mobile: `< 768px` - Full-screen native texting interface
- Desktop: `≥ 768px` - Full-screen messaging app interface

## Accessibility
- Keyboard navigation (Tab, Enter to send)
- Screen reader announcements for new messages
- Focus management when opening/closing
- Escape key to close on desktop
- ARIA labels for status indicators
