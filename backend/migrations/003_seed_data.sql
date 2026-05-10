-- Seed: Turkish Food Catalog + Workout Templates
BEGIN;

-- ═══ ÇORBALAR ═══
INSERT INTO food_catalog (name, category, calories, protein, carbs, fats, serving_size) VALUES
('Mercimek Çorbası', 'Çorbalar', 150, 9, 22, 3, '1 kase'),
('Ezogelin Çorbası', 'Çorbalar', 130, 7, 20, 2.5, '1 kase'),
('Domates Çorbası', 'Çorbalar', 90, 2, 14, 3, '1 kase'),
('Tarhana Çorbası', 'Çorbalar', 120, 5, 18, 3, '1 kase'),
('Yayla Çorbası', 'Çorbalar', 140, 5, 12, 8, '1 kase'),
('İşkembe Çorbası', 'Çorbalar', 180, 15, 8, 10, '1 kase'),
('Tavuk Suyu Çorbası', 'Çorbalar', 80, 6, 8, 2, '1 kase'),
('Sebze Çorbası', 'Çorbalar', 95, 3, 15, 2.5, '1 kase');

-- ═══ ET YEMEKLERİ ═══
INSERT INTO food_catalog (name, category, calories, protein, carbs, fats, serving_size) VALUES
('Döner (Tavuk)', 'Et Yemekleri', 350, 28, 25, 15, '1 porsiyon'),
('Döner (Et)', 'Et Yemekleri', 450, 30, 25, 25, '1 porsiyon'),
('Adana Kebap', 'Et Yemekleri', 400, 25, 5, 32, '2 şiş'),
('Urfa Kebap', 'Et Yemekleri', 380, 24, 5, 30, '2 şiş'),
('İskender', 'Et Yemekleri', 650, 35, 45, 35, '1 porsiyon'),
('Köfte (Izgara)', 'Et Yemekleri', 280, 22, 8, 18, '4 adet'),
('Lahmacun', 'Et Yemekleri', 210, 10, 28, 7, '1 adet'),
('Pide (Kıymalı)', 'Et Yemekleri', 380, 18, 40, 16, '1 dilim'),
('Pide (Kaşarlı)', 'Et Yemekleri', 350, 14, 38, 15, '1 dilim'),
('Tantuni', 'Et Yemekleri', 320, 22, 25, 14, '1 dürüm'),
('Çiğ Köfte (Vegan)', 'Et Yemekleri', 180, 5, 32, 4, '1 porsiyon'),
('Kuzu Tandır', 'Et Yemekleri', 480, 35, 10, 34, '1 porsiyon'),
('Tavuk Göğsü (Izgara)', 'Et Yemekleri', 165, 31, 0, 3.6, '100g'),
('Biftek', 'Et Yemekleri', 270, 26, 0, 18, '150g'),
('Balık (Levrek Izgara)', 'Et Yemekleri', 200, 30, 0, 8, '1 porsiyon');

-- ═══ SEBZE YEMEKLERİ ═══
INSERT INTO food_catalog (name, category, calories, protein, carbs, fats, serving_size) VALUES
('Kuru Fasulye', 'Sebze Yemekleri', 280, 16, 42, 5, '1 porsiyon'),
('Nohut Yemeği', 'Sebze Yemekleri', 260, 14, 38, 6, '1 porsiyon'),
('Türlü', 'Sebze Yemekleri', 180, 4, 22, 8, '1 porsiyon'),
('İmam Bayıldı', 'Sebze Yemekleri', 200, 3, 18, 14, '1 porsiyon'),
('Karnıyarık', 'Sebze Yemekleri', 300, 14, 20, 18, '1 porsiyon'),
('Zeytinyağlı Yaprak Sarma', 'Sebze Yemekleri', 220, 3, 28, 10, '8 adet'),
('Bamya', 'Sebze Yemekleri', 160, 5, 18, 7, '1 porsiyon'),
('Pırasa Yemeği', 'Sebze Yemekleri', 150, 4, 16, 8, '1 porsiyon'),
('Ispanak Yemeği', 'Sebze Yemekleri', 140, 6, 10, 8, '1 porsiyon'),
('Kabak Mücver', 'Sebze Yemekleri', 250, 8, 20, 15, '4 adet'),
('Menemen', 'Sebze Yemekleri', 220, 12, 10, 15, '1 porsiyon'),
('Patlıcan Musakka', 'Sebze Yemekleri', 320, 15, 18, 22, '1 porsiyon');

