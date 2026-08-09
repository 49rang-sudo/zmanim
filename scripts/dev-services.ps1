# ---------------------------------------------------------------
#  הפעלת שירותי הפיתוח המקומיים — PostgreSQL + MinIO
#
#  הרצה:   .\scripts\dev-services.ps1
#  עצירה:  .\scripts\dev-services.ps1 -Stop
#
#  שתי התוכנות ניידות ויושבות ב-C:\Users\user\dev-tools.
#  אין התקנה, אין שירות Windows, ואין צורך בהרשאות מנהל.
#  למחיקה מוחלטת: למחוק את התיקייה dev-tools.
# ---------------------------------------------------------------

param([switch]$Stop)

$ErrorActionPreference = "Stop"

$Tools     = "C:\Users\user\dev-tools"
$PgBin     = "$Tools\pgsql\bin"
$PgData    = "$Tools\pgdata"
$PgLog     = "$Tools\pgdata.log"
$MinioExe  = "$Tools\minio\minio.exe"
$MinioData = "$Tools\minio-data"

# חייבים להתאים ל-.env של הפרויקט
$DbUser = "luach"
$DbPass = "luach_dev_password"
$DbName = "luach"
$Bucket = "luach-artwork"

# ---------------------------------------------------------------

if ($Stop) {
    Write-Host "עוצר שירותים…" -ForegroundColor Yellow

    if (Test-Path "$PgBin\pg_ctl.exe") {
        & "$PgBin\pg_ctl.exe" -D $PgData -m fast stop 2>$null
    }

    Get-Process minio -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "נעצר." -ForegroundColor Green
    return
}

# --- בדיקת קיום הבינאריים ---------------------------------------
if (-not (Test-Path "$PgBin\initdb.exe")) {
    throw "PostgreSQL הנייד לא נמצא ב-$PgBin. חלצו קודם את pgsql.zip לתוך $Tools."
}

# --- אתחול ראשוני של מסד הנתונים -------------------------------
if (-not (Test-Path "$PgData\PG_VERSION")) {
    Write-Host "מאתחל את מסד הנתונים (פעם אחת בלבד)…" -ForegroundColor Cyan

    # trust על לולאה מקומית בלבד — מתאים לפיתוח, לא לשרת
    & "$PgBin\initdb.exe" -D $PgData -U postgres --auth-local=trust --auth-host=trust --encoding=UTF8 | Out-Null
}

# --- הפעלת PostgreSQL -------------------------------------------
$pgUp = (Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue).TcpTestSucceeded

if ($pgUp) {
    Write-Host "PostgreSQL כבר רץ על 5432." -ForegroundColor DarkGray
} else {
    Write-Host "מפעיל PostgreSQL…" -ForegroundColor Cyan
    & "$PgBin\pg_ctl.exe" -D $PgData -l $PgLog -o "-p 5432 -h 127.0.0.1" -w start

    # --- יצירת המשתמש והמסד של הפרויקט ---
    $exists = & "$PgBin\psql.exe" -U postgres -h 127.0.0.1 -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DbUser'"

    if ($exists -ne "1") {
        Write-Host "יוצר משתמש ומסד…" -ForegroundColor Cyan
        & "$PgBin\psql.exe" -U postgres -h 127.0.0.1 -c "CREATE ROLE $DbUser LOGIN PASSWORD '$DbPass'" | Out-Null
        & "$PgBin\createdb.exe" -U postgres -h 127.0.0.1 -O $DbUser $DbName | Out-Null
    }
}

# --- הפעלת MinIO -------------------------------------------------
if (Test-Path $MinioExe) {
    $minioUp = (Test-NetConnection -ComputerName localhost -Port 9000 -WarningAction SilentlyContinue).TcpTestSucceeded

    if ($minioUp) {
        Write-Host "MinIO כבר רץ על 9000." -ForegroundColor DarkGray
    } else {
        Write-Host "מפעיל MinIO…" -ForegroundColor Cyan
        New-Item -ItemType Directory -Force "$MinioData\$Bucket" | Out-Null

        $env:MINIO_ROOT_USER     = "minioadmin"
        $env:MINIO_ROOT_PASSWORD = "minioadmin"

        Start-Process -FilePath $MinioExe `
            -ArgumentList "server", $MinioData, "--address", ":9000", "--console-address", ":9001" `
            -WindowStyle Hidden
    }
} else {
    Write-Host "MinIO לא נמצא — העלאות קבצים לא יעבדו." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "מוכן." -ForegroundColor Green
Write-Host "  PostgreSQL  localhost:5432   ($DbName / $DbUser)"
Write-Host "  MinIO       localhost:9000   קונסולה: localhost:9001"
Write-Host ""
Write-Host "המשך:  npm run db:push  →  npm run db:seed  →  npm run dev"
