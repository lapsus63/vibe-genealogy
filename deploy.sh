#!/usr/bin/env bash
set -eo pipefail

# Racine du projet = emplacement de ce script (appelable depuis n'importe où).
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
BACKEND_DIR="${PROJECT_ROOT}/backend"

ENV_FILE=${PROJECT_ROOT}/deploy.env
source "${ENV_FILE}"

info()  { printf '→ %s\n' "$*"; }
warn()  { printf '⚠ %s\n' "$*" >&2; }
error() { printf '✗ %s\n' "$*" >&2; exit 1; }

confirm() {
  local prompt=$1
  local reply
  read -r -p "${prompt} [o/N] " reply
  [[ "${reply}" =~ ^[oOyY]$ ]]
}

docker_compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
  else
    return 1
  fi
}

find_backend_jar() {
  local jar
  jar="$(find "${BACKEND_DIR}/target" -maxdepth 1 -type f -name '*.jar' ! -name '*-original.jar' -print -quit)"
  [[ -n "${jar}" ]] || return 1
  printf '%s' "${jar}"
}

resolve_compose_dir() {
  if [[ -f "${COMPOSE_DIR}/docker-compose.yml" || -f "${COMPOSE_DIR}/docker-compose.yaml" ]]; then
    printf '%s' "${COMPOSE_DIR}"
    return 0
  fi

  local parent
  parent="$(dirname "${COMPOSE_DIR}")"
  if [[ -f "${parent}/docker-compose.yml" || -f "${parent}/docker-compose.yaml" ]]; then
    printf '%s' "${parent}"
    return 0
  fi

  return 1
}

info "Projet : ${PROJECT_ROOT}"
info "Cible  : ${TARGET_DIR}"

info "Build frontend (production)…"
(
  cd "${FRONTEND_DIR}"
  bun run build
)

[[ -d "${FRONTEND_DIR}/dist" ]] || error "Build frontend échoué : ${FRONTEND_DIR}/dist introuvable."

info "Build backend…"
mvn -f "${BACKEND_DIR}/pom.xml" clean install

BACKEND_JAR="$(find_backend_jar)" || error "Build backend échoué : aucun JAR trouvé dans ${BACKEND_DIR}/target."

if [[ -z "$RESTART_DOCKER" ]]; then
  RESTART_DOCKER=false
  if confirm "Redémarrer les containers docker-compose ?"; then
    RESTART_DOCKER=true
  fi
fi


info "Déploiement vers ${TARGET_DIR}…"
mkdir -p "${TARGET_DIR}/dist" "${TARGET_DIR}/data"

info "  Front → ${TARGET_DIR}/dist/"
rsync -a --delete "${FRONTEND_DIR}/dist/" "${TARGET_DIR}/dist/"

info "  Back  → ${TARGET_DIR}/vibe-genealogy-backend.jar"
cp "${BACKEND_JAR}" "${TARGET_DIR}/vibe-genealogy-backend.jar"

if [[ "${RESTART_DOCKER}" == true ]]; then
  COMPOSE_DIR="$(resolve_compose_dir)" || error "docker-compose introuvable dans ${TARGET_DIR} ni dans $(dirname "${TARGET_DIR}")."
  COMPOSE="$(docker_compose_cmd)" || error "docker compose / docker-compose introuvable."

  info "Redémarrage des containers (${COMPOSE_DIR})…"
  (
    cd "${COMPOSE_DIR}"
    ${COMPOSE} down
    ${COMPOSE} up -d
  )
else
  info "Docker : pas de redémarrage."
fi

info "Déploiement terminé."