-- ═══ PİLAV & MAKARNA ═══
INSERT INTO food_catalog (name, category, calories, protein, carbs, fats, serving_size) VALUES
('Pirinç Pilavı', 'Pilav & Makarna', 220, 4, 45, 3, '1 porsiyon'),
('Bulgur Pilavı', 'Pilav & Makarna', 200, 6, 40, 2, '1 porsiyon'),
('Makarna (Soslu)', 'Pilav & Makarna', 350, 12, 55, 8, '1 porsiyon'),
('Mantı', 'Pilav & Makarna', 400, 16, 45, 16, '1 porsiyon'),
('Noodle', 'Pilav & Makarna', 280, 8, 48, 5, '1 porsiyon'),
('Kuskus', 'Pilav & Makarna', 190, 6, 36, 2, '1 porsiyon');

-- ═══ KAHVALTILIK ═══
INSERT INTO food_catalog (name, category, calories, protein, carbs, fats, serving_size) VALUES
('Yumurta (Haşlanmış)', 'Kahvaltılık', 78, 6, 0.6, 5, '1 adet'),
('Yumurta (Sahanda)', 'Kahvaltılık', 120, 6, 0.6, 10, '1 adet'),
('Beyaz Peynir', 'Kahvaltılık', 85, 6, 1, 6, '30g'),
('Kaşar Peynir', 'Kahvaltılık', 110, 7, 0.5, 9, '30g'),
('Zeytin (Yeşil)', 'Kahvaltılık', 45, 0.3, 1, 4.5, '10 adet'),
('Zeytin (Siyah)', 'Kahvaltılık', 55, 0.4, 2, 5, '10 adet'),
('Bal', 'Kahvaltılık', 65, 0, 17, 0, '1 yemek kaşığı'),
('Tereyağı', 'Kahvaltılık', 72, 0, 0, 8, '10g'),
('Simit', 'Kahvaltılık', 280, 8, 50, 5, '1 adet'),
('Poğaça', 'Kahvaltılık', 320, 6, 35, 18, '1 adet'),
('Börek (Peynirli)', 'Kahvaltılık', 350, 12, 30, 20, '1 dilim'),
('Açma', 'Kahvaltılık', 290, 6, 38, 13, '1 adet'),
('Sucuklu Yumurta', 'Kahvaltılık', 350, 20, 2, 28, '1 porsiyon'),
('Granola', 'Kahvaltılık', 200, 5, 30, 7, '50g'),
('Yulaf Ezmesi', 'Kahvaltılık', 150, 5, 27, 3, '40g');

-- ═══ İÇECEKLER ═══
INSERT INTO food_catalog (name, category, calories, protein, carbs, fats, serving_size) VALUES
('Çay (Şekersiz)', 'İçecekler', 2, 0, 0, 0, '1 bardak'),
('Türk Kahvesi', 'İçecekler', 10, 0.3, 1.5, 0.2, '1 fincan'),
('Ayran', 'İçecekler', 65, 3, 4, 3.5, '1 bardak'),
('Şalgam Suyu', 'İçecekler', 20, 0.5, 4, 0, '1 bardak'),
('Portakal Suyu (Taze)', 'İçecekler', 110, 1.5, 26, 0.5, '1 bardak'),
('Süt (Tam Yağlı)', 'İçecekler', 150, 8, 12, 8, '1 bardak'),
('Süt (Yari Yağlı)', 'İçecekler', 100, 8, 12, 2.5, '1 bardak'),
('Protein Shake', 'İçecekler', 200, 30, 10, 4, '1 scoop + süt'),
('Smoothie (Meyve)', 'İçecekler', 180, 3, 38, 2, '1 bardak');

