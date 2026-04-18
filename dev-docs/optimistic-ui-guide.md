# Optimistic UI Implementation Guide

This guide documents the patterns and best practices for implementing optimistic UI updates in React/Next.js applications, based on real-world bug fixes in this codebase.

## Table of Contents

1. [What is Optimistic UI?](#what-is-optimistic-ui)
2. [Common Pitfalls](#common-pitfalls)
3. [The Complete Pattern](#the-complete-pattern)
4. [Parent-Child Data Synchronization](#parent-child-data-synchronization)
5. [Stable Prop References](#stable-prop-references)
6. [Avoiding Stale Closures](#avoiding-stale-closures)
7. [Complete Example](#complete-example)
8. [Checklist](#checklist)

---

## What is Optimistic UI?

Optimistic UI updates the interface **immediately** when a user performs an action, without waiting for the server to confirm. If the server request fails, the UI reverts to the previous state.

**Benefits:**
- Feels instant and responsive
- Better user experience for high-frequency interactions
- Hides network latency

**Risks:**
- Data can appear inconsistent if not handled correctly
- Re-renders can revert optimistic changes
- Stale closures can cause unexpected behavior

---

## Common Pitfalls

### Pitfall 1: Parent Re-render Resets Child State

**Problem:** When a parent component re-fetches data and passes a new object reference to a child, the child's `useEffect` may reset local state to the old prop value.

```tsx
// ❌ BAD: Parent doesn't update selected item after re-fetch
function ParentComponent() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [data, setData] = useState([]);

  async function fetchData(silent = false) {
    const result = await getData();
    setData(result.data);
    // BUG: selectedItem is NOT updated, so child receives stale data!
  }

  return <ChildComponent item={selectedItem} onRefresh={fetchData} />;
}
```

### Pitfall 2: New Object Reference on Every Render

**Problem:** Creating new objects inline in JSX causes `useEffect` dependencies to trigger unnecessarily.

```tsx
// ❌ BAD: New object created on every render
<ChildComponent item={{ ...selectedItem, extra: 'data' }} />

// This triggers useEffect on EVERY parent render:
useEffect(() => {
  setLocalItem(item); // Runs even when data hasn't changed!
}, [item]);
```

### Pitfall 3: Stale Closures in Async Callbacks

**Problem:** `useCallback` captures values at creation time. If a callback uses state in its closure, it may use stale values.

```tsx
// ❌ BAD: localTask is captured when callback is created
const handleRemove = useCallback(async (id) => {
  const snapshot = localTask; // May be stale!
  // ...
}, [localTask]); // Re-creates on every localTask change
```

---

## The Complete Pattern

### Step 1: Local State with Mutation Guard

```tsx
// Local copy of the data for optimistic updates
const [localTask, setLocalTask] = useState(task);

// Counter to track in-flight mutations
const pendingMutationsRef = useRef(0);

// Only sync with prop when no mutations are pending
useEffect(() => {
  if (pendingMutationsRef.current === 0) {
    setLocalTask(task);
  }
}, [task]);
```

### Step 2: Refs for Latest Values

Use refs to always access the current state in async callbacks:

```tsx
// Always-current refs for callbacks
const localTaskRef = useRef(localTask);
localTaskRef.current = localTask;

const taskPropRef = useRef(task);
taskPropRef.current = task;
```

### Step 3: Stable Prop Fingerprint

Use `useMemo` to create a stable identity for the incoming prop:

```tsx
// Only changes when actual content changes, not object reference
const taskFingerprint = useMemo(
  () => JSON.stringify({ id: task.id, status: task.status, items: task.items }),
  [task.id, task.status, task.items]
);

useEffect(() => {
  if (pendingMutationsRef.current === 0) {
    setLocalTask(task);
  }
  // Use fingerprint instead of task object
}, [taskFingerprint]);
```

### Step 4: Optimistic Update Handler

```tsx
const handleRemoveItem = useCallback(async (itemId: string) => {
  // Get latest state via ref (not closure)
  const snapshot = localTaskRef.current;

  // Block prop sync during mutation
  pendingMutationsRef.current += 1;

  // Optimistic update
  setLocalTask(prev => ({
    ...prev,
    items: prev.items.filter(item => item.id !== itemId)
  }));

  try {
    const result = await removeServiceItem(itemId);
    if (result.success) {
      pendingMutationsRef.current -= 1;
      onRefresh?.(); // Trigger silent re-fetch
    } else {
      pendingMutationsRef.current -= 1;
      setLocalTask(snapshot); // Revert on failure
    }
  } catch (err) {
    pendingMutationsRef.current -= 1;
    setLocalTask(snapshot); // Revert on error
  }
}, [onRefresh]); // Only onRefresh in deps, not localTask
```

---

## Parent-Child Data Synchronization

The parent must keep its selected item in sync with fresh server data:

```tsx
const fetchDashboardData = useCallback(async (silent = false) => {
  const result = await getDashboardData();
  
  if (result.success && result.data) {
    setDashboardData(result.data);

    // ✅ Keep selected item in sync with fresh data
    setSelectedTask(prev => {
      if (!prev) return prev;
      const fresh = result.data.tasks.find(t => t.id === prev.id);
      return fresh ?? null;
    });
  }
}, []);
```

---

## Stable Prop References

Use `useMemo` to prevent unnecessary re-renders and effect triggers:

```tsx
// ❌ BAD: New object on every render
<ChildComponent item={convertToItem(selectedItem)} />

// ✅ GOOD: Stable reference with useMemo
const selectedItemAsItem = useMemo(() => {
  if (!selectedItem) return null;
  return {
    id: selectedItem.id,
    name: selectedItem.name,
    // ... other fields
  };
}, [selectedItem]);

<ChildComponent item={selectedItemAsItem} />
```

---

## Avoiding Stale Closures

### The Problem

```tsx
// This callback captures `localTask` at creation time
const handler = useCallback(async () => {
  const snapshot = localTask; // Stale if localTask changed!
}, [localTask]); // Re-creates on every localTask change
```

### The Solution: Use Refs

```tsx
// Keep ref in sync
const localTaskRef = useRef(localTask);
localTaskRef.current = localTask;

// Callback reads from ref, not closure
const handler = useCallback(async () => {
  const snapshot = localTaskRef.current; // Always current!
}, []); // Stable, doesn't need localTask in deps
```

---

## Complete Example

### Parent Component

```tsx
"use client";

import { useState, useMemo, useCallback } from "react";

function ParentComponent() {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchDashboardData = useCallback(async (silent = false) => {
    const result = await getDashboardData();
    if (result.success && result.data) {
      setDashboardData(result.data);

      // Keep selectedTask in sync with fresh data
      setSelectedTask(prev => {
        if (!prev) return prev;
        const fresh = result.data.tasks.find(t => t.id === prev.id);
        return fresh ?? null;
      });
    }
  }, []);

  // Stable reference for child prop
  const selectedTaskItem = useMemo(() => {
    if (!selectedTask) return null;
    return {
      id: selectedTask.id,
      name: selectedTask.name,
      items: selectedTask.items,
    };
  }, [selectedTask]);

  return (
    <Sheet open={isOpen}>
      {selectedTaskItem && (
        <ChildComponent
          task={selectedTaskItem}
          onRefresh={() => fetchDashboardData(true)}
        />
      )}
    </Sheet>
  );
}
```

### Child Component

```tsx
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

interface TaskItem {
  id: string;
  name: string;
  items: Array<{ id: string; name: string }>;
}

function ChildComponent({ task, onRefresh }: { task: TaskItem; onRefresh?: () => void }) {
  // Local state for optimistic updates
  const [localTask, setLocalTask] = useState(task);

  // Refs for latest values (avoid stale closures)
  const localTaskRef = useRef(localTask);
  localTaskRef.current = localTask;

  const taskPropRef = useRef(task);
  taskPropRef.current = task;

  // Mutation guard
  const pendingMutationsRef = useRef(0);

  // Stable fingerprint for prop comparison
  const taskFingerprint = useMemo(
    () => JSON.stringify({ id: task.id, items: task.items }),
    [task.id, task.items]
  );

  // Sync with prop only when no mutations pending
  useEffect(() => {
    if (pendingMutationsRef.current === 0) {
      setLocalTask(task);
    }
  }, [taskFingerprint]);

  // Remove item handler
  const handleRemoveItem = useCallback(async (itemId: string) => {
    const snapshot = localTaskRef.current;
    pendingMutationsRef.current += 1;

    // Optimistic update
    setLocalTask(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));

    try {
      const result = await removeItem(itemId);
      if (result.success) {
        pendingMutationsRef.current -= 1;
        onRefresh?.();
      } else {
        pendingMutationsRef.current -= 1;
        setLocalTask(snapshot);
      }
    } catch (err) {
      pendingMutationsRef.current -= 1;
      setLocalTask(snapshot);
    }
  }, [onRefresh]);

  return (
    <div>
      {localTask.items.map(item => (
        <div key={item.id}>
          {item.name}
          <button onClick={() => handleRemoveItem(item.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

---

## Checklist

Before shipping optimistic UI, verify:

- [ ] **Local state initialized from prop** - `useState(task)` not `useState({})`
- [ ] **Mutation guard in place** - `pendingMutationsRef` blocks prop sync during mutations
- [ ] **Refs for latest values** - `localTaskRef.current` used in async callbacks
- [ ] **Stable prop fingerprint** - `useMemo` + `JSON.stringify` for effect dependency
- [ ] **Parent syncs selected item** - Updates `selectedItem` after silent re-fetch
- [ ] **Memoized prop conversion** - `useMemo` prevents new object on every render
- [ ] **Revert on failure** - Restore snapshot when server returns error
- [ ] **Silent re-fetch** - `fetchData(true)` doesn't show loading state

---

## Form Dialog Pattern

Form dialogs (create/edit) use a **simplified callback pattern** since they don't need to sync with parent props:

### Callback Interface

```tsx
interface FormDialogProps {
  // Optimistic callbacks (called BEFORE server request)
  onOptimisticCreate?: (tempItem: Item) => void;
  onOptimisticUpdate?: (updatedItem: Item) => void;
  
  // Success callback (called AFTER server success)
  onSuccess: (realItem?: Item) => void;
  
  // Revert callbacks (called on server failure)
  onRevertCreate?: () => void;
  onRevertUpdate?: () => void;
}
```

### Form Dialog Lifecycle

```tsx
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  
  const tempItem = { id: `temp-${Date.now()}`, ...formData };
  
  // 1. Optimistic callback - parent applies state change
  if (!isEditMode && onOptimisticCreate) {
    onOptimisticCreate(tempItem);
    onOpenChange(false);  // Close dialog immediately
  }
  
  if (isEditMode && onOptimisticUpdate) {
    onOptimisticUpdate(tempItem);
    onOpenChange(false);
  }
  
  // 2. Server request
  const result = await createItem(formData);
  
  // 3. Handle result
  if (result.success) {
    onSuccess(result.data);  // Parent decrements mutation guard, refreshes
  } else {
    // Revert callback - parent restores previous state
    if (!isEditMode && onRevertCreate) onRevertCreate();
    if (isEditMode && onRevertUpdate) onRevertUpdate();
    setError(result.error);
  }
}
```

### Parent Component Usage

```tsx
// Parent tracks mutations and applies optimistic state
const pendingMutationsRef = useRef(0);
const itemsRef = useRef(items);
itemsRef.current = items;

const handleOptimisticCreate = useCallback((tempItem: Item) => {
  pendingMutationsRef.current += 1;
  setItems(prev => [tempItem, ...prev]);
}, []);

const handleRevertCreate = useCallback(() => {
  pendingMutationsRef.current -= 1;
  setItems(itemsRef.current);  // Restore snapshot
}, []);

<FormDialog
  onOptimisticCreate={handleOptimisticCreate}
  onRevertCreate={handleRevertCreate}
  onSuccess={() => {
    pendingMutationsRef.current -= 1;
    router.refresh();
  }}
/>
```

### Refs in Form Dialogs

Use `useEffect` to update refs (not during render) to avoid React Compiler warnings:

```tsx
// ❌ BAD: Ref update during render
const itemRef = useRef(item);
itemRef.current = item;  // Error: Cannot update ref during render

// ✅ GOOD: Ref update in effect
const itemRef = useRef(item);
useEffect(() => {
  itemRef.current = item;
}, [item]);
```

### Form Dialog Implementations

| Component | Pattern |
|-----------|---------|
| `components/staff/services-form.tsx` | Create/update services |
| `components/admin/sparepart-form-dialog.tsx` | Create/update spareparts |
| `components/toko/toko-detail-sheet.tsx` | Create/update toko |

---

## Dashboard Overview Pattern

Dashboard overview components (admin/staff) use the full pattern for list management:

### Key Differences from Child Components

1. **Local state instead of prop sync** - `services` state initialized from `initialServices`
2. **Fingerprint for prop stability** - Prevents effect runs on object reference changes
3. **Delete handler included** - Optimistic removal with revert on failure

### Implementation

```tsx
const [services, setServices] = useState<ServiceTableItem[]>(initialServices);

const pendingMutationsRef = useRef(0);
const servicesRef = useRef(services);
servicesRef.current = services;

const servicesFingerprint = useMemo(
  () => JSON.stringify(initialServices.map(s => s.id)),
  [initialServices]
);

useEffect(() => {
  if (pendingMutationsRef.current === 0) {
    setServices(initialServices);
  }
}, [servicesFingerprint]);

const handleDeleteService = useCallback(async () => {
  const snapshot = servicesRef.current;
  pendingMutationsRef.current += 1;
  
  setServices(prev => prev.filter(s => s.id !== serviceId));
  
  const result = await deleteService(serviceId);
  
  if (result.success) {
    pendingMutationsRef.current -= 1;
    router.refresh();
  } else {
    pendingMutationsRef.current -= 1;
    setServices(snapshot);  // Revert
  }
}, [serviceId, router]);
```

### Dashboard Implementations

| Component | Features |
|-----------|----------|
| `components/dashboard/admin-overview.tsx` | Full pattern with fingerprint, refs, delete handler |
| `components/dashboard/staff-overview.tsx` | Full pattern with fingerprint, refs, delete handler |

---

## Key Takeaways

1. **Props are not reactive state** - They're snapshots from the parent. Use local state for optimistic updates.

2. **Guard prop sync during mutations** - Use a ref counter to block `useEffect` from resetting state while a mutation is in-flight.

3. **Refs solve stale closures** - Access current state via refs in async callbacks instead of relying on closure captures.

4. **Stable references matter** - Use `useMemo` to prevent unnecessary re-renders and effect triggers.

5. **Parent must sync** - After silent re-fetch, update any "selected" state that's passed to child components.

6. **Update refs in effects** - Never update refs during render to avoid React Compiler warnings.

---

## Related Files

- [`components/technician/service-task-card.tsx`](../components/technician/service-task-card.tsx) - Child component with optimistic updates
- [`components/dashboard/admin-overview.tsx`](../components/dashboard/admin-overview.tsx) - Dashboard with full pattern
- [`components/dashboard/staff-overview.tsx`](../components/dashboard/staff-overview.tsx) - Dashboard with full pattern
- [`components/staff/services-form.tsx`](../components/staff/services-form.tsx) - Form dialog with callbacks
- [`components/admin/sparepart-form-dialog.tsx`](../components/admin/sparepart-form-dialog.tsx) - Form dialog with callbacks
- [`components/toko/toko-detail-sheet.tsx`](../components/toko/toko-detail-sheet.tsx) - Form dialog with callbacks