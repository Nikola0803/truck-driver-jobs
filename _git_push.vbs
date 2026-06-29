Set shell = CreateObject("WScript.Shell")
Set exec = shell.Exec("cmd /c cd /d ""C:\Users\PC\Desktop\truck driver jobs"" && git add -A && git commit -m ""feat: enrich CDL landing pages with SEO content, highlights, FAQ schema"" && git push origin main 2>&1")
output = exec.StdOut.ReadAll()
MsgBox output, 64, "Git Push Result"
