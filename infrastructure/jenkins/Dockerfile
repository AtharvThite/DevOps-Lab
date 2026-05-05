FROM jenkins/jenkins:lts-jdk17

USER root

# Install system dependencies, Node.js, Podman, and uidmap
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl unzip git tar xz-utils ca-certificates gnupg lsb-release \
      python3 python3-pip python3-venv pipx openssh-client podman uidmap \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Disable user namespace remapping — not possible inside a container.
# Clear subuid/subgid so Podman doesn't attempt newuidmap, and
# remove setuid bit from newuidmap/newgidmap as a safety net.
RUN truncate -s 0 /etc/subuid /etc/subgid && \
    chmod a-s /usr/bin/newuidmap /usr/bin/newgidmap 2>/dev/null || true

# --- Configure Podman Storage for nested builds ---
# Write storage.conf to BOTH /etc/containers/ and /usr/share/containers/
# to ensure Podman finds it no matter which path it checks
RUN mkdir -p /etc/containers /usr/share/containers /var/lib/containers/storage /run/containers/storage && \
    echo '[storage]' > /etc/containers/storage.conf && \
    echo 'driver = "vfs"' >> /etc/containers/storage.conf && \
    echo 'runroot = "/run/containers/storage"' >> /etc/containers/storage.conf && \
    echo 'graphroot = "/var/lib/containers/storage"' >> /etc/containers/storage.conf && \
    echo '' >> /etc/containers/storage.conf && \
    echo '[storage.options.vfs]' >> /etc/containers/storage.conf && \
    echo 'ignore_chown_errors = "true"' >> /etc/containers/storage.conf && \
    cp /etc/containers/storage.conf /usr/share/containers/storage.conf

# SonarScanner CLI
RUN curl -fsSL -o /tmp/sonar-scanner.zip \
      https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-6.2.1.4610-linux-x64.zip \
    && unzip -q /tmp/sonar-scanner.zip -d /opt \
    && ln -sf /opt/sonar-scanner-6.2.1.4610-linux-x64/bin/sonar-scanner /usr/local/bin/sonar-scanner \
    && rm /tmp/sonar-scanner.zip

# Terraform
RUN curl -fsSL https://releases.hashicorp.com/terraform/1.14.9/terraform_1.14.9_linux_amd64.zip \
      -o /tmp/terraform.zip \
    && unzip -q /tmp/terraform.zip -d /usr/local/bin \
    && chmod +x /usr/local/bin/terraform \
    && rm /tmp/terraform.zip

# Ansible
ENV PIPX_HOME=/opt/pipx
ENV PIPX_BIN_DIR=/usr/local/bin
RUN pipx install ansible-core

# LXC client
RUN curl -fsSL -o /usr/local/bin/lxc \
      https://github.com/canonical/lxd/releases/download/lxd-5.21.4/bin.linux.lxc.x86_64 \
    && chmod +x /usr/local/bin/lxc

USER jenkins