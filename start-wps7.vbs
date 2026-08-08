Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
base = fso.GetParentFolderName(WScript.ScriptFullName)

core = base & "\wps7.exe"
If Not fso.FileExists(core) Then
  core = base & "\dist\wps7.exe"
End If

If Not fso.FileExists(core) Then
  ' Without this the missing file surfaces as a bare Windows Script Host error
  ' that names a line number and a temp path, and explains nothing.
  If fso.FileExists(base & "\package.json") Then
    WScript.Echo "wps7.exe was not found next to this script." & vbCrLf & vbCrLf & _
      "This is the source tree, and GitHub's ""Source code"" archives never contain the executable. " & _
      "Download the release asset named wps7-<version>-windows-x64.zip instead, or build it here with:" & vbCrLf & vbCrLf & _
      "    npm install" & vbCrLf & _
      "    npm run package:win"
  Else
    WScript.Echo "wps7.exe was not found next to this script." & vbCrLf & vbCrLf & _
      "Extract the whole zip to a folder and run start-wps7.vbs from there. " & _
      "Opening it inside the Windows zip viewer unpacks only this one file and leaves wps7.exe behind."
  End If
  WScript.Quit 1
End If

shell.Run Chr(34) & core & Chr(34), 0, False
