$historyDir = 'C:\Users\Administrator\AppData\Roaming\Code\User\History'
$cutoff = (Get-Date).AddHours(-2)
Get-ChildItem $historyDir -Directory | Where-Object { $_.LastWriteTime -gt $cutoff } | ForEach-Object {
    $e = Join-Path $_.FullName 'entries.json'
    if (Test-Path $e) {
        Write-Output "=== DIR: $($_.Name)  Modified: $($_.LastWriteTime) ==="
        Get-Content $e
        Write-Output ""
    }
}
