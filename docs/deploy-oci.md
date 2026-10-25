# 部署到 OCI VM（Rocky Linux）

本文說明如何把 GPT AI Assistant 部署到 Oracle Cloud Infrastructure（OCI）的 VM 上，以 SQLite 保存狀態，並透過 Cloudflare Tunnel 對外提供 HTTPS webhook。

## 架構

```
LINE Platform ──HTTPS──▶ Cloudflare ──Tunnel──▶ cloudflared ──HTTP──▶ app:3000 ──▶ ./data/app.db
                                              └──────────── OCI VM（Docker Compose）────────────┘
```

- VM 不需要對外開放任何 port（只保留 SSH）。
- SQLite 檔案存放在 VM 的 `./data` 目錄，容器重啟或更新後資料仍會保留。
- Image 由 GitHub Actions 建置並推送到 GHCR，VM 只負責 pull。

## 事前準備

- OCI 帳號（Always Free 即可）
- 託管在 Cloudflare 的網域
- LINE Messaging API channel（Channel access token、Channel secret）
- OpenAI API key

## 1. 發佈 Image 到 GHCR

1. Push 到 `main` 分支後，GitHub Actions（`.github/workflows/ci.yml`）會跑 lint、test，通過後建置 `linux/amd64` image，並以 `latest` 與 commit SHA 兩個 tag 推送到 `ghcr.io/<owner>/gpt-ai-assistant`。
2. 第一次推送後，GHCR 上的 package 預設是私有的。到 GitHub 的「Your profile → Packages → gpt-ai-assistant → Package settings → Change visibility」改為 **Public**，VM 才能免登入 pull。

> Image 中不含任何秘密：`.env` 已被 `.dockerignore` 排除，所有設定都在執行期由 VM 上的 `.env` 提供。

## 2. 建立 VM

1. OCI Console →「Compute → Instances → Create instance」。
2. **Image**：選擇「Change image → Marketplace」，搜尋 **Rocky Linux**（例如 Rocky Linux 9 / 10 Free），選擇與 E2 shape 相容的 x86_64 版本。
3. **Shape**：`VM.Standard.E2.1.Micro`（Always Free）。
4. **Networking**：選擇有 public IP 的 subnet，並上傳你的 SSH public key。
5. 建立完成後，確認 subnet 的 **Security List** 只有 TCP 22 的 ingress 規則；Cloudflare Tunnel 是由 VM 主動向外連線，不需要開 80 / 443。

SSH 登入（Rocky Linux 的預設使用者是 `rocky`）：

```bash
ssh rocky@<VM_PUBLIC_IP>
```

確認 swap 已啟用（E2.1.Micro 只有 1GB 記憶體）：

```bash
free -h
```

## 3. 安裝 Docker

Rocky Linux 預設可能安裝了 Podman，與 Docker 的套件衝突，先移除後再從 Docker 官方 repo 安裝：

```bash
sudo dnf -y update
sudo dnf -y remove podman buildah runc
sudo dnf -y install dnf-plugins-core git
sudo dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

重新登入 SSH 讓 `docker` 群組生效，然後確認：

```bash
docker compose version
```

> Rocky Linux 預設啟用 SELinux（enforcing）。`docker-compose.yaml` 中的 volume 已加上 `:Z`，會自動為 `./data` 設定正確的 SELinux label，不需要關閉 SELinux。

## 4. 建立 Cloudflare Tunnel

1. Cloudflare Dashboard →「Zero Trust → Networks → Tunnels → Create a tunnel」，類型選 **Cloudflared**，並為它命名。
2. 在安裝步驟選擇 **Docker**，複製指令中 `--token` 後面的那串 token（之後填入 `.env` 的 `TUNNEL_TOKEN`）。不需要執行頁面上的指令，`docker-compose.yaml` 已包含 `cloudflared` 服務。
3. 在「Public Hostname」新增一筆：
   - **Subdomain / Domain**：例如 `bot.example.com`
   - **Service**：`HTTP`，URL 填 `app:3000`（Compose 內部網路的服務名稱）

## 5. 設定並啟動服務

```bash
git clone https://github.com/<owner>/gpt-ai-assistant.git
cd gpt-ai-assistant
cp .env.example .env
vi .env
```

`.env` 至少需要設定：

```bash
GHCR_OWNER=<owner>              # GHCR image 的擁有者（小寫）
TUNNEL_TOKEN=<cloudflare-token>
OPENAI_API_KEY=<openai-api-key>
LINE_CHANNEL_ACCESS_TOKEN=<line-channel-access-token>
LINE_CHANNEL_SECRET=<line-channel-secret>
```

> `APP_PORT` 與 `APP_DB_PATH` 由 `docker-compose.yaml` 固定設定，不需要填寫。

容器以非 root 的 `node` 使用者（uid 1000）執行，資料目錄必須屬於該 uid：

```bash
mkdir -p data
sudo chown 1000:1000 data
```

啟動：

```bash
docker compose pull
docker compose up -d
docker compose logs -f
```

## 6. 設定 LINE Webhook

1. LINE Developers Console → 你的 channel →「Messaging API」。
2. **Webhook URL** 填 `https://bot.example.com/webhook`（路徑對應 `APP_WEBHOOK_PATH`，預設為 `/webhook`），按下 **Verify** 確認成功。
3. 開啟 **Use webhook**。

## 7. 設定備份

資料只有一個 SQLite 檔案（WAL 模式），使用 OCI 的 boot volume 備份即可：

1. OCI Console →「Storage → Block Storage → Backup Policies → Create backup policy」。
2. 新增排程：**Weekly**、保留 **4** 週（Always Free 最多保留 5 份 volume 備份）。
3. 到「Compute → Instances → 你的 VM → Boot volume」，將此 policy 指派給 boot volume。

> Boot volume 備份是 crash-consistent 快照。SQLite 在 WAL 模式下可以從這種快照正常復原。

## 更新與回滾

更新到最新版本：

```bash
cd ~/gpt-ai-assistant
git pull
docker compose pull
docker compose up -d
```

回滾到特定版本：在 `.env` 中把 `APP_IMAGE_TAG` 設為該版本的 commit SHA（完整 40 碼），再執行 `docker compose up -d`。

## 疑難排解

| 症狀 | 檢查 |
| --- | --- |
| Webhook Verify 失敗 | `docker compose logs cloudflared` 是否顯示已連線；Public Hostname 的 Service 是否為 `http://app:3000` |
| Webhook 回應 403 | `LINE_CHANNEL_SECRET` 是否正確 |
| `app` 一直重啟，log 出現 `SQLITE_CANTOPEN` 或權限錯誤 | `data` 目錄的擁有者是否為 `1000:1000` |
| 容器被 OOM kill | `free -h` 確認 swap 是否啟用；`docker stats` 檢查記憶體用量 |
