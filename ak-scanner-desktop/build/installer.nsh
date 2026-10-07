!include nsDialogs.nsh

!macro customHeader
  !undef UNINSTALL_FILENAME
  !define UNINSTALL_FILENAME "Uninstall.exe"
!macroend

!macro customInstall
  ; Recreate the desktop link on a reinstall, including after the user removed it.
  ; This also covers installations where the standard shortcut step was skipped.
  ${IfNot} ${FileExists} "$DESKTOP\${SHORTCUT_NAME}.lnk"
    CreateShortCut "$DESKTOP\${SHORTCUT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
    WinShell::SetLnkAUMI "$DESKTOP\${SHORTCUT_NAME}.lnk" "${APP_ID}"
  ${EndIf}
!macroend

!ifdef BUILD_UNINSTALLER
Var /GLOBAL dataCheckbox
Var /GLOBAL deleteDataChoice

!macro customUnWelcomePage
  !insertmacro MUI_UNPAGE_WELCOME
  UninstPage custom un.dataPageCreate un.dataPageLeave
!macroend

Function un.dataPageCreate
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  ${NSD_CreateLabel} 0 0 100% 30u "Choose whether to keep your cards and settings. The app is stored separately from this data."
  Pop $1
  ${NSD_CreateCheckbox} 0 37u 100% 20u "Delete my cards, images, and settings too"
  Pop $dataCheckbox
  ${NSD_Uncheck} $dataCheckbox
  nsDialogs::Show
FunctionEnd

Function un.dataPageLeave
  ${NSD_GetState} $dataCheckbox $deleteDataChoice
FunctionEnd

!macro customUnInstall
  ${IfNot} ${isUpdated}
    ; NSIS removes its named shortcut. Also remove desktop links renamed by the
    ; user when they still point at this exact executable.
    File /oname=$PLUGINSDIR\cleanup-shortcuts.ps1 "${PROJECT_DIR}\build\cleanup-shortcuts.ps1"
    nsExec::ExecToLog 'powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "$PLUGINSDIR\cleanup-shortcuts.ps1" -InstallDirectory "$INSTDIR"'

    ${If} $deleteDataChoice == ${BST_CHECKED}
      ; main.cjs pins Windows userData to this legacy-compatible directory.
      SetShellVarContext current
      RMDir /r "$APPDATA\AK Scanner"
      ${If} $installMode == "all"
        SetShellVarContext all
      ${EndIf}
    ${EndIf}
  ${EndIf}
!macroend
!endif
