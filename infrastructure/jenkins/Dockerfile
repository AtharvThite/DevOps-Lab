FROM jenkins/jenkins:lts-jdk17

USER root

# Install system dependencies, Node.js, Podman, and uidmap
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl unzip git tar xz-utils ca-certificates gnupg lsb-release \
      python3 python3-pip python3-venv pipx openssh-client podman uidmap \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Configure subuid and subgid for the jenkins user
RUN echo "jenkins:100000:65536" >> /etc/subuid && \
    echo "jenkins:100000:65536" >> /etc/subgid

# --- NEW: Configure Podman Storage ---
# Use VFS driver and ignore chown errors for nested rootless builds
RUN mkdir -p /etc/containers /var/lib/containers/storage /run/containers/storage && \
    printf '[storage]\ndriver = "vfs"\nrunroot = "/run/containers/storage"\ngraphroot = "/var/lib/containers/storage"\n\n[storage.options.vfs]\nignore_chown_errors = "true"\n' > /etc/containers/storage.conf

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