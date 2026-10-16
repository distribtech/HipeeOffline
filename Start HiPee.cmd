@echo off
setlocal
set "HIPEE_BROWSER="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "HIPEE_BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined HIPEE_BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "HIPEE_BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined HIPEE_BROWSER if exist "%LocalAppData%\Microsoft\Edge\Application\msedge.exe" set "HIPEE_BROWSER=%LocalAppData%\Microsoft\Edge\Application\msedge.exe"
if not defined HIPEE_BROWSER if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "HIPEE_BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined HIPEE_BROWSER if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "HIPEE_BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined HIPEE_BROWSER (
  echo Microsoft Edge or Google Chrome is required. No installation was changed.
  pause
  exit /b 1
)
start "HiPee Offline" "%HIPEE_BROWSER%" --app="file:///%~dp0index.html"
endlocal
