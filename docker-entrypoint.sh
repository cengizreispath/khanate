#!/bin/sh
set -e

DATA_DIR="${KHANATE_DATA_DIR:-/data}"

# Create directories if they don't exist
mkdir -p "$DATA_DIR/worlds" "$DATA_DIR/registry"

# Initialize default world if no worlds exist
if [ ! -d "$DATA_DIR/worlds/path" ] && [ -z "$(ls -A $DATA_DIR/worlds 2>/dev/null)" ]; then
    echo "Initializing default PATH world..."
    mkdir -p "$DATA_DIR/worlds/path/environments/project-division/projects"
    mkdir -p "$DATA_DIR/worlds/path/memory"
    
    cat > "$DATA_DIR/worlds/path/WORLD.md" << 'EOF'
---
type: world
id: path
name: PATH Technology
created: 2026-03-19
---

# 🌍 PATH World

## Kimlik

**Organizasyon:** PATH
**Tür:** Yazılım geliştirme şirketi
**Lokasyon:** Türkiye

## Ortak Bilinç

Bu world altındaki tüm agent'lar şunları bilir:

### Şirket Kültürü
- Kaliteli iş çıkarmak önceliktir
- Müşteri memnuniyeti önemli
- Temiz kod ve documentation şart
- Ekip çalışması esastır

### Teknik Standartlar
- Git flow kullanılır
- PR review zorunlu
- Test coverage önemli
EOF

    cat > "$DATA_DIR/worlds/path/environments/project-division/ENV.md" << 'EOF'
---
type: environment
id: project-division
name: Project Division
world: path
created: 2026-03-19
---

# Project Division

## Ekip
- PM'ler, geliştiriciler, tasarımcılar
- Shopify, Akinon, Custom projeler

## Araçlar
- ClickUp (proje yönetimi)
- GitHub/GitLab (kod)
- Coolify (deploy)
EOF

    echo "Default world initialized."
fi

# Initialize empty registry if not exists
if [ ! -f "$DATA_DIR/registry/agents.json" ]; then
    echo '{"agents": [], "history": []}' > "$DATA_DIR/registry/agents.json"
fi

# Start the application
exec "$@"
