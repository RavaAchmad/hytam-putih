$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$assetDir = Join-Path (Get-Location) "public\assets"
New-Item -ItemType Directory -Force -Path $assetDir | Out-Null

function New-Canvas {
  param([int]$Width, [int]$Height, [string]$Back = "#f7f7f3")

  $bitmap = [System.Drawing.Bitmap]::new($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml($Back))
  return @($bitmap, $graphics)
}

function Save-Jpeg {
  param($Bitmap, [string]$Path, [long]$Quality = 82)

  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
  $params = [System.Drawing.Imaging.EncoderParameters]::new(1)
  $params.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, $Quality)
  $Bitmap.Save($Path, $codec, $params)
}

function Brush {
  param([string]$Hex)
  return [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($Hex))
}

function Pen {
  param([string]$Hex, [float]$Width = 2)
  return [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($Hex), $Width)
}

function Fill-Polygon {
  param($Graphics, [string]$Hex, [array]$Points)
  $brush = Brush $Hex
  $Graphics.FillPolygon($brush, [System.Drawing.PointF[]]$Points)
  $brush.Dispose()
}

function Fill-Ellipse {
  param($Graphics, [string]$Hex, [float]$X, [float]$Y, [float]$W, [float]$H)
  $brush = Brush $Hex
  $Graphics.FillEllipse($brush, $X, $Y, $W, $H)
  $brush.Dispose()
}

function Fill-Rect {
  param($Graphics, [string]$Hex, [float]$X, [float]$Y, [float]$W, [float]$H)
  $brush = Brush $Hex
  $Graphics.FillRectangle($brush, $X, $Y, $W, $H)
  $brush.Dispose()
}

function Draw-Line {
  param($Graphics, [string]$Hex, [float]$Width, [float]$X1, [float]$Y1, [float]$X2, [float]$Y2)
  $pen = Pen $Hex $Width
  $Graphics.DrawLine($pen, $X1, $Y1, $X2, $Y2)
  $pen.Dispose()
}

$canvas = New-Canvas 1280 900 "#f7f7f3"
$hero = $canvas[0]
$g = $canvas[1]

$grad = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  [System.Drawing.Rectangle]::new(0, 0, 1280, 900),
  [System.Drawing.ColorTranslator]::FromHtml("#f7f7f3"),
  [System.Drawing.ColorTranslator]::FromHtml("#111111"),
  18
)
$g.FillRectangle($grad, 0, 0, 1280, 900)
$grad.Dispose()

Fill-Polygon $g "#e6e6e2" @(
  [System.Drawing.PointF]::new(760, 0),
  [System.Drawing.PointF]::new(1280, 0),
  [System.Drawing.PointF]::new(1280, 900),
  [System.Drawing.PointF]::new(950, 900)
)
Fill-Polygon $g "#080808" @(
  [System.Drawing.PointF]::new(675, 120),
  [System.Drawing.PointF]::new(850, 174),
  [System.Drawing.PointF]::new(780, 780),
  [System.Drawing.PointF]::new(512, 780),
  [System.Drawing.PointF]::new(458, 174)
)
Fill-Polygon $g "#1b1b1b" @(
  [System.Drawing.PointF]::new(458, 174),
  [System.Drawing.PointF]::new(330, 336),
  [System.Drawing.PointF]::new(438, 412),
  [System.Drawing.PointF]::new(520, 250)
)
Fill-Polygon $g "#222222" @(
  [System.Drawing.PointF]::new(850, 174),
  [System.Drawing.PointF]::new(990, 338),
  [System.Drawing.PointF]::new(884, 420),
  [System.Drawing.PointF]::new(790, 254)
)
Fill-Ellipse $g "#eeeeee" 604 238 90 128
Fill-Ellipse $g "#090909" 627 270 42 72
Fill-Rect $g "#161616" 802 615 214 132
Fill-Ellipse $g "#f2f2ef" 852 568 112 92
Fill-Ellipse $g "#101010" 878 590 60 48
Draw-Line $g "#fafafa" 7 150 715 1120 622
Draw-Line $g "#555555" 5 166 752 1110 705
Draw-Line $g "#111111" 5 184 788 1088 790

