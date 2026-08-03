# Print SHA-256 (base64) certificate pin for system.merncrest.lk
# Paste the output into lib/services/ssl_pinning_io.dart → productionPinFingerprints

$targetHost = "system.merncrest.lk"
try {
  $tcp = New-Object System.Net.Sockets.TcpClient($targetHost, 443)
  $ssl = New-Object System.Net.Security.SslStream($tcp.GetStream(), $false, ({ $true }))
  $ssl.AuthenticateAsClient($targetHost)
  $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($ssl.RemoteCertificate)
  $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($cert.RawData)
  $base64 = [Convert]::ToBase64String($hash)
  Write-Host "Host: $targetHost"
  Write-Host "SHA256 base64 pin: $base64"
  $ssl.Close()
  $tcp.Close()
} catch {
  Write-Error $_
  exit 1
}
