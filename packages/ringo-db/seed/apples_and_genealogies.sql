INSERT OR REPLACE INTO apples (name, display_name) VALUES ('unknown', '不明');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('unknown', 'unknown', 'unknown');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('golden_delicious', 'ゴールデンデリシャス');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('golden_delicious', 'unknown', 'unknown');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('delicious', 'デリシャス');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('delicious', 'unknown', 'unknown');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('kokkou', '国光');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('kokkou', 'unknown', 'unknown');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('kougyoku', '紅玉');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('kougyoku', 'unknown', 'unknown');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('indo', '印度');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('indo', 'unknown', 'unknown');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('vista_bella', 'ビスタベラ');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('vista_bella', 'unknown', 'unknown');


INSERT OR REPLACE INTO apples (name, display_name) VALUES ('tsugaru', 'つがる');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('tsugaru', 'kougyoku', 'golden_delicious');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('fuji', 'フジ');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('fuji', 'delicious', 'kokkou');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('shinano_sweet', 'シナノスイート');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('shinano_sweet', 'tsugaru', 'fuji');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('toukou', '東光');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('toukou', 'indo', 'golden_delicious');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('senshu', '千秋');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('senshu', 'fuji', 'toukou');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('shinano_dolce', 'シナノドルチェ');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('shinano_dolce', 'tsugaru', 'fuji');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('shinano_red', 'シナノレッド');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('shinano_red', 'vista_bella', 'tsugaru');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('shinano_lip', 'シナノリップ');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('shinano_lip', 'shinano_red', 'senshu');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('shinano_gold', 'シナノゴールド');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('shinano_gold', 'senshu', 'golden_delicious');

INSERT OR REPLACE INTO apples (name, display_name) VALUES ('ohshu_roman', '奥州ロマン');
INSERT OR REPLACE INTO genealogies (child_name, pollen_name, seed_name) VALUES ('ohshu_roman', 'tsugaru', 'shinano_gold');