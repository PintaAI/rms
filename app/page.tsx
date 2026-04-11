import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { RiSmartphoneLine, RiToolsLine, RiArchiveLine, RiArrowRightLine, RiCheckLine } from "@remixicon/react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <RiToolsLine className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-xl">RMS</span>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Button>
              <Link href="/auth" className="flex items-center gap-2">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center space-y-6">
              <Badge variant="secondary" className="mb-4">
                Phone Repair Management
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Repair Management System
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Streamline your phone repair business with comprehensive tools for managing services, inventory, and spare parts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg">
                  <Link href="/auth" className="flex items-center gap-2">
                    Get Started
                    <RiArrowRightLine className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Features Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-semibold mb-2">Everything You Need</h2>
              <p className="text-muted-foreground">Powerful features to run your repair business efficiently</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                      <RiSmartphoneLine className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle>Service Management</CardTitle>
                      <CardDescription>
                        Track repairs, manage service orders, and monitor progress from intake to completion.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <RiCheckLine className="h-4 w-4 text-primary" />
                      Track repair status
                    </li>
                    <li className="flex items-center gap-2">
                      <RiCheckLine className="h-4 w-4 text-primary" />
                      Customer management
                    </li>
                    <li className="flex items-center gap-2">
                      <RiCheckLine className="h-4 w-4 text-primary" />
                      Service history
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                      <RiArchiveLine className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle>Inventory Control</CardTitle>
                      <CardDescription>
                        Manage spare parts stock, track usage, and receive alerts for low inventory levels.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <RiCheckLine className="h-4 w-4 text-primary" />
                      Stock tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <RiCheckLine className="h-4 w-4 text-primary" />
                      Low stock alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <RiCheckLine className="h-4 w-4 text-primary" />
                      Usage reports
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                      <RiToolsLine className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle>Stock Services</CardTitle>
                      <CardDescription>
                        Organize service offerings, pricing, and technician assignments efficiently.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <RiCheckLine className="h-4 w-4 text-primary" />
                      Service catalog
                    </li>
                    <li className="flex items-center gap-2">
                      <RiCheckLine className="h-4 w-4 text-primary" />
                      Pricing management
                    </li>
                    <li className="flex items-center gap-2">
                      <RiCheckLine className="h-4 w-4 text-primary" />
                      Technician scheduling
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-2xl">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-2xl">Ready to get started?</CardTitle>
                <CardDescription>
                  Join RMS today and take control of your repair business.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="lg">
                  <Link href="/auth" className="flex items-center gap-2">
                    Create Account
                    <RiArrowRightLine className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <RiToolsLine className="h-5 w-5 text-primary" />
              <span className="font-medium">RMS - Repair Management System</span>
            </div>
            <Separator className="md:hidden" />
            <p className="text-sm text-muted-foreground">
              © 2024 All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