-- ═══ ATIŞTIIRMALIK ═══
INSERT INTO food_catalog (name, category, calories, protein, carbs, fats, serving_size) VALUES
('Muz', 'Atıştırmalık', 105, 1.3, 27, 0.4, '1 adet'),
('Elma', 'Atıştırmalık', 72, 0.4, 19, 0.2, '1 adet'),
('Portakal', 'Atıştırmalık', 62, 1.2, 15, 0.2, '1 adet'),
('Karpuz', 'Atıştırmalık', 85, 1.7, 21, 0.4, '2 dilim'),
('Badem', 'Atıştırmalık', 165, 6, 6, 14, '30g'),
('Ceviz', 'Atıştırmalık', 185, 4, 4, 18, '30g'),
('Fındık', 'Atıştırmalık', 180, 4, 5, 17, '30g'),
('Kuru Kayısı', 'Atıştırmalık', 80, 1, 20, 0.1, '5 adet'),
('Hurma', 'Atıştırmalık', 70, 0.5, 18, 0, '2 adet'),
('Yoğurt (Tam Yağlı)', 'Atıştırmalık', 150, 8, 12, 8, '200g'),
('Yoğurt (Light)', 'Atıştırmalık', 80, 8, 12, 0.5, '200g'),
('Çikolata (Bitter)', 'Atıştırmalık', 170, 2, 13, 12, '30g'),
('Protein Bar', 'Atıştırmalık', 220, 20, 22, 8, '1 adet');

-- ═══ FAST FOOD ═══
INSERT INTO food_catalog (name, category, calories, protein, carbs, fats, serving_size) VALUES
('Hamburger', 'Fast Food', 550, 28, 40, 30, '1 adet'),
('Cheeseburger', 'Fast Food', 620, 32, 42, 34, '1 adet'),
('Pizza (1 Dilim)', 'Fast Food', 285, 12, 36, 10, '1 dilim'),
('Patates Kızartması', 'Fast Food', 320, 4, 40, 16, '1 porsiyon'),
('Nugget (6 adet)', 'Fast Food', 280, 14, 18, 16, '6 adet'),
('Dürüm (Tavuk)', 'Fast Food', 380, 24, 35, 15, '1 adet'),
('Tost (Kaşarlı)', 'Fast Food', 300, 12, 30, 14, '1 adet'),
('Waffle', 'Fast Food', 380, 6, 48, 18, '1 adet');

-- ═══ TATLILAR ═══
INSERT INTO food_catalog (name, category, calories, protein, carbs, fats, serving_size) VALUES
('Baklava', 'Tatlılar', 350, 6, 40, 20, '2 dilim'),
('Künefe', 'Tatlılar', 450, 10, 50, 24, '1 porsiyon'),
('Sütlaç', 'Tatlılar', 220, 6, 38, 5, '1 kase'),
('Kazandibi', 'Tatlılar', 230, 5, 40, 6, '1 porsiyon'),
('Revani', 'Tatlılar', 300, 4, 50, 10, '1 dilim'),
('Profiterol', 'Tatlılar', 380, 6, 42, 22, '1 porsiyon'),
('Dondurma', 'Tatlılar', 200, 3, 24, 10, '2 top');

