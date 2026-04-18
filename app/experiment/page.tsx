"use client";

import useSWR, { SWRConfig, useSWRConfig, mutate } from "swr";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth-provider";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

const slowFetcher = async (url: string) => {
  await new Promise((r) => setTimeout(r, 2000));
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

function BasicFetch() {
  const { data, error, isLoading, isValidating } = useSWR(
    "https://jsonplaceholder.typicode.com/posts/1",
    fetcher
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Basic Data Fetching</CardTitle>
        <CardDescription>Simple fetch with loading, error, and data states</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge variant={isLoading ? "default" : "secondary"}>Loading: {String(isLoading)}</Badge>
          <Badge variant={isValidating ? "default" : "secondary"}>Validating: {String(isValidating)}</Badge>
          <Badge variant={error ? "destructive" : "secondary"}>Error: {String(!!error)}</Badge>
        </div>
        {error && <pre className="text-red-500 text-sm">{error.message}</pre>}
        {data && <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(data, null, 2)}</pre>}
      </CardContent>
    </Card>
  );
}

function ConditionalFetching() {
  const [userId, setUserId] = useState<string>("");
  const [enabled, setEnabled] = useState(true);

  const { data } = useSWR(
    enabled && userId ? `https://jsonplaceholder.typicode.com/users/${userId}` : null,
    fetcher
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Conditional Fetching</CardTitle>
        <CardDescription>Fetch only when condition is met (null key = no fetch)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span className="text-sm">Enable fetching</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Enter user ID (1-10)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="max-w-[200px]"
          />
          <Button variant="outline" size="sm" onClick={() => setUserId("1")}>User 1</Button>
          <Button variant="outline" size="sm" onClick={() => setUserId("2")}>User 2</Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Key: {enabled && userId ? `"users/${userId}"` : "null (no fetch)"}
        </p>
        {data && <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(data, null, 2)}</pre>}
      </CardContent>
    </Card>
  );
}

function Revalidation() {
  const { data, mutate: revalidate } = useSWR(
    "https://jsonplaceholder.typicode.com/posts/2",
    fetcher,
    { revalidateOnFocus: true }
  );
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleRevalidate = async () => {
    await revalidate();
    setLastUpdate(new Date());
  };

  const handleMutate = async () => {
    await revalidate({ title: "Locally mutated!", body: "This is local data", id: 2 }, false);
    setLastUpdate(new Date());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Manual Revalidation</CardTitle>
        <CardDescription>Control when data is refreshed from server</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleRevalidate}>Revalidate (refetch)</Button>
          <Button size="sm" variant="secondary" onClick={handleMutate}>Set Local Data</Button>
        </div>
        {lastUpdate && <p className="text-xs text-muted-foreground">Last update: {lastUpdate.toLocaleTimeString()}</p>}
        {data && <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(data, null, 2)}</pre>}
      </CardContent>
    </Card>
  );
}

function ErrorHandling() {
  const [shouldFail, setShouldFail] = useState(false);
  const { data, error, isLoading } = useSWR(
    shouldFail ? "https://jsonplaceholder.typicode.com/invalid-endpoint" : "https://jsonplaceholder.typicode.com/posts/3",
    fetcher,
    {
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 1000);
      },
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>4. Error Handling & Retry</CardTitle>
        <CardDescription>Automatic retry with configurable behavior</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button size="sm" variant={shouldFail ? "destructive" : "outline"} onClick={() => setShouldFail(true)}>
            Trigger Error
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShouldFail(false)}>
            Fix Endpoint
          </Button>
        </div>
        {isLoading && <Badge>Loading...</Badge>}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded text-sm text-red-600 dark:text-red-400">
            Error: {error.message}
          </div>
        )}
        {data && <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(data, null, 2)}</pre>}
      </CardContent>
    </Card>
  );
}

