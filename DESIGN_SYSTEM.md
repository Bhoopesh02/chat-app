# Firebase App Design System & Reusable Components Documentation

Welcome to the **Firebase Chat App Design System**. This document defines the design rules, color semantics, typography hierarchy, and usage guide for the reusable UI components in `src/components/ui/`.

---

## 🎨 Theme & Color Specification

All colors are controlled through CSS Custom Properties defined in `src/styles/global.css` and `src/components/ui/ui.css`.

### Semantic Color Matrix

```css
:root {
  --primary-color: #18a999;        /* Primary CTA buttons, active state highlights, focus rings */
  --primary-color-hover: #148f81;  /* Hover state for primary buttons */
  --background-color: #f5f7fa;     /* App background canvas */
  --surface-color: #ffffff;        /* Modals, popovers, dropdowns, card containers */
  --surface-color-hover: #f9fafb;  /* Interactive hover background for items */
  --text-primary: #1f2937;         /* High-contrast text for h1-h4, main messages, inputs */
  --text-secondary: #6b7280;       /* Subtitles, timestamps, placeheld text, captions */
  --text-light: #9ca3af;           /* Disabled text, tertiary hints, subtle borders */
  --border-color: #e5e7eb;         /* Panel outlines, input borders, list item dividers */
  --danger-color: #ef4444;         /* Destructive buttons (Delete, Leave Group), error alerts */
  --success-color: #10b981;        /* Online status badges, active indicators, success toasts */
  --warning-color: #f59e0b;        /* Pending status indicators, unread counts */
}
```

---

## ✒️ Typography Hierarchy & Rules

### Font Stacks
- **UI & Headings**: `'Inter', system-ui, -apple-system, sans-serif` (`var(--sans)`)
- **Code & Numbers**: `ui-monospace, Consolas, monospace` (`var(--mono)`)

### Heading & Text Scale

| Element / Variant | Props / Level | Size | Weight | Line Height | Reason & Context |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `<h1>` | `<Heading level={1}>` | `2.25rem` (36px) | `700` (Bold) | `1.2` | Page headlines and auth screen headers. |
| `<h2>` | `<Heading level={2}>` | `1.5rem` (24px) | `600` (SemiBold) | `1.3` | Modal titles, top view header titles. |
| `<h3>` | `<Heading level={3}>` | `1.25rem` (20px) | `600` (SemiBold) | `1.4` | User display names, group chat headers. |
| `<h4>` | `<Heading level={4}>` | `1.0rem` (16px) | `500` (Medium) | `1.4` | Form field labels, dropdown section headers. |
| `body` | `<Text variant="body">` | `0.9375rem` (15px) | `400` (Regular) | `1.5` | Standard chat message bubbles and body copy. |
| `lead` | `<Text variant="lead">` | `1.0625rem` (17px) | `400` (Regular) | `1.6` | Summary paragraphs beneath main titles. |
| `caption` | `<Text variant="caption">` | `0.75rem` (12px) | `400` (Regular) | `1.4` | Timestamps, status subtitles, email tags. |
| `code` | `<Text variant="code">` | `0.875rem` (14px) | `500` (Medium) | `1.4` | Monospace code blocks and counters. |

---

## 🧩 Reusable Components Quick Reference (`src/components/ui/`)

### 1. Typography: `Heading` & `Text`
```jsx
import { Heading, Text } from './components/ui';

// Headings
<Heading level={1}>Main Page Title</Heading>
<Heading level={2} color="primary">Modal Header</Heading>

// Text
<Text variant="body">Standard chat body message</Text>
<Text variant="caption" color="secondary">10:45 AM</Text>
```

### 2. `Button`
```jsx
import { Button } from './components/ui';

<Button variant="primary" size="md" onClick={handleSave}>Save</Button>
<Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>Delete</Button>
<Button variant="ghost" icon={<X size={18} />} onClick={onClose} aria-label="Close" />
```

### 3. `Modal`
```jsx
import { Modal, Button } from './components/ui';

<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Delete Message"
  footer={
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="danger" onClick={onDelete}>Delete</Button>
    </>
  }
>
  <Text variant="body">Are you sure you want to delete this message?</Text>
</Modal>
```

### 4. `Input`
```jsx
import { Input } from './components/ui';
import { Search } from 'lucide-react';

<Input
  label="Search Users"
  placeholder="Type a name..."
  leftIcon={<Search size={18} />}
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  error={queryError}
/>
```

### 5. `Avatar`
```jsx
import { Avatar } from './components/ui';

<Avatar name="Alex Johnson" src={user.avatar} size="md" status="online" />
```

### 6. `Badge`
```jsx
import { Badge } from './components/ui';

<Badge variant="unread">5</Badge>
<Badge variant="success">Online</Badge>
```

### 7. `Card`
```jsx
import { Card, CardHeader, CardBody } from './components/ui';

<Card hoverable onClick={selectItem}>
  <CardHeader title="Group Chat" subtitle="12 members" />
  <CardBody>Latest message content...</CardBody>
</Card>
```

### 8. `Spinner`, `Toast`, `Dropdown`
```jsx
import { Spinner, Toast, Dropdown } from './components/ui';

<Spinner size="md" color="primary" />
<Toast type="success" message="Changes saved successfully!" onClose={dismiss} />
```
