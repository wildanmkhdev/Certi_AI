-- Seed weight rules
insert into public.weight_rules (category, min_duration, max_duration, weight, description)
values
  ('Workshop', 4, 8, 1, 'Workshop dengan durasi 4-8 jam'),
  ('Workshop', 9, null, 2, 'Workshop dengan durasi lebih dari 8 jam'),
  ('Seminar', 0, 4, 1, 'Seminar dengan durasi kurang dari 4 jam'),
  ('Competition', 1, 1, 1, 'Kompetisi tingkat lokal / regional'),
  ('Competition', 2, 2, 2, 'Kompetisi tingkat nasional'),
  ('Competition', 3, 3, 3, 'Kompetisi tingkat internasional'),
  ('Certification', 0, null, 3, 'Sertifikasi keahlian profesi / industri');
