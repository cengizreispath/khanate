# Khanate Memory System Design

## Hiyerarşi

```
World (PATH)
│   └── WORLD.md          → Şirket kültürü, genel standartlar
│   └── memory/           → World-level memories
│
└── Environment (Project Division)
    │   └── ENV.md        → Departman bilgisi, süreçler
    │   └── memory/       → Env-level memories
    │
    └── Project (Edenred)
        │   └── PROJECT.md    → Proje detayları, tech stack
        │   └── memory/       → Proje memories
        │
        └── Agent (Backend Dev)
                └── AGENT.md      → Agent soul, role
                └── memory/       → Agent's own memories
```

## Memory Inheritance

Agent context oluşturulurken:

```
Final Context = 
    WORLD.md (en genel)
  + ENV.md (departman)
  + PROJECT.md (proje özel)
  + AGENT.md (rol özel)
  + Recent memories (son N gün)
  + Current task
```

## Dosya Formatları

### WORLD.md
```yaml
---
type: world
name: PATH
created: 2026-03-19
---

# World: PATH

## Kimlik
- Organizasyon tipi
- Lokasyon
- Kültür

## Standartlar
- Teknik standartlar
- İletişim kuralları
- Araçlar
```

### ENV.md
```yaml
---
type: environment
name: Project Division
world: path
created: 2026-03-19
---

# Environment: Project Division

## Ekip
- Yapı
- Roller

## Süreçler
- İş akışları
- Araçlar
```

### PROJECT.md
```yaml
---
type: project
name: Edenred
environment: project-division
world: path
created: 2026-03-19
status: active
---

# Project: Edenred

## Özet
- Müşteri
- Kapsam

## Tech Stack
- Backend
- Frontend
- Entegrasyonlar

## Önemli Notlar
- Kontakt kişiler
- Özel durumlar
```

### AGENT.md
```yaml
---
type: agent
name: Backend Developer
project: edenred
model: claude-sonnet-4-5
skills:
  - code-writing
  - git-operations
  - drupal-dev
---

# Agent: Backend Developer

## Soul
Sen Edenred projesinin backend developer'ısın...

## Görevler
- Kod yazma
- PR açma
- Bug fix

## Kısıtlamalar
- Deploy öncesi review şart
- Test coverage min 70%
```

## Memory Files

Her seviyede `memory/` klasörü:

```
memory/
├── 2026-03-19.md    → Günlük notlar
├── 2026-03-18.md
├── decisions.md     → Önemli kararlar
├── lessons.md       → Öğrenilen dersler
└── context.json     → Structured data
```

## Context Builder Algorithm

```python
def build_agent_context(agent_path):
    context = []
    
    # 1. World memory
    world = get_world(agent_path)
    context.append(read_file(world / "WORLD.md"))
    context.append(read_recent_memories(world / "memory"))
    
    # 2. Environment memory
    env = get_environment(agent_path)
    context.append(read_file(env / "ENV.md"))
    context.append(read_recent_memories(env / "memory"))
    
    # 3. Project memory
    project = get_project(agent_path)
    context.append(read_file(project / "PROJECT.md"))
    context.append(read_recent_memories(project / "memory"))
    
    # 4. Agent memory
    context.append(read_file(agent_path / "AGENT.md"))
    context.append(read_recent_memories(agent_path / "memory"))
    
    return "\n---\n".join(context)
```

## API Endpoints (Dashboard için)

```
GET  /api/worlds                    → List worlds
POST /api/worlds                    → Create world
GET  /api/worlds/:id                → Get world details
PUT  /api/worlds/:id                → Update world

GET  /api/worlds/:id/environments   → List envs
POST /api/worlds/:id/environments   → Create env
...

GET  /api/projects/:id/agents       → List agents
POST /api/projects/:id/agents       → Create agent
POST /api/agents/:id/spawn          → Start agent
POST /api/agents/:id/stop           → Stop agent
GET  /api/agents/:id/status         → Agent status
POST /api/agents/:id/message        → Send message to agent
```

## Kısıtlamalar

1. **Isolation:** Farklı project'lerin memory'leri birbirine karışmaz
2. **Inherit only up:** Sadece üst seviyelerden inherit, cross-project yok
3. **Immutable history:** Geçmiş memory'ler değiştirilemez
4. **Size limit:** Her memory dosyası max 50KB
