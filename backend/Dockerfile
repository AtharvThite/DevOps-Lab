FROM node:20-bookworm-slim

# ── System packages needed by infra scripts ────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
      bash curl unzip git tar xz-utils ca-certificates gnupg lsb-release \
      python3 python3-pip pipx openssh-client \
      # LXD / LXC client
      snapd \
    && rm -rf /var/lib/apt/lists/*

# ── SonarScanner CLI ───────────────────────────────────────
RUN curl -fsSL -o /tmp/sonar-scanner.zip \
      https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-6.2.1.4610-linux-x64.zip \
    && unzip -q /tmp/sonar-scanner.zip -d /opt \
    && ln -sf /opt/sonar-scanner-6.2.1.4610-linux-x64/bin/sonar-scanner /usr/local/bin/sonar-scanner \
    && rm /tmp/sonar-scanner.zip

# ── Terraform ──────────────────────────────────────────────
RUN curl -fsSL https://releases.hashicorp.com/terraform/1.14.9/terraform_1.14.9_linux_amd64.zip \
      -o /tmp/terraform.zip \
    && unzip -q /tmp/terraform.zip -d /usr/local/bin \
    && chmod +x /usr/local/bin/terraform \
    && rm /tmp/terraform.zip

# ── Ansible ────────────────────────────────────────────────
RUN pipx install ansible-core && pipx ensurepath
ENV PATH="/root/.local/bin:${PATH}"

# ── LXC client (standalone binary from Canonical) ──────────
RUN curl -fsSL -o /usr/local/bin/lxc \
      https://github.com/canonical/lxd/releases/download/lxd-5.21.4/bin.linux.lxc.x86_64 \
    && chmod +x /usr/local/bin/lxc

WORKDIR /app

# Install Node dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application source
COPY src/ ./src/
COPY infra/ ./infra/

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "src/server.js"]
