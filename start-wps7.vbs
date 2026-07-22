Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
base = fso.GetParentFolderName(WScript.ScriptFullName)

core = base & "\wps7.exe"
If Not fso.FileExists(core) Then
  core = base & "\dist\wps7.exe"
End If

shell.Run Chr(34) & core & Chr(34), 0, False