Save-Jpeg $hero (Join-Path $assetDir "hero-atelier.jpg") 78
$g.Dispose()
$hero.Dispose()

function New-ProductImage {
  param(
    [string]$File,
    [string]$Back,
    [string]$Accent,
    [scriptblock]$Draw
  )

  $canvas = New-Canvas 640 720 $Back
  $bitmap = $canvas[0]
  $graphics = $canvas[1]
  Fill-Rect $graphics "#f8f8f5" 0 0 640 720
  Fill-Polygon $graphics $Back @(
    [System.Drawing.PointF]::new(0, 0),
    [System.Drawing.PointF]::new(640, 0),
    [System.Drawing.PointF]::new(548, 720),
    [System.Drawing.PointF]::new(0, 720)
  )
  Draw-Line $graphics $Accent 7 54 645 586 102
  & $Draw $graphics
  Save-Jpeg $bitmap (Join-Path $assetDir $File) 82
  $graphics.Dispose()
  $bitmap.Dispose()
}

New-ProductImage "look-coat.jpg" "#ddddda" "#111111" {
  param($g)
  Fill-Polygon $g "#050505" @(
    [System.Drawing.PointF]::new(318, 90),
    [System.Drawing.PointF]::new(456, 168),
    [System.Drawing.PointF]::new(510, 618),
    [System.Drawing.PointF]::new(350, 664),
    [System.Drawing.PointF]::new(196, 618),
    [System.Drawing.PointF]::new(214, 168)
  )
  Fill-Polygon $g "#1f1f1f" @(
    [System.Drawing.PointF]::new(214, 168),
    [System.Drawing.PointF]::new(106, 278),
    [System.Drawing.PointF]::new(172, 370),
    [System.Drawing.PointF]::new(264, 218)
  )
  Fill-Polygon $g "#181818" @(
    [System.Drawing.PointF]::new(456, 168),
    [System.Drawing.PointF]::new(550, 282),
    [System.Drawing.PointF]::new(490, 374),
    [System.Drawing.PointF]::new(408, 218)
  )
  Draw-Line $g "#f8f8f5" 8 318 176 318 610
}

New-ProductImage "bag-keyline.jpg" "#161616" "#f8f8f5" {
  param($g)
  Fill-Rect $g "#080808" 142 314 356 238
  Fill-Rect $g "#303030" 170 284 300 62
  Fill-Ellipse $g "#f8f8f5" 250 202 146 132
  Fill-Ellipse $g "#111111" 278 228 90 76
  Draw-Line $g "#e9e9e6" 5 142 352 498 352
}

New-ProductImage "orbit-earcuff.jpg" "#2d2d2d" "#f8f8f5" {
  param($g)
  Fill-Ellipse $g "#f6f6f2" 178 176 286 286
  Fill-Ellipse $g "#111111" 226 224 190 190
  $pen1 = Pen "#f8f8f5" 16
  $g.DrawArc($pen1, 150, 154, 344, 344, 18, 286)
  $pen1.Dispose()
  Fill-Ellipse $g "#777777" 364 210 48 48
  Fill-Ellipse $g "#050505" 210 432 62 62
}

New-ProductImage "column-heel.jpg" "#eeeeeb" "#111111" {
  param($g)
  Fill-Polygon $g "#050505" @(
    [System.Drawing.PointF]::new(128, 402),
    [System.Drawing.PointF]::new(382, 358),
    [System.Drawing.PointF]::new(528, 428),
    [System.Drawing.PointF]::new(506, 482),
    [System.Drawing.PointF]::new(270, 470)
  )
  Fill-Polygon $g "#101010" @(
    [System.Drawing.PointF]::new(408, 422),
    [System.Drawing.PointF]::new(472, 438),
    [System.Drawing.PointF]::new(416, 642),
    [System.Drawing.PointF]::new(368, 642)
  )
  Fill-Rect $g "#f8f8f5" 372 608 74 34
}

Write-Host "Generated monochrome image assets in $assetDir"
