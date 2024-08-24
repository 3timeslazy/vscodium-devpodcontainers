FROM docker.io/fedora:40

RUN sudo dnf update -y && sudo dnf install -y curl git which zsh pnpm nodejs22

RUN useradd -m -s /bin/zsh dev

USER dev
