# Direct Mode - Tek Agent İletişim

## Konsept

Direct mode'da orchestrator tek bir agent ile doğrudan konuşur:

```
Orchestrator ↔ Agent (soru-cevap)
```

Pipeline'dan farkı: Callback beklenmez, senkron yanıt alınır.

## Ne Zaman Kullanılır

- Hızlı soru-cevap
- Belirsizlik giderme
- Feedback döngüsü
- Basit tek adımlık işler

## Kullanım

### Senkron Soru (Cevap Bekle)
```
sessions_send(
  sessionKey="...agent...",
  message="SORU: Bu requirement net mi?",
  timeoutSeconds=60  // Cevap bekle
)
```

### Response
```json
{
  "status": "ok",
  "reply": "Evet, net. Şu noktalar..."
}
```

## Pipeline vs Direct Karşılaştırma

| Özellik | Pipeline | Direct |
|---------|----------|--------|
| timeoutSeconds | 0 (fire-forget) | >0 (bekle) |
| Callback gerekli | Evet | Hayır |
| Kullanım | Uzun işler | Kısa sorular |
| Asenkron | Evet | Hayır |

## Örnek Senaryolar

### 1. Hızlı Soru
```
Orchestrator → Analyst:
  "Eforlandırma tablosunda frontend toplam kaç MD?"

Analyst → (senkron cevap):
  "Frontend toplam 28 MD"
```

### 2. Onay Alma
```
Orchestrator → Developer:
  "Bu API tasarımı uygun mu?"

Developer → (senkron cevap):
  "Evet, uygun. Sadece pagination ekleyelim."
```

### 3. Belirsizlik Giderme
```
Orchestrator → Analyst:
  "Migration projesi mi, sıfırdan mı? Brief'te net değil."

Analyst → (senkron cevap):
  "Migration - mevcut Drupal siteden veri taşınacak."
```

## Orchestrator Kullanımı

Direct mode kullanmak için Orchestrator:

```python
# Soru sor ve cevap bekle
response = sessions_send(
  sessionKey="...analyst...",
  message="Toplam sayfa sayısı kaç?",
  timeoutSeconds=30
)

if response.status == "ok":
    answer = response.reply
    # Cevapla devam et
else:
    # Timeout - farklı strateji dene
```

## Timeout Durumunda

Timeout olursa:
1. Agent meşgul olabilir - daha sonra tekrar dene
2. Pipeline mode'a geç - callback ile devam et
3. Farklı agent dene
