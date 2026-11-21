[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $Server
)

$ErrorActionPreference = 'Stop'
$sqlcmd = Get-Command sqlcmd -ErrorAction SilentlyContinue
if (-not $sqlcmd) {
    throw 'No se encontro sqlcmd. Instala SQL Server Command Line Utilities o agrega sqlcmd.exe al PATH.'
}

$steps = @(
    @{ File = 'GETICKETS-base-schema.sql'; Database = 'master'; Label = 'Esquema base' },
    @{ File = 'GETICKETS-backend.sql'; Database = 'GETICKETS'; Label = 'Procedimientos de la API' },
    @{ File = 'GETICKETS-paridad.sql'; Database = 'GETICKETS'; Label = 'Migracion de paridad y catalogos' },
    @{ File = 'GETICKETS-ticket-flow-fix.sql'; Database = 'GETICKETS'; Label = 'Correcciones del flujo de tickets' }
)

foreach ($step in $steps) {
    $filePath = Join-Path $PSScriptRoot $step.File
    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        throw "No se encontro el script requerido: $filePath"
    }

    Write-Host "Aplicando: $($step.Label)"
    & $sqlcmd.Source -S $Server -d $step.Database -E -b -i $filePath
    if ($LASTEXITCODE -ne 0) {
        throw "Fallo '$($step.Label)' (sqlcmd exit code $LASTEXITCODE). Corrige el error antes de continuar."
    }
}

Write-Host 'Migraciones registradas:'
& $sqlcmd.Source -S $Server -d GETICKETS -E -b -Q "SET NOCOUNT ON; SELECT Version, Nombre, FechaAplicacion FROM dbo.Tbl_Migracion ORDER BY Version;"
if ($LASTEXITCODE -ne 0) {
    throw 'La instalacion termino, pero no se pudo consultar el historial de migraciones.'
}

Write-Host 'GETICKETS quedo instalado/actualizado correctamente.' -ForegroundColor Green
