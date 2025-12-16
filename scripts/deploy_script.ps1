param(
    [Parameter(Mandatory=$true)]
    [string]$ScriptPath,

    [Parameter(Mandatory=$true)]
    [string]$WindmillPath
)

# Configuration from environment variables
$WindmillUrl = if ($env:WINDMILL_URL) { $env:WINDMILL_URL } else { "http://localhost" }
$WindmillWorkspace = if ($env:WINDMILL_WORKSPACE) { $env:WINDMILL_WORKSPACE } else { "family-brain" }
$WindmillToken = $env:WINDMILL_TOKEN

if (-not $WindmillToken) {
    Write-Error "WINDMILL_TOKEN environment variable must be set"
    exit 1
}

$content = Get-Content $ScriptPath -Raw

$body = @{
    path = $WindmillPath
    summary = "Deployed via script"
    description = "Auto-deployed from local file"
    content = $content
    language = "python3"
} | ConvertTo-Json -Depth 10

$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)

try {
    $response = Invoke-RestMethod -Uri "$WindmillUrl/api/w/$WindmillWorkspace/scripts/create" `
        -Method Post `
        -Headers @{
            Authorization = "Bearer $WindmillToken"
            "Content-Type" = "application/json"
        } `
        -Body $bytes

    Write-Host "Deploy SUCCESS: $WindmillPath"
    Write-Host $response
} catch {
    Write-Host "Deploy FAILED: $($_.Exception.Message)"
    Write-Host $_.ErrorDetails.Message
}
