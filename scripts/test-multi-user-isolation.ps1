$ErrorActionPreference = "Stop"

$BaseUrl = "http://localhost:3000"
$emailA = "nexus-isolation-a-1790087096509@example.com"
$passwordA = "NexusTest!A123456"

$emailB = "nexus-isolation-b-1790087096509@example.com"
$passwordB = "NexusTest!B123456"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " NEXUS MULTI-USER RUNTIME ISOLATION TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Login-User($email, $password) {
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

    $body = @{
        email    = $email
        password = $password
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest `
            -Uri "$BaseUrl/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -WebSession $session `
            -UseBasicParsing

        if ($response.StatusCode -ne 200) {
            throw "Login returned HTTP $($response.StatusCode)"
        }

        return $session
    }
    catch {
        throw "Unable to login $email : $($_.Exception.Message)"
    }
}

function Get-Json($session, $path) {
    try {
        $response = Invoke-WebRequest `
            -Uri "$BaseUrl$path" `
            -Method GET `
            -WebSession $session `
            -UseBasicParsing

        $json = $null

        if ($response.Content) {
            try {
                $json = $response.Content | ConvertFrom-Json
            }
            catch {
                $json = $response.Content
            }
        }

        return @{
            Status  = [int]$response.StatusCode
            Content = $json
        }
    }
    catch {
        $status = 0
        $content = $null

        if ($_.Exception.Response) {
            try {
                $status = [int]$_.Exception.Response.StatusCode
            }
            catch {}
        }

        return @{
            Status  = $status
            Content = $content
        }
    }
}

$passed = 0
$failed = 0

function Pass($message) {
    $script:passed++
    Write-Host "[PASS] $message" -ForegroundColor Green
}

function Fail($message) {
    $script:failed++
    Write-Host "[FAIL] $message" -ForegroundColor Red
}

Write-Host "Logging in User A..." -ForegroundColor Yellow
$sessionA = Login-User $emailA $passwordA
Write-Host "User A login successful." -ForegroundColor Green

Write-Host "Logging in User B..." -ForegroundColor Yellow
$sessionB = Login-User $emailB $passwordB
Write-Host "User B login successful." -ForegroundColor Green

Write-Host ""
Write-Host "Testing User A..." -ForegroundColor Cyan

$aInterviewHistory = Get-Json $sessionA "/api/interview/history"
$aInterviewAnalytics = Get-Json $sessionA "/api/interview/analytics"
$aCopilotHistory = Get-Json $sessionA "/api/copilot/history"
$aCareerActions = Get-Json $sessionA "/api/career/actions"

Write-Host "A /interview/history   -> $($aInterviewHistory.Status)"
Write-Host "A /interview/analytics -> $($aInterviewAnalytics.Status)"
Write-Host "A /copilot/history     -> $($aCopilotHistory.Status)"
Write-Host "A /career/actions      -> $($aCareerActions.Status)"

Write-Host ""
Write-Host "Testing User B..." -ForegroundColor Cyan

$bInterviewHistory = Get-Json $sessionB "/api/interview/history"
$bInterviewAnalytics = Get-Json $sessionB "/api/interview/analytics"
$bCopilotHistory = Get-Json $sessionB "/api/copilot/history"
$bCareerActions = Get-Json $sessionB "/api/career/actions"

Write-Host "B /interview/history   -> $($bInterviewHistory.Status)"
Write-Host "B /interview/analytics -> $($bInterviewAnalytics.Status)"
Write-Host "B /copilot/history     -> $($bCopilotHistory.Status)"
Write-Host "B /career/actions      -> $($bCareerActions.Status)"

Write-Host ""
Write-Host "Checking endpoint availability..." -ForegroundColor Cyan

if ($aInterviewHistory.Status -eq 200) {
    Pass "User A interview history endpoint"
} else {
    Fail "User A interview history endpoint"
}

if ($bInterviewHistory.Status -eq 200) {
    Pass "User B interview history endpoint"
} else {
    Fail "User B interview history endpoint"
}

if ($aInterviewAnalytics.Status -eq 200) {
    Pass "User A interview analytics endpoint"
} else {
    Fail "User A interview analytics endpoint"
}

if ($bInterviewAnalytics.Status -eq 200) {
    Pass "User B interview analytics endpoint"
} else {
    Fail "User B interview analytics endpoint"
}

if ($aCopilotHistory.Status -eq 200) {
    Pass "User A Copilot history endpoint"
} else {
    Fail "User A Copilot history endpoint"
}

if ($bCopilotHistory.Status -eq 200) {
    Pass "User B Copilot history endpoint"
} else {
    Fail "User B Copilot history endpoint"
}

if ($aCareerActions.Status -eq 200) {
    Pass "User A career actions endpoint"
} else {
    Fail "User A career actions endpoint"
}

if ($bCareerActions.Status -eq 200) {
    Pass "User B career actions endpoint"
} else {
    Fail "User B career actions endpoint"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passed: $passed"
Write-Host "Failed: $failed"
Write-Host "========================================" -ForegroundColor Cyan

if ($failed -gt 0) {
    throw "Runtime isolation baseline test failed."
}

Write-Host "Runtime isolation baseline test passed." -ForegroundColor Green