-- ═══ ANTRENMAN ŞABLONLARI ═══
INSERT INTO workout_templates (name, category, description, exercises, estimated_duration, estimated_calories) VALUES
('Push Day', 'Strength', 'Göğüs, omuz ve triceps çalışması',
  '[{"name":"Bench Press","sets":4,"reps":"8-12"},{"name":"Overhead Press","sets":3,"reps":"8-10"},{"name":"Incline Dumbbell Press","sets":3,"reps":"10-12"},{"name":"Lateral Raise","sets":3,"reps":"12-15"},{"name":"Tricep Pushdown","sets":3,"reps":"12-15"},{"name":"Dips","sets":3,"reps":"failure"}]',
  60, 350),
('Pull Day', 'Strength', 'Sırt ve biceps çalışması',
  '[{"name":"Deadlift","sets":4,"reps":"5-8"},{"name":"Barbell Row","sets":4,"reps":"8-10"},{"name":"Lat Pulldown","sets":3,"reps":"10-12"},{"name":"Face Pull","sets":3,"reps":"15"},{"name":"Barbell Curl","sets":3,"reps":"10-12"},{"name":"Hammer Curl","sets":3,"reps":"12"}]',
  55, 380),
('Leg Day', 'Strength', 'Bacak ve kalça çalışması',
  '[{"name":"Squat","sets":4,"reps":"6-10"},{"name":"Romanian Deadlift","sets":3,"reps":"8-12"},{"name":"Leg Press","sets":3,"reps":"10-15"},{"name":"Walking Lunge","sets":3,"reps":"12 each"},{"name":"Leg Curl","sets":3,"reps":"12-15"},{"name":"Calf Raise","sets":4,"reps":"15-20"}]',
  65, 420),
('Full Body', 'Strength', 'Tüm vücut antrenmanı',
  '[{"name":"Squat","sets":3,"reps":"8-10"},{"name":"Bench Press","sets":3,"reps":"8-10"},{"name":"Barbell Row","sets":3,"reps":"8-10"},{"name":"Overhead Press","sets":3,"reps":"8-10"},{"name":"Plank","sets":3,"reps":"45s"},{"name":"Bicep Curl","sets":2,"reps":"12"}]',
  50, 320),
('HIIT Cardio', 'Cardio', 'Yüksek yoğunluklu interval antrenman',
  '[{"name":"Burpees","sets":4,"reps":"30s on / 15s rest"},{"name":"Mountain Climbers","sets":4,"reps":"30s on / 15s rest"},{"name":"Jump Squats","sets":4,"reps":"30s on / 15s rest"},{"name":"High Knees","sets":4,"reps":"30s on / 15s rest"},{"name":"Plank Jacks","sets":4,"reps":"30s on / 15s rest"}]',
  25, 350),
('Morning Yoga', 'Flexibility', 'Sabah esneme ve yoga rutini',
  '[{"name":"Sun Salutation","sets":5,"reps":"flow"},{"name":"Warrior Pose","sets":2,"reps":"30s each side"},{"name":"Downward Dog","sets":3,"reps":"30s hold"},{"name":"Child Pose","sets":2,"reps":"45s hold"},{"name":"Cat-Cow Stretch","sets":3,"reps":"10"}]',
  30, 120),
('Core Blast', 'Core', 'Karın kası odaklı antrenman',
  '[{"name":"Crunch","sets":3,"reps":"20"},{"name":"Russian Twist","sets":3,"reps":"20"},{"name":"Leg Raise","sets":3,"reps":"15"},{"name":"Plank","sets":3,"reps":"45s"},{"name":"Bicycle Crunch","sets":3,"reps":"20"},{"name":"Dead Bug","sets":3,"reps":"12 each"}]',
  25, 200),
('30 Dakika Yürüyüş', 'Cardio', 'Orta tempoda yürüyüş',
  '[{"name":"Yürüyüş","sets":1,"reps":"30 dakika"}]',
  30, 150),
('Koşu (5K)', 'Cardio', '5 kilometre koşu',
  '[{"name":"Koşu","sets":1,"reps":"5 km"}]',
  30, 350);

COMMIT;
