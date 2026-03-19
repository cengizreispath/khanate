# Parallel Mode - Eşzamanlı Çalıştırma

## Konsept

Parallel mode'da birden fazla agent aynı anda çalışır:

```
         ┌─ Analyst (docs)
Orchestrator ├─ Developer (setup)  → Sonuçları birleştir
         └─ Reviewer (checklist)
```

## Ne Zaman Kullanılır

- Bağımsız işler
- Zaman kazanmak için paralel çalışma
- Farklı perspektifler alma

## Kullanım

### 1. Tüm Görevleri Gönder (Fire-and-Forget)
```python
# Analyst'a
sessions_send(
  sessionKey="...analyst...",
  message="TASK: README hazırla\nCALLBACK: [orchestrator_key]",
  timeoutSeconds=0
)

# Developer'a
sessions_send(
  sessionKey="...developer...",
  message="TASK: Boilerplate oluştur\nCALLBACK: [orchestrator_key]",
  timeoutSeconds=0
)

# Reviewer'a
sessions_send(
  sessionKey="...reviewer...",
  message="TASK: Checklist hazırla\nCALLBACK: [orchestrator_key]",
  timeoutSeconds=0
)
```

### 2. Callback'leri Topla
Her agent bitirince callback gönderir:
```
DONE: README hazır
RESULT: ...
STATUS: success
```

### 3. Sonuçları Birleştir
Orchestrator tüm callback'leri alınca:
- Sonuçları birleştirir
- Çakışma varsa çözer
- Final rapor oluşturur

## State Yönetimi

Orchestrator parallel işleri takip eder:

```json
{
  "parallel_id": "uuid",
  "total_tasks": 3,
  "completed": 2,
  "pending": ["reviewer"],
  "results": {
    "analyst": { "status": "success", "result": "..." },
    "developer": { "status": "success", "result": "..." }
  }
}
```

## Örnek: Proje Setup

### Görev
"Yeni proje için başlangıç dosyalarını hazırla"

### Parallel Dağılım
| Agent | Görev | Bağımsız? |
|-------|-------|-----------|
| Analyst | README.md, requirements.md | ✅ |
| Developer | package.json, tsconfig, scaffold | ✅ |
| Reviewer | PR template, checklist | ✅ |

### Orchestrator Akışı
```
1. Görevi analiz et → 3 bağımsız parça
2. 3 sessions_send (timeoutSeconds=0)
3. Callback'leri bekle
4. Hepsi tamamlanınca → birleştir, raporla
```

## Dikkat Edilmesi Gerekenler

### ✅ Yapılmalı
- İşlerin gerçekten bağımsız olduğundan emin ol
- Her göreve unique identifier ver
- Timeout mekanizması kur (örn: 5 dk içinde gelmezse hatırlat)

### ❌ Yapılmamalı
- Bağımlı işleri parallel yapma
- Aynı dosyayı birden fazla agent'a yazdırma
- Callback'siz parallel başlatma

## Pipeline vs Parallel Karar Ağacı

```
Görev geldi
    │
    ▼
İşler bağımlı mı?
    │
    ├─ EVET → Pipeline Mode (A→B→C)
    │
    └─ HAYIR → Parallel Mode (A+B+C)
```

## Hata Yönetimi

Bir agent fail ederse:
1. Diğerleri devam etsin
2. Fail olan notu al
3. Sonuçta belirt: "3/3 tamamlandı" veya "2/3 tamamlandı, reviewer failed"
4. Gerekirse retry veya skip