function Polling() {
  const [polling, setPolling] = useState(false);
  const [count, setCount] = useState(0);

  useSWR(
    polling ? `https://jsonplaceholder.typicode.com/posts/${count % 10 + 1}` : null,
    fetcher,
    {
      refreshInterval: 2000,
      onSuccess: () => setCount((c) => c + 1),
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>5. Polling / Real-time Updates</CardTitle>
        <CardDescription>Auto-refresh data at intervals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 items-center">
          <Button size="sm" onClick={() => setPolling(!polling)}>
            {polling ? "Stop Polling" : "Start Polling"}
          </Button>
          {polling && <Badge className="animate-pulse">Polling every 2s</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">Fetches: {count} | Change post ID: {(count % 10) + 1}</p>
      </CardContent>
    </Card>
  );
}

function Deduplication() {
  const [requests, setRequests] = useState<string[]>([]);

  const dedupeFetcher = async (url: string) => {
    setRequests((r) => [...r, `Request at ${new Date().toLocaleTimeString()}`]);
    const res = await fetch(url);
    return res.json();
  };

  useSWR("https://jsonplaceholder.typicode.com/posts/5", dedupeFetcher, { dedupingInterval: 5000 });
  useSWR("https://jsonplaceholder.typicode.com/posts/5", dedupeFetcher, { dedupingInterval: 5000 });
  useSWR("https://jsonplaceholder.typicode.com/posts/5", dedupeFetcher, { dedupingInterval: 5000 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>6. Request Deduplication</CardTitle>
        <CardDescription>Multiple hooks with same key = single request</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">3 useSWR calls with the same key - only 1 network request!</p>
        <div className="text-sm bg-muted p-2 rounded max-h-32 overflow-auto">
          {requests.map((r, i) => (
            <div key={i}>{r}</div>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => setRequests([])}>Clear Log</Button>
      </CardContent>
    </Card>
  );
}

function OptimisticUI() {
  const [todos, setTodos] = useState([
    { id: 1, title: "Learn SWR", completed: false },
    { id: 2, title: "Build awesome app", completed: false },
  ]);

  const { data, mutate: updateTodos } = useSWR("local-todos", () => todos, {
    fallbackData: todos,
  });

  const toggleTodo = async (id: number) => {
    const updatedTodos = (data || []).map((t: any) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );

    await updateTodos(updatedTodos, false);
    setTodos(updatedTodos);
  };

  const addTodo = async (title: string) => {
    const newTodo = { id: Date.now(), title, completed: false };
    const updatedTodos = [...(data || []), newTodo];
    await updateTodos(updatedTodos, false);
    setTodos(updatedTodos);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>7. Optimistic UI Updates</CardTitle>
        <CardDescription>Update UI immediately, sync with server later</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const input = form.elements.namedItem("todo") as HTMLInputElement;
            if (input.value.trim()) {
              addTodo(input.value.trim());
              input.value = "";
            }
          }}
          className="flex gap-2"
        >
          <Input name="todo" placeholder="Add todo..." className="flex-1" />
          <Button type="submit" size="sm">Add</Button>
        </form>
        <ul className="space-y-2">
          {(data || []).map((todo: any) => (
            <li key={todo.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span className={todo.completed ? "line-through text-muted-foreground" : ""}>
                {todo.title}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Prefetching() {
  const { mutate } = useSWRConfig();
  const [prefetched, setPrefetched] = useState(false);

  const prefetchUser = async (id: number) => {
    await mutate(
      `https://jsonplaceholder.typicode.com/users/${id}`,
      fetcher(`https://jsonplaceholder.typicode.com/users/${id}`)
    );
    setPrefetched(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>8. Prefetching / Cache Warm-up</CardTitle>
        <CardDescription>Preload data before user needs it</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => prefetchUser(1)}>Prefetch User 1</Button>
          <Button size="sm" onClick={() => prefetchUser(2)}>Prefetch User 2</Button>
          <Button size="sm" onClick={() => prefetchUser(3)}>Prefetch User 3</Button>
        </div>
        {prefetched && <Badge>Data cached! Click link below to see instant load.</Badge>}
        <div className="text-sm">
          <p>Then navigate to see instant load:</p>
          <div className="flex gap-2 mt-2">
            <PrefetchDemo id={1} />
            <PrefetchDemo id={2} />
            <PrefetchDemo id={3} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PrefetchDemo({ id }: { id: number }) {
  const [show, setShow] = useState(false);
  const { data, isLoading } = useSWR(
    show ? `https://jsonplaceholder.typicode.com/users/${id}` : null,
    fetcher
  );

  return (
    <div className="border p-2 rounded">
      <Button size="sm" variant="outline" onClick={() => setShow(!show)}>
        {show ? "Hide" : "Show"} User {id}
      </Button>
      {show && (
        <div className="mt-2 text-xs bg-muted p-2 rounded">
          {isLoading ? "Loading..." : data?.name || "No data"}
        </div>
      )}
    </div>
  );
}

function GlobalConfig() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>9. Global Configuration</CardTitle>
        <CardDescription>Wrap app with SWRConfig for shared settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <pre className="text-sm bg-muted p-2 rounded overflow-auto">{`// In your root layout or _app.tsx
<SWRConfig value={{
  revalidateOnFocus: true,    // Refetch on window focus
  revalidateOnReconnect: true, // Refetch on network reconnect
  shouldRetryOnError: true,   // Retry on error
  dedupingInterval: 2000,      // Dedupe within 2s
  refreshInterval: 0,          // No auto-refresh
  fetcher: (url) => fetch(url).then(r => r.json())
}}>
  <App />
</SWRConfig>`}</pre>
      </CardContent>
    </Card>
  );
}

function CacheOperations() {
  const { mutate } = useSWRConfig();
  const [log, setLog] = useState<string[]>([]);
  const [cacheCount, setCacheCount] = useState(1);

  useSWR("https://jsonplaceholder.typicode.com/posts/10", fetcher);

  const addLog = (msg: string) => setLog((l) => [...l, `${new Date().toLocaleTimeString()}: ${msg}`]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>10. Cache Operations</CardTitle>
        <CardDescription>Direct cache manipulation via useSWRConfig</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              mutate("https://jsonplaceholder.typicode.com/posts/10");
              addLog("Revalidated post/10");
            }}
          >
            Revalidate
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              mutate("https://jsonplaceholder.typicode.com/posts/10", { title: "Manual cache!" }, false);
              addLog("Set local cache for post/10");
            }}
          >
            Set Cache
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              mutate("https://jsonplaceholder.typicode.com/posts/10", undefined, false);
              setCacheCount(0);
              addLog("Cleared cache for post/10");
            }}
          >
            Clear
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              mutate(
                (key: string) => key.startsWith("https://jsonplaceholder"),
                undefined,
                { revalidate: true }
              );
              addLog("Revalidated ALL keys");
            }}
          >
            Revalidate All
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              mutate(
                (key: string) => key.startsWith("https://jsonplaceholder"),
                undefined,
                false
              );
              setCacheCount(0);
              addLog("Cleared ALL cache");
            }}
          >
            Clear All
          </Button>
        </div>
        <p className="text-sm">Active caches: {cacheCount} entries</p>
        <div className="text-xs bg-muted p-2 rounded max-h-24 overflow-auto">
          {log.slice(-5).map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  const { data, isLoading } = useSWR(
    "https://jsonplaceholder.typicode.com/posts/20",
    slowFetcher
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>11. Loading Skeletons</CardTitle>
        <CardDescription>Show skeleton while loading with fallbackData</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        ) : (
          <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(data, null, 2)}</pre>
        )}
        <Button size="sm" onClick={() => mutate("https://jsonplaceholder.typicode.com/posts/20")}>
          Refetch (2s delay)
        </Button>
      </CardContent>
    </Card>
  );
}

