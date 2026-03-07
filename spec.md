# Meteor Escape

## Current State
Yeni proje. Mevcut kod tabanı yok.

## Requested Changes (Diff)

### Add
- **Başlangıç Ekranı**: Oyuncu ismi girişi (localStorage ile kalıcı), kamera durumu göstergesi, en yüksek skor, oyun başlatma butonu
- **Oyun Ekranı**: Kamera arka planı (MediaPipe Pose CDN), Canvas üzerinde meteor spawn/hareket sistemi, HUD (can, skor, bölüm), oyuncu rozeti (kalkan + baş harf)
- **Bölüm Geçiş Ekranı**: Bölüm adı ve mevcut puan, "Hemen Başla" butonu, 3 saniyelik otomatik geçiş sayacı
- **Game Over Ekranı**: Final skor, en yüksek skor, bölüm bilgisi, yeniden başlat butonu
- **Meteor Sistemi**: 5-8 köşeli düzensiz poligon, radyal gradient 3D efekt, çatlak dokusu, speküler parıltı, 5 renk seti (turuncu-kırmızı tonları), dönme animasyonu
- **Çarpışma Tespiti**: MediaPipe Pose ile göğüs/karın bölgesi hesaplama, 40px yarıçaplı daire hitbox, daire-daire çarpışma formülü, 1.5s invincibility
- **Can Sistemi**: 3 can, meteor çarpmasında -1, 0'da game over
- **10 Bölüm Sistemi**:
  - Bölüm 1: 0 puan, 2200ms spawn, 2-3.5 hız, maks 3
  - Bölüm 2: 200 puan, 1900ms spawn, 2.5-4.5 hız, maks 4
  - Bölüm 3: 500 puan, 1600ms spawn, 3-5.5 hız, maks 5
  - Bölüm 4: 900 puan, 1400ms spawn, 3.5-6.5 hız, maks 6
  - Bölüm 5: 1400 puan, 1200ms spawn, 4-7.5 hız, maks 7
  - Bölüm 6: 2000 puan, 1000ms spawn, 5-9 hız, maks 8
  - Bölüm 7: 2800 puan, 800ms spawn, 6-11 hız, maks 10
  - Bölüm 8: 3700 puan, 650ms spawn, 7-13 hız, maks 12
  - Bölüm 9: 4500 puan, 500ms spawn, 8-15 hız, maks 14
  - Bölüm 10: 5400 puan, 350ms spawn, 9-16 hız, maks 16
- **Puan Sistemi**: Her başarılı meteor geçişi +10 puan
- **Ses Sistemi (Web Audio API)**:
  - Arka plan: 140 BPM chiptune döngüsü (kare dalga melodi, üçgen dalga bas, kick, hi-hat)
  - Meteor çarpma: beyaz gürültü + düşük frekans + metalik klik
  - Meteor geçme: yüksekten alçağa frekans sweep (whoosh)
  - Bölüm geçiş: pentatonic minör artan arpej
  - Game over: inen sawtooth tonları + derin rumble
- **localStorage**: `meteorescape_playername`, `meteorescape_highscore`
- **Kamera izni reddedilirse**: Hata mesajı + "Retry Camera" butonu
- **MediaPipe smoothing**: Jitter azaltmak için pozisyon yumuşatma
- **Mobil canvas ölçekleme**: Tam ekran, mobil çözünürlük uyumlu

### Modify
- Yok (yeni proje)

### Remove
- Yok (yeni proje)

## Implementation Plan

1. **Bileşen seçimi**: `camera` bileşeni eklenir (kamera erişimi için)
2. **Backend**: Minimal Motoko backend (anonim, veri saklamaz -- tüm veri localStorage'da)
3. **Frontend yapısı**:
   - `App.tsx`: 4 ekran arasında state yönetimi (`start | game | levelup | gameover`)
   - `StartScreen.tsx`: İsim girişi, highscore, kamera durumu
   - `GameScreen.tsx`: Kamera feed + Canvas oyun döngüsü + MediaPipe entegrasyonu
   - `LevelUpScreen.tsx`: Bölüm geçiş ekranı, 3s sayaç
   - `GameOverScreen.tsx`: Final bilgileri
   - `MeteorCanvas.tsx`: Canvas üzerinde meteor render + oyuncu rozeti
   - `AudioEngine.ts`: Web Audio API ses motoru
   - `gameEngine.ts`: Oyun mantığı (bölümler, meteor spawn, çarpışma, can)
   - `mediapipe.ts`: MediaPipe Pose entegrasyonu + smoothing
4. **MediaPipe**: CDN üzerinden `@mediapipe/pose` yüklenir (script tag ile)
5. **Test & Deploy**
