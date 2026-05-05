#!/bin/bash
set -e

PROXY_SOCK="./lxd-proxy.sock"
LXD_SOCK="/var/snap/lxd/common/lxd/unix.socket"

# Clean up any stale proxy socket (or directory accidentally created by podman)
rm -rf "$PROXY_SOCK"

echo "Starting LXD socket proxy..."
echo "This forwards your user's LXD access to the rootless Podman container."

# Run socat in the background to proxy the connection
nohup socat UNIX-LISTEN:"$PROXY_SOCK",fork,mode=777 UNIX-CONNECT:"$LXD_SOCK" > proxy.log 2>&1 &
PROXY_PID=$!

# Wait for socket to be created
sleep 1

if [ -S "$PROXY_SOCK" ]; then
    echo "✅ Proxy running (PID: $PROXY_PID). LXD socket is exposed at $PROXY_SOCK"
    echo "You can now run 'podman compose up -d' to start the application."
    echo "To stop the proxy later, run: kill $PROXY_PID"
else
    echo "❌ Failed to start proxy. Check if socat is installed."
    exit 1
fi
