$historyDir = 'C:\Users\Administrator\AppData\Roaming\Code\User\History\44079c53'
$files = @('yjSt.jsx','Yr64.jsx','DPvF.jsx','Tpcs.jsx','VRDd.jsx','f3gY.jsx')
foreach ($f in $files) {
    $p = Join-Path $historyDir $f
    if (Test-Path $p) {
        Write-Output "===== CONTENT OF $f ====="
        Get-Content $p -Raw
        Write-Output "========================================"
    }
}
