# Pipeline Mode - Asenkron İletişim

## Konsept

Pipeline mode'da işler sıralı ama **asenkron** çalışır:

```
Orchestrator → Analyst → (callback) → Orchestrator → Developer → (callback) → Done
```

Her agent işini bitirince orchestrator'a `sessions_send` ile bildirim yapar.

## Akış

### 1. Orchestrator Görevi Gönderir
```
sessions_send(
  sessionKey="...analyst...",
  message="TASK: [görev açıklaması]\n\nCALLBACK: [orchestrator_session_key]",
  timeoutSeconds=0  // Fire-and-forget, bekleme
)
```

### 2. Agent Görevi Alır ve Çalışır
Agent mesajda `CALLBACK:` satırını görür ve çalışmaya başlar.

### 3. Agent İşi Bitirince Bildirir
```
sessions_send(
  sessionKey="[callback_session_key]",
  message="DONE: [görev özeti]\n\nRESULT:\n[sonuç]",
  timeoutSeconds=0
)
```

### 4. Orchestrator Sonucu Alır
Orchestrator callback mesajını alır ve:
- Pipeline'daki sonraki adıma geçer
- Veya tüm pipeline tamamlandıysa rapor verir

## Mesaj Formatı

### Görev Mesajı (Orchestrator → Agent)
```
TASK: [Görev açıklaması]

CONTEXT:
[Önceki adımların çıktıları varsa]

CALLBACK: [orchestrator_session_key]
```

### Sonuç Mesajı (Agent → Orchestrator)
```
DONE: [Kısa özet]

RESULT:
[Detaylı sonuç]

STATUS: success | partial | failed
```

## Pipeline State

Orchestrator pipeline durumunu takip eder:

```json
{
  "pipeline_id": "uuid",
  "steps": [
    {"agent": "analyst", "status": "completed", "result": "..."},
    {"agent": "developer", "status": "in_progress"},
    {"agent": "reviewer", "status": "pending"}
  ],
  "current_step": 1
}
```

## Örnek: Feature Development Pipeline

### Adım 1: Orchestrator → Analyst
```
TASK: Login feature için requirements hazırla.
- User stories
- Acceptance criteria
- Edge cases

CALLBACK: agent:main:khanate:...:orchestrator:5a08dbf5
```

### Adım 2: Analyst → Orchestrator (callback)
```
DONE: Login requirements hazır

RESULT:
## User Stories
- US-001: Kullanıcı email/şifre ile giriş yapabilir
...

STATUS: success
```

### Adım 3: Orchestrator → Developer
```
TASK: Aşağıdaki requirements'a göre login feature'ı kodla.

CONTEXT:
[Analyst'ın çıktısı]

CALLBACK: agent:main:khanate:...:orchestrator:5a08dbf5
```

### Adım 4: Developer → Orchestrator (callback)
```
DONE: Login feature kodlandı

RESULT:
## Files
- src/app/login/page.tsx
- src/lib/auth.ts
...

STATUS: success
```

## Agent AGENT.md Güncellemesi

Her agent'ın AGENT.md'sine eklenecek:

```markdown
## Callback Protokolü

Görev mesajında `CALLBACK:` satırı varsa:
1. Görevi tamamla
2. Sonucu `sessions_send` ile callback adresine gönder
3. Format: DONE/RESULT/STATUS
```

## Avantajlar

1. **Asenkron** - Timeout yok, agent istediği kadar çalışır
2. **Takip edilebilir** - Her adım loglanır
3. **Esnek** - Pipeline dinamik olarak değiştirilebilir
4. **Hata toleranslı** - Bir adım fail olursa orchestrator handle eder
