"use client";

import { PatternLock } from "@/components/pattern-lock";
import { useState, useCallback } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

// Simulated database storage (in real app, this would be server-side)
const patternDatabase: Record<string, number[]> = {};

export default function ExperimentPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  
  // Pattern save/verify state
  const [savedPattern, setSavedPattern] = useState<number[] | null>(null);
  const [isSaveMode, setIsSaveMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const handlePatternComplete = (pattern: number[]) => {
    console.log("Pattern drawn:", pattern);

    // Simulate pattern validation
    // In a real app, you'd compare against a stored pattern
    if (pattern.length >= 4) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  // Save pattern handler
  const handleSavePattern = useCallback((pattern: number[]) => {
    if (pattern.length < 4) {
      setError(true);
      setTimeout(() => setError(false), 1000);
      return;
    }
    
    // Simulate saving to database
    patternDatabase["user_pattern"] = [...pattern];
    setSavedPattern([...pattern]);
    setSaveSuccess(true);
    setIsSaveMode(false);
    setTimeout(() => setSaveSuccess(false), 2000);
  }, []);

  // Verify pattern handler
  const handleVerifyPattern = useCallback((pattern: number[]) => {
    const storedPattern = patternDatabase["user_pattern"];
    
    if (!storedPattern) {
      setError(true);
      setTimeout(() => setError(false), 1000);
      return;
    }

    // Compare patterns
    const isMatch =
      pattern.length === storedPattern.length &&
      pattern.every((dot, index) => dot === storedPattern[index]);

    if (isMatch) {
      setVerifySuccess(true);
      setError(false);
      setTimeout(() => setVerifySuccess(false), 2000);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  }, []);

  return (
    <div className="container mx-auto py-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pattern Lock Experiments</h1>
        <p className="text-muted-foreground">
          Testing the PatternLock component in various container contexts.
        </p>
      </div>

      {/* 1. Default - Centered */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">1. Default (Centered)</h2>
          <p className="text-sm text-muted-foreground">
            Standard usage with centered layout.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 border rounded-lg bg-muted/30">
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              {unlocked ? "🔓 Unlocked!" : "🔒 Pattern Lock"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {unlocked
                ? "You have successfully drawn the pattern!"
                : "Draw a pattern with at least 4 dots to unlock"}
            </p>
          </div>

          <PatternLock
            width={280}
            height={280}
            error={error}
            onPatternComplete={handlePatternComplete}
            onPatternChange={(pattern) => console.log("Current pattern:", pattern)}
          />

          {unlocked && (
            <Button variant="secondary" onClick={() => setUnlocked(false)}>
              Lock Again
            </Button>
          )}
        </div>
      </section>

      {/* 2. Limited Parent Div */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">2. Limited Parent Div</h2>
          <p className="text-sm text-muted-foreground">
            Constrained within a small container with overflow handling.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Small container */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-2">Small (200x200)</h3>
            <div className="w-[200px] h-[200px] overflow-hidden border border-dashed rounded flex items-center justify-center">
              <PatternLock
                width={180}
                height={180}
                onPatternComplete={(p) => console.log("Small:", p)}
              />
            </div>
          </div>

          {/* Medium container */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-2">Medium (250x250)</h3>
            <div className="w-[250px] h-[250px] overflow-hidden border border-dashed rounded flex items-center justify-center">
              <PatternLock
                width={230}
                height={230}
                onPatternComplete={(p) => console.log("Medium:", p)}
              />
            </div>
          </div>

          {/* Container with padding */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-2">With Padding</h3>
            <div className="w-[280px] h-[280px] overflow-hidden border border-dashed rounded p-4 flex items-center justify-center bg-background">
              <PatternLock
                width={240}
                height={240}
                onPatternComplete={(p) => console.log("Padded:", p)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Scroll View */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">3. Scroll View</h2>
          <p className="text-sm text-muted-foreground">
            Inside a scrollable container with other content.
          </p>
        </div>
        <div className="border rounded-lg bg-muted/30 overflow-hidden">
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            <div className="p-4 bg-background rounded border">
              <h3 className="font-medium">Scrollable Content Above</h3>
              <p className="text-sm text-muted-foreground">
                Scroll down to see the pattern lock component.
              </p>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-background rounded border">
                <h3 className="font-medium">Content Block {i}</h3>
                <p className="text-sm text-muted-foreground">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            ))}
            <div className="flex justify-center py-4 bg-background rounded border">
              <PatternLock
                width={260}
                height={260}
                onPatternComplete={(p) => console.log("Scroll view:", p)}
              />
            </div>
            {[4, 5, 6].map((i) => (
              <div key={i} className="p-4 bg-background rounded border">
                <h3 className="font-medium">Content Block {i}</h3>
                <p className="text-sm text-muted-foreground">
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Inside Sheet */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">4. Inside Sheet</h2>
          <p className="text-sm text-muted-foreground">
            Pattern lock rendered inside a sheet component.
          </p>
        </div>
        <Sheet>
          <SheetTrigger render={<Button variant="outline">Open Sheet with Pattern Lock</Button>} />
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Unlock with Pattern</SheetTitle>
              <SheetDescription>
                Draw your pattern to unlock the secure content.
              </SheetDescription>
            </SheetHeader>
            <div className="flex justify-center py-6">
              <PatternLock
                width={280}
                height={280}
                onPatternComplete={(p) => {
                  console.log("Sheet pattern:", p);
                  if (p.length >= 4) {
                    alert("Pattern accepted!");
                  }
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </section>

      {/* 5. Inside Dialog */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">5. Inside Dialog</h2>
          <p className="text-sm text-muted-foreground">
            Pattern lock rendered inside a modal dialog.
          </p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button variant="outline">Open Dialog with Pattern Lock</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pattern Authentication</DialogTitle>
              <DialogDescription>
                Please draw your security pattern to continue.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <PatternLock
                width={260}
                height={260}
                onPatternComplete={(p) => {
                  console.log("Dialog pattern:", p);
                  if (p.length >= 4) {
                    alert("Pattern accepted!");
                  }
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </section>

      {/* 6. Custom Styling */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">6. Custom Colors</h2>
          <p className="text-sm text-muted-foreground">
            Pattern lock with custom color schemes.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Green theme */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-2">Success Theme</h3>
            <div className="flex justify-center">
              <PatternLock
                width={200}
                height={200}
                primaryColor="#22c55e"
                inactiveColor="#86efac"
                onPatternComplete={(p) => console.log("Green:", p)}
              />
            </div>
          </div>

          {/* Purple theme */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-2">Purple Theme</h3>
            <div className="flex justify-center">
              <PatternLock
                width={200}
                height={200}
                primaryColor="#a855f7"
                inactiveColor="#d8b4fe"
                onPatternComplete={(p) => console.log("Purple:", p)}
              />
            </div>
          </div>

          {/* Orange theme */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-2">Orange Theme</h3>
            <div className="flex justify-center">
              <PatternLock
                width={200}
                height={200}
                primaryColor="#f97316"
                inactiveColor="#fdba74"
                onPatternComplete={(p) => console.log("Orange:", p)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. Different Grid Sizes */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">7. Different Grid Sizes</h2>
          <p className="text-sm text-muted-foreground">
            Pattern lock with configurable grid dimensions.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 3x3 Grid */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-2">3×3 Grid (Default)</h3>
            <div className="flex justify-center">
              <PatternLock
                width={200}
                height={200}
                cols={3}
                rows={3}
                onPatternComplete={(p) => console.log("3x3:", p)}
              />
            </div>
          </div>

          {/* 4x4 Grid */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-2">4×4 Grid</h3>
            <div className="flex justify-center">
              <PatternLock
                width={240}
                height={240}
                cols={4}
                rows={4}
                onPatternComplete={(p) => console.log("4x4:", p)}
              />
            </div>
          </div>

          {/* 3x4 Grid */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-2">3×4 Grid</h3>
            <div className="flex justify-center">
              <PatternLock
                width={200}
                height={260}
                cols={3}
                rows={4}
                onPatternComplete={(p) => console.log("3x4:", p)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 8. Save & Verify Pattern (Database Simulation) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">8. Save & Verify Pattern</h2>
          <p className="text-sm text-muted-foreground">
            Simulate saving a pattern to database and verifying it later.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Save Pattern */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-2">Save Pattern</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Draw a pattern with at least 4 dots to save it.
            </p>
            <div className="flex flex-col items-center gap-4">
              <PatternLock
                width={240}
                height={240}
                error={error && isSaveMode}
                autoReset={false}
                onPatternComplete={handleSavePattern}
              />
              {saveSuccess && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ Pattern saved successfully!
                </p>
              )}
              {savedPattern && (
                <p className="text-xs text-muted-foreground">
                  Saved: {savedPattern.join(" → ")}
                </p>
              )}
            </div>
          </div>

          {/* Verify Pattern */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-2">Verify Pattern</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Draw the saved pattern to verify it matches.
            </p>
            <div className="flex flex-col items-center gap-4">
              <PatternLock
                width={240}
                height={240}
                error={error && !isSaveMode}
                autoReset={false}
                disabled={!savedPattern}
                onPatternComplete={handleVerifyPattern}
              />
              {verifySuccess && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ Pattern verified successfully!
                </p>
              )}
              {error && !isSaveMode && (
                <p className="text-sm text-red-600 font-medium">
                  ✗ Pattern does not match!
                </p>
              )}
              {!savedPattern && (
                <p className="text-xs text-muted-foreground">
                  Save a pattern first to enable verification.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 9. With Pattern Numbers */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">9. Debug Mode</h2>
          <p className="text-sm text-muted-foreground">
            Pattern lock with visible dot numbers for debugging.
          </p>
        </div>
        <div className="flex justify-center">
          <PatternLock
            width={280}
            height={280}
            showPatternNumbers
            onPatternComplete={(p) => console.log("Debug pattern:", p)}
          />
        </div>
      </section>

      {/* 10. Disabled State */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">10. Disabled State</h2>
          <p className="text-sm text-muted-foreground">
            Pattern lock in disabled mode.
          </p>
        </div>
        <div className="flex justify-center">
          <PatternLock
            width={280}
            height={280}
            disabled
            onPatternComplete={(p) => console.log("Disabled:", p)}
          />
        </div>
      </section>
    </div>
  );
}