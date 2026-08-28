"use client";

import * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { signOut } from "next-auth/react";
import {
  CalendarDays,
  ChartColumn,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutGrid,
  LogOut,
  Mail,
  MapPin,
  Palette,
  Type,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OverviewTab } from "./OverviewTab";
import { ProductionTab } from "./ProductionTab";
import { OrdersTab } from "./OrdersTab";
import { CitiesTab } from "./CitiesTab";
import { EditionsTab } from "./EditionsTab";
import { SlotsTab } from "./SlotsTab";
import { InspirationImagesTab } from "./InspirationImagesTab";
import { ContentTab } from "./ContentTab";
import { TeamTab } from "./TeamTab";
import { MailingListTab } from "./MailingListTab";
import { InquiriesTab } from "./InquiriesTab";
import { cn } from "@/lib/utils";

const BASE_TABS = [
  { value: "overview", label: "סקירה", icon: ChartColumn },
  { value: "production", label: "גרפיקה", icon: Palette },
  { value: "orders", label: "הזמנות", icon: FileText },
  { value: "inquiries", label: "פניות", icon: Inbox },
  { value: "cities", label: "ערים", icon: MapPin },
  { value: "editions", label: "מהדורות", icon: CalendarDays },
  { value: "slots", label: "משבצות", icon: LayoutGrid },
  { value: "inspiration-images", label: "תמונות והשראה", icon: ImageIcon },
  { value: "content", label: "תוכן", icon: Type },
  { value: "mailing-list", label: "תפוצה", icon: Mail },
];

const TEAM_TAB = { value: "team", label: "צוות", icon: Users };

export function AdminShell({
  userName,
  role,
}: {
  userName: string;
  role: string;
}) {
  const isOwner = role === "OWNER";
  const tabs = isOwner ? [...BASE_TABS, TEAM_TAB] : BASE_TABS;
  return (
    <div className="min-h-dvh bg-background">
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-5 py-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/zmanim-logo.png" alt="" className="size-9 object-contain" />

          <div className="min-w-0">
            <p className="font-heading text-lg font-extrabold leading-tight text-foreground">
              ניהול הלוח
            </p>
            <p className="truncate text-[12px] text-muted-foreground">{userName}</p>
          </div>

          <div className="mr-auto flex items-center gap-2">
            <Button
              variant="soft"
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
          {/* מסלול-כדור + טאב פעיל "צף" (bg-card + shadow-sm) — אותה תבנית
              בדיוק כמו zmanim2-base44/src/pages/AdminHome.jsx TabsList/
              TabsTrigger, במקום קו תחתון + הדגשת accent-soft. */}
          <Tabs.List className="mb-7 flex h-auto flex-wrap gap-1 rounded-2xl bg-secondary/60 p-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold",
                    "text-muted-foreground transition-colors duration-200 ease-smooth",
                    "hover:bg-card/60",
                    "data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
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
          <Tabs.Content value="inquiries" className="focus:outline-none">
            <InquiriesTab />
          </Tabs.Content>
          <Tabs.Content value="cities" className="focus:outline-none">
            <CitiesTab />
          </Tabs.Content>
          <Tabs.Content value="editions" className="focus:outline-none">
            <EditionsTab />
          </Tabs.Content>
          <Tabs.Content value="slots" className="focus:outline-none">
            <SlotsTab />
          </Tabs.Content>
          <Tabs.Content value="inspiration-images" className="focus:outline-none">
            <InspirationImagesTab />
          </Tabs.Content>
          <Tabs.Content value="content" className="focus:outline-none">
            <ContentTab />
          </Tabs.Content>
          <Tabs.Content value="mailing-list" className="focus:outline-none">
            <MailingListTab />
          </Tabs.Content>
          {isOwner ? (
            <Tabs.Content value="team" className="focus:outline-none">
              <TeamTab />
            </Tabs.Content>
          ) : null}
        </Tabs.Root>
      </main>
    </div>
  );
}