function DependentQueries() {
  const [postId, setPostId] = useState<string>("1");
  
  const { data: post } = useSWR(
    `https://jsonplaceholder.typicode.com/posts/${postId}`,
    fetcher
  );
  
  const { data: user } = useSWR(
    post ? `https://jsonplaceholder.typicode.com/users/${post.userId}` : null,
    fetcher
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>12. Dependent Queries</CardTitle>
        <CardDescription>Fetch B only after A returns (cascade fetches)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPostId("1")}>Post 1</Button>
          <Button size="sm" variant="outline" onClick={() => setPostId("2")}>Post 2</Button>
          <Button size="sm" variant="outline" onClick={() => setPostId("3")}>Post 3</Button>
        </div>
        <div className="grid gap-2 text-sm">
          <div>
            <p className="font-medium">Post:</p>
            <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-20">
              {post ? JSON.stringify({ title: post.title, userId: post.userId }, null, 2) : "Loading..."}
            </pre>
          </div>
          <div>
            <p className="font-medium">User (depends on post.userId):</p>
            <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-20">
              {user ? JSON.stringify({ name: user.name, email: user.email }, null, 2) : "Waiting for post..."}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PauseFetching() {
  const [paused, setPaused] = useState(false);
  const { data, isValidating } = useSWR(
    paused ? null : "https://jsonplaceholder.typicode.com/comments/1",
    fetcher
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>13. Pause/Resume Fetching</CardTitle>
        <CardDescription>Conditional key = null to pause fetching</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setPaused(!paused)}>
            {paused ? "Resume Fetching" : "Pause Fetching"}
          </Button>
          {paused && <Badge variant="secondary">Paused</Badge>}
          {isValidating && <Badge>Fetching...</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          Key: {paused ? "null (paused)" : '"comments/1"'}
        </p>
        {data && <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(data, null, 2)}</pre>}
      </CardContent>
    </Card>
  );
}

