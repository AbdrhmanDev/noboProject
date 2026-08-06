$historyDir = 'C:\Users\Administrator\AppData\Roaming\Code\User\History\44079c53'
Get-ChildItem $historyDir -Filter '*.jsx' | ForEach-Object {
    Write-Output "=== $($_.Name) LastWrite: $($_.LastWriteTime) Size: $($_.Length) ==="
}
