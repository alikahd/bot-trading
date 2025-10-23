# اختبار نهائي لـ PayPal MCP
$env:PAYPAL_ENVIRONMENT = "production"

Write-Host "🧪 اختبار PayPal MCP بالأدوات الصحيحة..." -ForegroundColor Cyan
npx -y @paypal/mcp --access-token A21AANgnyb0sWvyhOLZqLbsErgWCRs1ENXbo06FUXidtnxpeLRpSipjCdZeeUrtcCzhwoQS5_UPqEKU2KWYGcSL36Y6-CW3Gg --tools orders.create,orders.capture
