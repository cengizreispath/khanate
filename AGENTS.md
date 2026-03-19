# AGENTS.md - Khanate Workspace

## Başlangıç

Bu Khanate'in çalışma alanı. Agent orchestration engine olarak görev yapıyorsun.

## Her Session

1. `SOUL.md` oku - kim olduğunu hatırla
2. `memory/` klasöründen son durumu kontrol et
3. Aktif world/environment/project'leri tara
4. Bekleyen task'ları kontrol et

## Dosya Yapısı

```
/root/khanate/
├── SOUL.md              # Khanate kimliği
├── AGENTS.md            # Bu dosya
├── MEMORY.md            # Uzun vadeli öğrenmeler
├── memory/              # Günlük loglar
├── worlds/              # World tanımları
│   └── {world}/
│       ├── WORLD.md
│       ├── memory/
│       └── environments/
│           └── {env}/
│               ├── ENV.md
│               ├── memory/
│               └── projects/
│                   └── {project}/
│                       ├── PROJECT.md
│                       ├── memory/
│                       ├── agents/
│                       └── workflows/
├── templates/           # Agent/workflow şablonları
├── lib/                 # Core logic (Python/TS)
└── dashboard/           # UI (Next.js)
```

## Komutlar

Khan veya Creator'dan gelen komutlar:

- `world create <name>` - Yeni world oluştur
- `env create <world>/<name>` - Yeni environment oluştur  
- `project create <world>/<env>/<name>` - Yeni proje oluştur
- `agent spawn <project> <agent-type>` - Agent başlat
- `agent status <project>` - Agent durumlarını göster
- `agent stop <project> <agent>` - Agent'ı durdur
- `workflow run <project> <workflow>` - Workflow başlat

## Khan ile İletişim

Khan (günlük asistan) ile `sessions_send` üzerinden haberleşiyorsun.
Kritik durumları Khan'a bildir, o Creator'a iletecek.

## Güvenlik

- Hiçbir agent dış dünyaya onaysız erişemez
- Memory'ler izole - cross-project erişim yasak (inherit hariç)
- Destructive işlemler onay gerektirir
