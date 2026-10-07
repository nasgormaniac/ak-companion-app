param(
  [string]$Source = (Join-Path $PSScriptRoot '..\..\app-icon.png'),
  [string]$Destination = (Join-Path $PSScriptRoot '..\public\window-icon.png'),
  [string]$IconDestination = (Join-Path $PSScriptRoot '..\assets\app.ico')
)

Add-Type -AssemblyName System.Drawing
$sourceImage = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $Source).Path)
try {
  function New-CenteredPng([int]$canvasSize) {
    $contentWidth = [int][Math]::Round($canvasSize * 0.9375)
    $scale = [Math]::Min($contentWidth / $sourceImage.Width, $contentWidth / $sourceImage.Height)
    $width = [int][Math]::Round($sourceImage.Width * $scale)
    $height = [int][Math]::Round($sourceImage.Height * $scale)
    $x = [int][Math]::Floor(($canvasSize - $width) / 2)
    $y = [int][Math]::Floor(($canvasSize - $height) / 2)
    $bitmap = [System.Drawing.Bitmap]::new($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($sourceImage, [System.Drawing.Rectangle]::new($x, $y, $width, $height))
      } finally { $graphics.Dispose() }
      $stream = [System.IO.MemoryStream]::new()
      try {
        $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
        return $stream.ToArray()
      } finally { $stream.Dispose() }
    } finally { $bitmap.Dispose() }
  }

  $png = New-CenteredPng 512
  [System.IO.File]::WriteAllBytes($Destination, $png)
  $sizes = @(16, 24, 32, 48, 64, 128, 256)
  $entries = @($sizes | ForEach-Object { [pscustomobject]@{ Size = $_; Data = (New-CenteredPng $_) } })
  $iconDirectory = Split-Path -Parent $IconDestination
  [System.IO.Directory]::CreateDirectory($iconDirectory) | Out-Null
  $file = [System.IO.File]::Create($IconDestination)
  try {
    $writer = [System.IO.BinaryWriter]::new($file)
    try {
      $writer.Write([uint16]0)
      $writer.Write([uint16]1)
      $writer.Write([uint16]$entries.Count)
      $offset = 6 + 16 * $entries.Count
      foreach ($entry in $entries) {
        $writer.Write([byte]($entry.Size % 256))
        $writer.Write([byte]($entry.Size % 256))
        $writer.Write([byte]0)
        $writer.Write([byte]0)
        $writer.Write([uint16]1)
        $writer.Write([uint16]32)
        $writer.Write([uint32]$entry.Data.Length)
        $writer.Write([uint32]$offset)
        $offset += $entry.Data.Length
      }
      foreach ($entry in $entries) { $writer.Write([byte[]]$entry.Data) }
    } finally { $writer.Dispose() }
  } finally { $file.Dispose() }
} finally { $sourceImage.Dispose() }