function SessionDisplay() {
  const { session, isPending } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>14. Session Data</CardTitle>
        <CardDescription>Current authenticated session from Better Auth</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge variant={isPending ? "default" : "secondary"}>Loading: {String(isPending)}</Badge>
          <Badge variant={session ? "default" : "secondary"}>Authenticated: {String(!!session)}</Badge>
        </div>
        {isPending && <p className="text-sm text-muted-foreground">Loading session...</p>}
        {!isPending && !session && <p className="text-sm text-muted-foreground">No active session</p>}
        {session && (
          <pre className="text-sm bg-muted p-2 rounded overflow-auto max-h-60">{JSON.stringify(session, null, 2)}</pre>
        )}
      </CardContent>
    </Card>
  );
}

export default function ExperimentPage() {
  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">SWR Interactive Demo</h1>
        <p className="text-muted-foreground">
          Explore all SWR capabilities with working examples. Open DevTools Network tab to see requests.
        </p>
      </div>

      <Separator />

      <div className="grid gap-6">
        <BasicFetch />
        <ConditionalFetching />
        <Revalidation />
        <ErrorHandling />
        <Polling />
        <Deduplication />
        <OptimisticUI />
        <Prefetching />
        <GlobalConfig />
        <CacheOperations />
        <LoadingSkeleton />
        <DependentQueries />
        <PauseFetching />
        <SessionDisplay />
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Quick Reference</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
          <div>
            <p className="font-medium">useSWR(key, fetcher, options)</p>
            <pre className="bg-muted p-2 rounded mt-1 overflow-auto">{`const { data, error, isLoading, isValidating, mutate } = useSWR(
  '/api/user',           // key (null = no fetch)
  fetcher,               // async function
  {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 0,
    dedupingInterval: 2000,
    shouldRetryOnError: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    fallbackData: [],
    suspense: false,
  }
)`}</pre>
          </div>
          <div>
            <p className="font-medium">Mutate (local update)</p>
            <pre className="bg-muted p-2 rounded mt-1">{`mutate(key, newData, revalidate?)  // Update cache
mutate(key)                          // Revalidate (refetch)
mutate(key, undefined, false)        // Clear cache`}</pre>
          </div>
          <div>
            <p className="font-medium">useSWRConfig()</p>
            <pre className="bg-muted p-2 rounded mt-1">{`const { cache, mutate, preload } = useSWRConfig()`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}