param([Parameter(Mandatory = $true)][string]$InstallDirectory)

$target = [IO.Path]::GetFullPath((Join-Path $InstallDirectory 'Animal Kaiser Scanner.exe'))
$shell = New-Object -ComObject WScript.Shell
$desktops = @(
    [Environment]::GetFolderPath('DesktopDirectory'),
    [Environment]::GetFolderPath('CommonDesktopDirectory')
) | Where-Object { $_ } | Select-Object -Unique

foreach ($desktop in $desktops) {
    if (-not (Test-Path -LiteralPath $desktop -PathType Container)) { continue }
    foreach ($file in Get-ChildItem -LiteralPath $desktop -Filter '*.lnk' -File) {
        try {
            $shortcut = $shell.CreateShortcut($file.FullName)
            if ($shortcut.TargetPath -and
                [IO.Path]::GetFullPath($shortcut.TargetPath) -ieq $target) {
                Remove-Item -LiteralPath $file.FullName -Force
            }
        } catch {
            # A broken or inaccessible shortcut must not stop the uninstaller.
        }
    }
}
