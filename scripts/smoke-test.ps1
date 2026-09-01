$ErrorActionPreference = "Stop"
$gateway = "http://localhost:8000"
$headers = @{ apikey = "demo-api-key" }

Write-Host "1. Confirming unauthenticated requests are rejected"
try {
  Invoke-RestMethod "$gateway/api/pets" | Out-Null
  throw "Expected the gateway to reject a request without an API key"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 401) { throw }
}

Write-Host "2. Calling the pets API through Kong"
$petResponse = Invoke-WebRequest "$gateway/api/pets" -Headers $headers
$pets = $petResponse.Content | ConvertFrom-Json
if ($pets.data.Count -lt 1) { throw "Expected at least one pet" }
if (-not $petResponse.Headers["X-Request-ID"]) { throw "Expected Kong to return an X-Request-ID" }

Write-Host "3. Creating a pet through Kong"
$createdPet = Invoke-RestMethod "$gateway/api/pets" `
  -Method Post `
  -Headers $headers `
  -ContentType "application/json" `
  -Body (@{ name = "Bella"; species = "dog" } | ConvertTo-Json)
if ($createdPet.data.name -ne "Bella") { throw "Expected the created pet to be returned" }

Write-Host "4. Calling the appointments API through Kong"
$appointments = Invoke-RestMethod "$gateway/api/appointments?petId=1" -Headers $headers
if ($appointments.data.Count -ne 1) { throw "Expected one appointment for pet 1" }

Write-Host "Smoke tests passed"
