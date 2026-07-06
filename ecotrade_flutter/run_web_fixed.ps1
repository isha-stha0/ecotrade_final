param(
  [int]$Port = 56115
)

$ErrorActionPreference = 'Stop'

Write-Host "Preparing Flutter web-server on http://localhost:$Port"

$flutterChromeProcesses = Get-CimInstance Win32_Process |
  Where-Object { $_.Name -eq 'chrome.exe' -and $_.CommandLine -like '*flutter_tools_chrome_device*' }

foreach ($process in $flutterChromeProcesses) {
  Write-Host "Stopping stale Flutter Chrome process: $($process.ProcessId)"
  Stop-Process -Id $process.ProcessId -Force
}

$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
$processIds = $connections |
  Select-Object -ExpandProperty OwningProcess -Unique |
  Where-Object { $_ -and $_ -ne $PID }

foreach ($processId in $processIds) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
  if ($process -and (
      $process.CommandLine -like '*flutter_tools.snapshot*' -or
      $process.CommandLine -like '*flutter.bat*' -or
      $process.Name -in @('dart.exe', 'dartvm.exe', 'cmd.exe')
    )) {
    Write-Host "Stopping existing Flutter process on port ${Port}: $($process.Name) $processId"
    Stop-Process -Id $processId -Force
  } else {
    Write-Host "Port $Port is used by another process. Stop it manually before running Flutter."
    if ($process) {
      Write-Host "$($process.Name) $processId"
      Write-Host "$($process.CommandLine)"
    }
    exit 1
  }
}

Write-Host "Starting Flutter. Open http://localhost:$Port after the build finishes."
flutter run -d web-server --web-port=$Port
