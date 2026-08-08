# wps7

繁體中文 | [English](README.md)

可攜式的 Windows 網頁終端工作區，設計概念來自 `tmux-continuum`。它把 PowerShell
工作階段、檔案管理員、記事本、瀏覽器窗格與白板提供給本機上的任何瀏覽器使用，並在
重新開機後重建原本的版面配置。

> [!WARNING]
> **wps7 等於把 PowerShell 和整個檔案系統開放給網頁瀏覽器存取。**
> 任何人只要能連到監聽的連接埠並通過驗證，就能以執行伺服器的帳戶身分執行任意指令。
>
> 預設設定綁定在 `127.0.0.1` 且不設密碼，這是為了單人桌面使用而設計的。
> **在把 `server.host` 改成 `0.0.0.0` 之前，請先設定一組強密碼** —— 安裝程式之所以
> 拒絕在沒有 `auth.password_hash` 的情況下把 wps7 暴露到區域網路，正是這個原因。
>
> 目前沒有 TLS。在區域網路上，密碼、工作階段權杖以及所有終端輸出都是以明文傳輸的。
> 若要用在信任網路以外的環境，請把 wps7 放在能終結 TLS 的反向代理後面。
> 詳見 [SECURITY.md](SECURITY.md)。

## 下載

請到[發行頁面](../../releases)下載 `wps7-<版本>-windows-x64.zip`。GitHub 一併產生的
「Source code」壓縮檔只包含原始碼，裡面沒有 `wps7.exe`。

連按兩下 `start-wps7.vbs` 之前，請先把整個 zip 解壓縮到資料夾。直接在 Windows 的
壓縮檔檢視器裡開啟啟動器，只會把那一個檔案解到暫存目錄，執行檔仍留在壓縮檔內。

wps7 沒有程式碼簽章，因此下載回來的版本第一次執行時 SmartScreen 會提出警告。請先用
`SHA256SUMS.txt` 比對 SHA256，然後在解壓縮前清除下載標記 —— 對 zip 按右鍵、開啟內容、
勾選「解除封鎖」、按確定。或者自己先執行一次 `wps7.exe`，選擇「更多資訊」再選「仍要
執行」；取消該提示正是啟動器回報 `800704C7` 的原因。

## 從原始碼執行

```powershell
npm install
npm start
```

程式會建立 `config.toml` 與 `data/state.json`，並開啟 `http://127.0.0.1:5000`。

執行打包後的版本時，`config.toml`、`data/` 與記錄檔會放在執行檔旁邊。

## 開機自動啟動

若要讓網頁伺服器在 Windows 登入前就啟動，並在登入後顯示系統匣圖示：

```powershell
npm run nssm:install
npm run startup:install
```

安裝程式會用 NSSM 把伺服器註冊成 Windows 服務，並為系統匣圖示建立一個屬於該使用者的
啟動捷徑。

- `wps7-server`：由 NSSM 管理的 Windows 服務，開機時以無介面模式啟動伺服器。
- `Startup\wps7 tray.lnk`：登入後啟動系統匣圖示。
- `wps7-service-start` / `wps7-service-restart` / `wps7-service-stop`：系統匣選單使用的
  提權隨選工作。

`npm run nssm:install` 會從 `nssm.cc` 下載 NSSM 的發行版本、驗證其 SHA256，並存放到
`tools\nssm\nssm.exe`。你也可以自行把 `nssm.exe` 放到該位置，或把 NSSM 安裝到 `PATH`。
Windows 在登入前沒有工作列，因此必須等到有使用者工作階段之後圖示才會出現。安裝程式會
詢問一次你的 Windows 密碼，因為該服務與提權控制工作都是以你的帳戶身分執行。

系統匣圖示是面向使用者的控制介面。它獨立於伺服器運作，提供開啟、啟動、儲存、重新啟動、
停止、檢視記錄與診斷等功能。工具提示與選單狀態每隔數秒會依據服務與本機執行狀態更新。

如果你為了區域網路存取而設定 `server.host = "0.0.0.0"`，請先設定一組強度足夠的網頁密碼。
安裝程式在沒有 `auth.password_hash` 的情況下會拒絕把 wps7 暴露到區域網路，因為這個程式
提供的是瀏覽器對 PowerShell 的存取權。

若要移除服務、系統匣捷徑、控制工作與防火牆規則：

```powershell
npm run startup:uninstall
```

## 打包

```powershell
npm run package:win
```

打包後的執行檔會輸出到 `dist/wps7.exe`。連按兩下 `dist/start-wps7.vbs` 即可在不顯示
主控台視窗的情況下啟動。

## 還原機制

Windows 在重新開機後無法還原任意行程的記憶體內容。wps7 會儲存工作區、窗格、工作目錄
中繼資料、終端捲動緩衝以及最後一個指令的提示。重新啟動時它會重建窗格，但只會自動重跑
列在 `restore.allowlist` 中的指令。

## PowerShell

wps7 優先使用 `pwsh.exe`，找不到時才退回 `powershell.exe`。若使用了退回選項，網頁介面
會顯示建議安裝 PowerShell 7 的提示。

## 參與開發

開發環境設定與儲存庫慣例請參閱 [CONTRIBUTING.md](CONTRIBUTING.md)。安全性問題請依照
[SECURITY.md](SECURITY.md) 的流程私下回報，不要開公開的 issue。

## 授權

MIT —— 詳見 [LICENSE](LICENSE)。

wps7 會重新散布第三方程式碼：打包後的執行檔內嵌了所有正式相依套件，而 `public/vendor/`
則附帶預先建置的 Excalidraw、React、xterm.js 以及它們使用的字型。這些元件的授權聲明
彙整在 [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md)，可用
`npm run licenses:generate` 重新產生。

## 致謝

- [Excalidraw](https://github.com/excalidraw/excalidraw) 提供白板窗格的功能。
- [xterm.js](https://github.com/xtermjs/xterm.js) 提供終端窗格的功能。
- [CodexBar](https://github.com/steipete/CodexBar) 啟發了用量窗格的設計。
- [NSSM](https://nssm.cc/) 讓 wps7 能以 Windows 服務的形式執行。
