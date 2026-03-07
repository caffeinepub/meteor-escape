# Meteor Escape

## Current State
- 10 bölümlü oyun, her bölümde meteor spawn hızı ve sayısı artar
- Oyuncu 3 can ile başlar, meteorlara çarpınca can kaybeder
- Can hiç sıfırlanmaz -- bölüm geçişinde mevcut can korunur
- Sadece meteorlar düşer, başka nesneler yok
- Puan sadece meteor geçişlerinden gelir (+10 her meteor)
- Çarpışma sonrası 1.5s invincibility uygulanır

## Requested Changes (Diff)

### Add
- **Power-up sistemi**: Meteorların yanı sıra iki tip power-up düşer
  - Kalp (HeartPowerUp): Kırmızı kalp, alınca +1 can (max 3), 28px yarıçap
  - Coin (CoinPowerUp): Altın sarısı yuvarlak, alınca +25 puan, 22px yarıçap
- **Power-up spawn**: Bölüm zorluk seviyesine göre seyrekleşen aralıklar
  - Bölüm 1-3: 8000-10000ms arası rastgele
  - Bölüm 4-6: 12000-15000ms arası rastgele
  - Bölüm 7-9: 18000-22000ms arası rastgele
  - Bölüm 10: 28000-35000ms arası rastgele
  - %40 kalp, %60 coin olasılığı
- **Power-up çarpışma**: Oyuncu power-up ile temas edince alır (hitbox = player hitbox + power-up radius)
- **Power-up görseli (canvas)**: Kalp canvas'ta kırmızı gradient ile çizilir; Coin altın sarısı parlak daire
- **Puan popup'ı**: Coin alındığında "+25 BONUS" şeklinde popup gösterilir
- **Can popup'ı**: Kalp alındığında "+1 ♥" şeklinde popup gösterilir

### Modify
- **Her bölüm başında canlar 3'e sıfırlanır**: `handleLevelUpContinue` içinde `livesRef.current = MAX_LIVES` ve `setLives(MAX_LIVES)` eklenir
- **types.ts**: `PowerUp` interface eklenir
- **meteorUtils.ts**: `createPowerUp`, `drawPowerUp`, `checkPowerUpCollision` fonksiyonları eklenir
- **GameScreen.tsx**: Power-up spawn timer, güncelleme döngüsü, çarpışma tespiti, ve render eklenir
- **ScorePopup interface**: `value` ve `type` ("score"|"heart"|"coin") alanı eklenir, farklı renk/metin göstermek için

### Remove
- Mevcut `ScorePopup` interface içinde sadece `id, x, y, timestamp` vardı -- `value` ve `type` alanı ekleniyor (destructive değil)

## Implementation Plan
1. `types.ts` -- `PowerUp` interface ekle (id, x, y, vy, radius, type: "heart"|"coin", rotation)
2. `constants.ts` -- `POWERUP_BONUS_SCORE = 25`, `POWERUP_HEART_CHANCE = 0.4`, bölüm bazlı spawn aralığı hesaplama fonksiyonu `getPowerUpSpawnInterval(level)` ekle
3. `meteorUtils.ts` -- `createPowerUp`, `updatePowerUp`, `isPowerUpOffScreen`, `checkPowerUpCollision`, `drawPowerUp` fonksiyonları ekle
4. `GameScreen.tsx`:
   - `powersUpsRef` state/ref ekle
   - Power-up spawn timer sistemi ekle (`schedulePowerUpSpawn`)
   - Game loop içinde power-up güncelleme, collision ve render ekle
   - `handleLevelUpContinue` içinde canları 3'e sıfırla
   - Popup sistemini can ve coin için genişlet
