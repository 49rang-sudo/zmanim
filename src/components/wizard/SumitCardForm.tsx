"use client";

import * as React from "react";
import Script from "next/script";
import { CreditCard } from "lucide-react";
import { WField as Field, WInput as Input } from "./ui";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    OfficeGuy?: {
      Payments: {
        BindFormSubmit: (config: {
          CompanyID: number;
          APIPublicKey: string;
          Success?: (response: {
            Data?: { SingleUseTokenID?: string; Token?: string };
          }) => void;
          Failure?: (response: {
            UserErrorMessage?: string;
            Message?: string;
          }) => void;
        }) => void;
      };
    };
  }
}

type Props = {
  companyId: number;
  apiPublicKey: string;
  busy: boolean;
  onToken: (token: string) => void;
  onError: (message: string) => void;
};

/**
 * טופס אשראי מוטמע דרך Payments JavaScript API של sumit.
 *
 * TODO(sumit): אין דוגמת HTML רשמית מהתיעוד שנמסר — שמות ה-data-og-*
 * ומבנה ה-callback (Success/Failure) כאן הם ניחוש סביר לפי מוסכמות
 * נפוצות בספריות tokenization דומות. יש לאמת מול דוגמת הקוד/ה-Schema
 * האמיתית של sumit לפני שהטופס הזה מקבל כרטיסי אשראי אמיתיים.
 */
export function SumitCardForm({
  companyId,
  apiPublicKey,
  busy,
  onToken,
  onError,
}: Props) {
  const [scriptReady, setScriptReady] = React.useState(false);
  const bound = React.useRef(false);
  const onTokenRef = React.useRef(onToken);
  const onErrorRef = React.useRef(onError);
  onTokenRef.current = onToken;
  onErrorRef.current = onError;

  React.useEffect(() => {
    if (!scriptReady || bound.current || !window.OfficeGuy) return;

    bound.current = true;
    window.OfficeGuy.Payments.BindFormSubmit({
      CompanyID: companyId,
      APIPublicKey: apiPublicKey,
      Success: (response) => {
        const token = response?.Data?.SingleUseTokenID ?? response?.Data?.Token;
        if (token) onTokenRef.current(token);
        else onErrorRef.current("לא התקבל טוקן תשלום מספק הסליקה.");
      },
      Failure: (response) => {
        onErrorRef.current(
          response?.UserErrorMessage ?? response?.Message ?? "הכרטיס נדחה.",
        );
      },
    });
  }, [scriptReady, companyId, apiPublicKey]);

  return (
    <>
      <Script
        src="https://app.sumit.co.il/scripts/payments.js"
        strategy="lazyOnload"
        onReady={() => setScriptReady(true)}
      />

      <form
        id="sumit-card-form"
        onSubmit={(e) => e.preventDefault()}
        className="grid gap-x-4 sm:grid-cols-2"
      >
        <Field
          label="שם בעל הכרטיס *"
          htmlFor="og-holder"
          className="sm:col-span-2"
        >
          <Input
            id="og-holder"
            name="holder_name"
            data-og="holder-name"
            autoComplete="cc-name"
            required
          />
        </Field>

        <Field
          label="מספר כרטיס *"
          htmlFor="og-cc"
          className="sm:col-span-2"
        >
          <Input
            id="og-cc"
            name="credit_card_number"
            data-og="credit-card-number"
            inputMode="numeric"
            dir="ltr"
            className="text-right"
            autoComplete="cc-number"
            required
          />
        </Field>

        <Field label="תוקף (חודש/שנה) *" htmlFor="og-exp-month">
          <div className="flex gap-2" dir="ltr">
            <Input
              id="og-exp-month"
              name="expiration_month"
              data-og="expiration-month"
              placeholder="MM"
              inputMode="numeric"
              maxLength={2}
              autoComplete="cc-exp-month"
              required
            />
            <Input
              id="og-exp-year"
              name="expiration_year"
              data-og="expiration-year"
              placeholder="YYYY"
              inputMode="numeric"
              maxLength={4}
              autoComplete="cc-exp-year"
              required
            />
          </div>
        </Field>

        <Field label="CVV *" htmlFor="og-cvv">
          <Input
            id="og-cvv"
            name="cvv"
            data-og="cvv"
            inputMode="numeric"
            dir="ltr"
            className="text-right"
            maxLength={4}
            autoComplete="cc-csc"
            required
          />
        </Field>

        <Button
          type="submit"
          variant="pill"
          size="lg"
          className="shine-cta mt-2 w-full sm:col-span-2"
          loading={busy}
          disabled={!scriptReady}
        >
          <CreditCard className="size-4" />
          {scriptReady ? "אישור ותשלום" : "טוען טופס תשלום מאובטח…"}
        </Button>
      </form>
    </>
  );
}
