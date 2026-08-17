# Jockie Music Production v4

Bản production-oriented: Discord.js + Kazagumo/Shoukaku + Lavalink v4 + LavaSrc + YouTube Source.

## Đã sửa lỗi kiến trúc của bản trước

- Kazagumo được tạo **sau khi Discord Client được tạo**; không còn lỗi import-time với client undefined.
- Lavalink tách riêng khỏi bot.
- Prefix `.env`, mặc định `!`.
- Spotify playlist/track resolve qua LavaSrc.
- YouTube source plugin riêng.
- Queue theo từng server.
- Một message NOW PLAYING duy nhất; chuyển bài = edit message, không spam Started playing.
- Nút Previous/Pause/Skip/Stop/Queue.
- Reconnect/resume Lavalink.
- Health endpoint `/health` cho Render.
- Graceful shutdown.
- Error/unhandled rejection logging.

## Không thể đảm bảo 0 lỗi tuyệt đối

Discord/Spotify/YouTube/Lavalink là dịch vụ bên ngoài. YouTube đặc biệt có thể thay đổi playback. Mục tiêu của bộ này là loại bỏ lỗi code/cấu hình phổ biến và giữ các phiên bản tương thích, nhưng vẫn phải cập nhật plugin khi upstream thay đổi.

## Chạy VPS/Docker

```bash
cp .env.example .env
```

Điền:

```env
DISCORD_TOKEN=...
PREFIX=!
LAVALINK_HOST=lavalink
LAVALINK_PORT=2333
LAVALINK_PASSWORD=...
LAVALINK_SECURE=false
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
PORT=3000
```

Sau đó:

```bash
docker compose up -d --build
docker compose logs -f bot
docker compose logs -f lavalink
```

## Render

Render chạy BOT. Lavalink nên đặt ở VPS/private server ổn định.

Render Environment:

```text
DISCORD_TOKEN
PREFIX
LAVALINK_HOST
LAVALINK_PORT
LAVALINK_PASSWORD
LAVALINK_SECURE
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
PORT
BOT_STATUS
```

Nếu Lavalink ở VPS public, bắt buộc dùng password mạnh và firewall/reverse proxy. Không để Lavalink mở Internet không bảo vệ.

## Discord Developer Portal

Bật **Message Content Intent**. Bot cần View Channel, Send Messages, Embed Links, Manage Messages, Connect, Speak.

## Commands

```text
!play <tên/link>
!p <tên/link>
!pause
!resume
!skip
!previous
!stop
!np
!queue
!volume 1-100
!seek 1:30
!loop off|track|queue
!shuffle
!remove 2
!clear
!autoplay on|off
!help
!ping
!node
```

Đổi prefix chỉ bằng `.env`:

```env
PREFIX=.
```

## Spotify

Tạo Spotify Developer App, lấy Client ID/Client Secret và điền `.env`. Spotify không phải audio stream trực tiếp; LavaSrc resolve metadata/playlist rồi dùng provider playback.

## Health

```text
GET /health
```

Phải trả `discord: true` và `lavalink: true` khi mọi thứ đã READY.


## Jockie-style playback

Playback messages are intentionally minimal: no thumbnail, no progress bar, no buttons.
Each track produces a compact message like:

`🎵 Started playing [Tên bài] by Nghệ sĩ`

The bot does not send a separate finished-playing message.


## Jockie-style playback

Playback messages are intentionally minimal: no thumbnail, no progress bar, no buttons. Each track sends a compact `Started playing [Tên bài] by Nghệ sĩ` message.
