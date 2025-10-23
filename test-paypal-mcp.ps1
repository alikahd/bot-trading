# اختبار PayPal MCP
$env:PAYPAL_ACCESS_TOKEN = "A21AANgnyb0sWvyhOLZqLbsErgWCRs1ENXbo06FUXidtnxpeLRpSipjCdZeeUrtcCzhwoQS5_UPqEKU2KWYGcSL36Y6-CW3Gg"
$env:PAYPAL_ENVIRONMENT = "production"

Write-Host "🧪 اختبار PayPal MCP..." -ForegroundColor Cyan
npx -y @paypal/mcp --tools create-order,capture-payment
