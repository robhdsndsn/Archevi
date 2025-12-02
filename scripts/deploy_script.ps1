param(
    [Parameter(Mandatory=$true)]
    [string]$ScriptPath,

    [Parameter(Mandatory=$true)]
    [string]$WindmillPath
)

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
    $response = Invoke-RestMethod -Uri "http://localhost/api/w/family-brain/scripts/create" `
        -Method Post `
        -Headers @{
            Authorization = "Bearer t8u4sIJRGhaHPqLn0VuUPUPbWSa9uTyi"
            "Content-Type" = "application/json"
        } `
        -Body $bytes

    Write-Host "Deploy SUCCESS: $WindmillPath"
    Write-Host $response
} catch {
    Write-Host "Deploy FAILED: $($_.Exception.Message)"
    Write-Host $_.ErrorDetails.Message
}
