FROM jenkins/jenkins:lts-jdk17

USER root

# Install system dependencies and Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl unzip git tar xz-utils ca-certificates gnupg lsb-release \
      python3 python3-pip python3-venv pipx openssh-client \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

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

# LXC client (standalone binary from Canonical)
RUN curl -fsSL -o /usr/local/bin/lxc \
      https://github.com/canonical/lxd/releases/download/lxd-5.21.4/bin.linux.lxc.x86_64 \
    && chmod +x /usr/local/bin/lxc

# Make sure jenkins user has right permissions if needed (LXD uses proxy socket, so rw volume is enough usually, or group id 1000)
# We might need to handle LXD_GROUP_REEXEC or just run as root depending on the socket permissions,
# but we'll try running as jenkins first, since the backend works that way with security_opt label=disable.

USER jenkins
