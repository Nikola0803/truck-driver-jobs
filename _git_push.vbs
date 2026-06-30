' _git_push.vbs — double-click to push the current project to GitHub.
'
' This delegates to push-to-github.bat, which already handles:
'   - initializing git / setting the remote if missing
'   - staging changes
'   - committing only if there ARE changes (a hardcoded/no-op commit
'     used to make the old version of this script fail silently and
'     never reach `git push`)
'   - pushing regardless, with a timestamped commit message
'
' Uses the folder this script lives in, not a hardcoded path, so it
' keeps working even if the project folder gets moved or renamed.

Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = scriptDir & "\push-to-github.bat"

If Not fso.FileExists(batPath) Then
    MsgBox "Could not find push-to-github.bat in:" & vbCrLf & scriptDir, 16, "Git Push Error"
    WScript.Quit 1
End If

Set exec = shell.Exec("cmd /c cd /d """ & scriptDir & """ && call """ & batPath & """ /nopause 2>&1")
output = exec.StdOut.ReadAll()

MsgBox output, 64, "Git Push Result"
