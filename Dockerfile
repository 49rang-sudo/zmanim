# ---------------------------------------------------------------
#  לוח שנה — תמונת ייצור
#  בנייה רב-שלבית: התמונה הסופית לא מכילה קוד מקור,
#  כלי בנייה, או תלויות פיתוח.
# ---------------------------------------------------------------

FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci


FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# הלקוח של Prisma חייב להיווצר לפני הבנייה — Next מייבא אותו
RUN npx prisma generate

# משתני סביבה מדומים לזמן הבנייה בלבד. אף אחד מהם לא נשמר
# בתמונה: הערכים האמיתיים מוזרקים בזמן ריצה.
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV AUTH_SECRET="build-time-placeholder-secret-value"
ENV S3_ENDPOINT="http://localhost:9000"
ENV S3_BUCKET="build"
ENV S3_ACCESS_KEY_ID="build"
ENV S3_SECRET_ACCESS_KEY="build"
ENV PAYMENT_WEBHOOK_SECRET="build-placeholder"

RUN npm run build


FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# משתמש לא-root — אם יש פרצה באפליקציה, היא לא רצה כ-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# נחוצים כדי להריץ הגירות וזריעה מתוך הקונטיינר
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
