"use client";

import * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { signOut } from "next-auth/react";
import {
  ChartColumn,
  FileText,
  LayoutGrid,
  LogOut,
  MapPin,
  Palette,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OverviewTab } from "./OverviewTab";
import { ProductionTab } from "./ProductionTab";
import { OrdersTab } from "./OrdersTab";
import { CitiesTab } from "./CitiesTab";
import { SlotsTab } from "./SlotsTab";
import { ContentTab } from "./ContentTab";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "overview", label: "סקירה", icon: ChartColumn },
  { value: "production", label: "גרפיקה", icon: Palette },
  { value: "orders", label: "הזמנות", icon: FileText },
  { value: "cities", label: "ערים", icon: MapPin },
  { value: "slots", label: "משבצות", icon: LayoutGrid },
  { value: "content", label: "תוכן", icon: Type },
];

export function AdminShell({ userName }: { userName: string }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="glass sticky top-0 z-30 border-b border-line">
        <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-5 py-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/zmanim-mark.png" alt="" className="size-9 object-contain" />

          <div className="min-w-0">
            <p className="font-display text-lg font-semibold leading-tight text-ink">
              ניהול הלוח
            </p>
            <p className="truncate text-[12px] text-muted">{userName}</p>
          </div>

          <div className="mr-auto flex items-center gap-2">
            <Button
              variant="subtle"
              size="sm"
              onClick={() => window.open("/", "_blank")}
            >
              צפייה באתר
            </Button>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
            >
              <LogOut className="size-3.5" />
              יציאה
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-5 py-8">
        <Tabs.Root defaultValue="overview" dir="rtl">
          <Tabs.List className="mb-7 flex flex-wrap gap-2 border-b border-line pb-3">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold",
                    "text-ink-2 transition-colors duration-200 ease-smooth",
                    "hover:bg-surface-3",
                    "data-[state=active]:bg-accent-soft data-[state=active]:text-accent-strong",
                  )}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          <Tabs.Content value="overview" className="focus:outline-none">
            <OverviewTab />
          </Tabs.Content>
          <Tabs.Content value="production" className="focus:outline-none">
            <ProductionTab />
          </Tabs.Content>
          <Tabs.Content value="orders" className="focus:outline-none">
            <OrdersTab />
          </Tabs.Content>
          <Tabs.Content value="cities" className="focus:outline-none">
            <CitiesTab />
          </Tabs.Content>
          <Tabs.Content value="slots" className="focus:outline-none">
            <SlotsTab />
          </Tabs.Content>
          <Tabs.Content value="content" className="focus:outline-none">
            <ContentTab />
          </Tabs.Content>
        </Tabs.Root>
      </main>
    </div>
  );
}
