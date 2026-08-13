# BoardCAD Web - Linux版

このパッケージは、macOS用 `start.command` を使わず、Linux上でBoardCAD Webを起動できるようにしたものです。
BoardCAD本体はHTML/CSS/JavaScriptなので、主要機能のコードは変更していません。

## いちばん簡単な起動方法

`BoardCAD.desktop` をクリックすると、ローカルサーバーをバックグラウンドで起動し、`http://localhost:8788/` をブラウザで開きます。

Linuxのデスクトップ環境によって、初回だけ `BoardCAD.desktop` を右クリックして「起動を許可」「Allow Launching」「信頼する」等を選ぶ必要があります。これはLinux側のセキュリティ仕様です。

起動後はターミナルを開いたままにする必要はありません。停止したい場合は `stop.sh` を実行してください。

## 必要なもの

- Linux デスクトップ環境
- Python 3
- Web Serialを使用する場合: Google Chrome / Chromium / Microsoft Edge 系ブラウザを推奨

## 起動方法

### 方法1: ターミナルから

```sh
cd BoardCAD-Web-Linux
./start.sh
```

`http://localhost:8788/` が自動で開きます。
使用中は起動したターミナルを閉じないでください。終了は `Ctrl+C` です。

### 方法2: デスクトップランチャー

ファイルマネージャーが `.desktop` の実行を許可している場合は、`BoardCAD-Web.desktop` を実行できます。
デスクトップ環境によっては最初に「実行を許可」「信頼する」などの操作が必要です。

### 方法3: アプリケーションメニューへ登録

```sh
./install-desktop-launcher.sh
```

ユーザー用のアプリケーションメニューに `BoardCAD Web` を登録します。

## シリアル接続について

Linuxではユーザーがシリアルデバイスへアクセスできる必要があります。接続できない場合は、使用ディストリビューションに応じてユーザーを `dialout` 等のシリアル用グループへ追加し、ログインし直してください。

例（Debian / Ubuntu系）:

```sh
sudo usermod -aG dialout "$USER"
```

ブラウザ側ではWeb Serial対応ブラウザから `Choose Port` / `Connect` を使用します。

## SpaceMouse / 3D Mouse

元パッケージの `local-bridge` はmacOSの IOKit / CoreFoundation を使うmacOS専用実装です。そのソースは参考用として残していますが、Linuxではそのままコンパイル・実行できません。
BoardCAD Webの通常のマウス操作、BRD編集、PDF/DXF/Gコード/CNC/Probe機能には影響しません。

## ポート変更

8788番が使用中なら、次のように別ポートで起動できます。

```sh
BOARDCAD_PORT=8790 ./start.sh
```

## 開発チェック

Node.jsがある場合:

```sh
node --check app.js
node --check test-core.js
node test-core.js
```
