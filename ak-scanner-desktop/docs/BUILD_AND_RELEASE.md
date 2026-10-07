# Build and release — Windows

Animal Kaiser Scanner 1.0.0 is an Electron, React and SQLite application. End users only need the installer. The app does not require Node.js, PHP, XAMPP or a database server.

## Developer commands

Run in `ak-scanner-desktop` on Windows with Node.js 22.12 or newer:

```cmd
npm install
npm test
npm run make:win
```

`npm run build` creates the renderer and centered Windows icons. `npm start` opens the local development application. `npm run package:win` produces an unpacked executable. `npm run make:win` produces `release/Animal Kaiser Scanner Setup 1.0.0.exe` with electron-builder and NSIS.

The installer uses an assisted flow with a directory picker. It creates Start Menu and desktop shortcuts, and recreates the desktop shortcut on reinstall. The installed uninstaller is named `Uninstall.exe`. Its uninstall script also finds desktop shortcuts renamed by the user and removes them only when their target is the installed `Animal Kaiser Scanner.exe`. The previous Squirrel installer cannot gain this behavior retroactively; a shortcut left by an earlier Squirrel uninstall may need manual removal.

## Data and upgrades

Windows user data stays in `%APPDATA%\AK Scanner` so the renamed 1.0.0 app can still read cards, images and game port settings created by the previous release. The SQLite file is `data\ak-scanner.sqlite`, owned card images are in `images`, and game settings are in `data\game-settings.json`. Installation location can change without moving these data. The assisted uninstaller offers an unchecked option to delete this directory; by default it keeps the data.

The game sender posts only to `127.0.0.1:<saved port>/sys147/barcode` and does not open a server port.

## Release checks

1. Confirm `npm test` and `npm run make:win` succeed.
2. Install into a selected folder, confirm the desktop shortcut appears, open the app, and check the three catalogue cards against the Laravel version using a 500×123 card image.
3. Rename the desktop shortcut, uninstall through Windows Settings, and verify the renamed shortcut is removed while `%APPDATA%\AK Scanner` remains when the delete-data option is unchecked. Reinstall, check that option during uninstall, and verify the data directory is removed.
4. Verify a successful manual send clears the input, and a failed send keeps it for retry. Check an actual scan with Play! and the game.

The installer is unsigned until code signing credentials are available. Windows may show its normal unsigned application warning.

## Workspace status

The production renderer and 29 automated tests pass for the revised 1.0.0. `release/win-unpacked/Animal Kaiser Scanner.exe` was packaged with the latest catalogue Use navigation. The NSIS build completed and produced `release/Animal Kaiser Scanner Setup 1.0.0.exe` (121,137,224 bytes; SHA-256 `58759DDC75E1E745525934BDCF231DB9BE516B0A05E8224E8478046750639931`). The NSIS compiler accepted the `Uninstall.exe` name, desktop shortcut, and uninstall data-choice scripts. The installer has not yet been installed or uninstalled for a live check. `release/builder-effective-config.yaml` remains from an earlier build because deleting it was denied by the workspace policy; it is stale and should not be used to assess this installer.

Installer options follow [electron-builder's NSIS documentation](https://www.electron.build/docs/nsis/), including `oneClick: false`, `allowToChangeInstallationDirectory: true`, and the `customUnInstall` hook.
