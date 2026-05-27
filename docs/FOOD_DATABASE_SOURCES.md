# Food Database Sources

These foods are demo estimates for HealthyLifeHappyLife seed data. Values are intended to make the demo food library realistic enough for search, meal logging, and recommendation demos. They are not medical advice, clinical nutrition guidance, or a substitute for measured restaurant/packaged-food labels.

Restaurant recipes, portion weights, oil use, sauces, and side breads vary widely. When a source used a per-100 g value, the seed value scales it to the listed demo serving size and rounds to practical app-display precision.

## Sources Used

- FatSecret, Lahmacun generic nutrition: https://foods.fatsecret.com/calories-nutrition/generic/flatbread-lahmacun
- FatSecret Turkey, Lahmacun 100 g listing: https://www.fatsecret.com.tr/kaloriler-beslenme/mutfa%C4%9F%C4%B1m/lahmacun/100g
- FatSecret Turkey, Mercimek Çorbası generic nutrition: https://www.fatsecret.com.tr/kaloriler-beslenme/genel/mercimek-%C3%87orbas%C4%B1?portionamount=100&portionid=52000
- FatSecret, Ayran generic nutrition: https://foods.fatsecret.com/calories-nutrition/generic/ayran
- FatSecret Turkey, Simit generic nutrition: https://www.fatsecret.com.tr/kaloriler-beslenme/genel/simit
- FatSecret Turkey, Köfte generic nutrition: https://www.fatsecret.com.tr/kaloriler-beslenme/genel/k%C3%B6fte?frc=True
- FatSecret Turkey, Namet Et Döner 100 g: https://www.fatsecret.com.tr/kaloriler-beslenme/namet/et-d%C3%B6ner/100g
- FatSecret Germany, Chicken Döner generic portion: https://www.fatsecret.de/Kalorien-Ern%C3%A4hrung/Allgemein/chicken-d%C3%B6ner?portionamount=1%2C000&portionid=5164506
- FatSecret Turkey, İskender Kebap search result and portion listing: https://www.fatsecret.com.tr/kaloriler-beslenme/search?q=Iskender
- FatSecret Turkey, Usta Dönerci Et İskender listing: https://www.fatsecret.com.tr/kaloriler-beslenme/usta-d%C3%B6nerci/et-%C4%B0skender/1-porsiyon
- FatSecret Germany, Adana Kebap search result: https://www.fatsecret.de/Kalorien-Ern%C3%A4hrung/search?q=Adana+Kebap
- Fitekran, Adana Kebap nutrition summary: https://www.fitekran.com/besin-degeri/adana-kebap/
- Fitekran, Tavuk Şiş nutrition summary: https://www.fitekran.com/besin-degeri/tavuk-sis/
- Haberturk, Tavuk Şiş nutrition summary: https://www.haberturk.com/kac-kalori/tavuk-sis-besin-degeri
- FatSecret Turkey, Ordinary-US Tavuk Şiş listing: https://www.fatsecret.com.tr/kaloriler-beslenme/ordinary-us/tavuk-%C5%9Ei%C5%9F/100g
- FatSecret Brazil, Superfresh Kıymalı Pide listing: https://www.fatsecret.com.br/Diary.aspx?pa=fjrd&rid=18406457
- FatSecret Turkey, Ezogelin Çorbası search/listings: https://www.fatsecret.com.tr/kaloriler-beslenme/search?q=Ezogelin
- FatSecret, Knorr Ezogelin Çorbası listing: https://foods.fatsecret.com/Diary.aspx?pa=fjrd&rid=8416583
- Dietkolik, Ezogelin Çorbası nutrition summary: https://www.diyetkolik.com/kac-kalori/ezogelin-corbasi
- FatSecret, cooked bulgur generic nutrition: https://foods.fatsecret.com/calories-nutrition/generic/bulgur-cooked-or-canned
- Pedider PDF, energy/protein table for common Turkish dishes: https://pedider.org.tr/sites/default/files/3-Energy%20and%20Protein%20Content%20of%20Commonly%20Used%20Turkish%20Dishes%20for%20Managing%20Food%20I%CC%87ntake%20in%20Children%20with%20Chronic%20Kidney%20Disease.pdf
- Dürümle nutrition PDF, 2025 restaurant wrap reference: https://www.durumle.com/storage/downloads/besin-degerleri-2025-04-14.pdf
- Dürümle nutrition PDF, 2025 restaurant wrap reference: https://www.durumle.com/storage/downloads/besin-degerleri-2025-08-28.pdf

## Seed Assumptions

| Seed item | Demo serving | Estimate notes |
| --- | --- | --- |
| Tavuk döner dürüm | 1 dürüm, about 385 g | Uses FatSecret chicken döner portion as a close proxy for a chicken wrap/döner serving. Dürümle PDFs were used as a restaurant cross-check for döner wraps. |
| Et döner porsiyon | 1 plate, about 200 g meat | Scales FatSecret Namet Et Döner per-100 g values to a meat-heavy plate portion. This does not include rice or fries. |
| Adana kebap | 1 medium portion, about 151 g | Uses Fitekran serving calories/macros and FatSecret Adana search result as cross-check. Assumes lavash garnish may be present, so gluten is listed. |
| Urfa kebap | 1 medium portion, about 150 g | Estimated near Adana kebap with slightly lower spice/fat variation; same serving model and allergen assumption. |
| İskender kebap | 1 portion, about 400 g | Uses FatSecret generic İskender portion. Usta Dönerci restaurant listing was checked because restaurant portions can be much larger. |
| Lahmacun | 1 piece | Uses FatSecret generic 1-piece Lahmacun values. |
| Menemen | 1 serving, about 250 g | Estimated from typical eggs, tomato/pepper, and oil. Main allergen is egg. |
| Mercimek çorbası | 1 bowl, about 248 g | Scales FatSecret per-100 g mercimek çorbası to a bowl-sized serving. |
| Ezogelin çorbası | 1 bowl, about 250 g | Uses Dietkolik per-100 g macro ratios, with FatSecret soup listings as cross-checks. Includes gluten for bulgur and milk for common butter use. |
| Bulgur pilavı | 1 cup cooked, about 182 g | Starts from cooked bulgur values and adds a modest oil allowance typical of pilaf. |
| Ayran | 1 cup, about 245 ml | Uses FatSecret generic ayran cup values. |
| Simit | 1 normal simit | Uses FatSecret generic simit serving values. |
| Kıymalı pide | 1 medium pide, about 250 g | Scales FatSecret Superfresh Kıymalı Pide per-100 g listing to a medium pide. |
| Tavuk şiş | 1 medium portion, about 165 g | Uses Haberturk/Fitekran medium portion values; FatSecret brand listing was treated as a higher-fat restaurant variant. |
| Köfte | 100 g | Uses FatSecret generic köfte per-100 g values. Breadcrumb and egg are common in köfte recipes, so gluten and egg are listed. |

## Search Tags

Display names may use Turkish characters. Seed tags also include ASCII-friendly search aliases such as `doner`, `durum`, `kebap`, `kebab`, `corba`, `sis`, `kofte`, and `kiymali` so the demo food search works with both Turkish and English keyboard input.
