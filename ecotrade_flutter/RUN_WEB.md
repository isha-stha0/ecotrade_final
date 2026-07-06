# Running This Project on Web

Do not use plain `flutter run` for this project on this machine. Flutter's direct Chrome debug launch is timing out even though Chrome is installed.

Use this command instead:

```powershell
cd F:\Isha\ecotrade_final\ecotrade_flutter
.\run_web_fixed.ps1
```

Then open:

```text
http://localhost:56115
```

In VS Code, use the launch config named:

```text
Flutter Web Server (fixed port, reliable)
```

The Chrome launch config is still available, but it is marked as likely to fail.
