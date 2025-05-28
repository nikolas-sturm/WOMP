!macro NSIS_HOOK_POSTINSTALL
  ; Register application in App Paths to make it available as CLI command
  WriteRegStr HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\womp.exe" "" "$INSTDIR\womp.exe"
  WriteRegStr HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\womp.exe" "Path" "$INSTDIR"
  
  ; Add application directory to user's PATH environment variable using PowerShell script
  DetailPrint "Adding to PATH environment variable..."
  nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -File "$INSTDIR\add_to_path.ps1"'
  Pop $0 ; Get exit code
  DetailPrint "PowerShell script exit code: $0"
  
  ; Delete the PowerShell script after execution
  Delete "$INSTDIR\add_to_path.ps1"
  DetailPrint "Removed installation helper script"
!macroend