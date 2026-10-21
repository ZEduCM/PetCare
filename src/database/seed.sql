-- Usuário de demonstração: demo@petcare.com / petcare123
insert into users (name, email, password)
select
  'Tutor Demo',
  'demo@petcare.com',
  'ee5498f05e2d05d1c67ea7d1fe6b9eaa:a540a5cb880b81964e8ffab6a9c7d53e61764cf9136ddaec260bb81f90fa06ed66372df0c9f9b8292dec89d7ea67235bb96b98e45e1d387ac849ddf46782533b'
where not exists (select 1 from users where email = 'demo@petcare.com');

insert into pets (user_id, name, type, breed, age, weight, next_vaccine, icon, description)
select u.id, p.name, p.type, p.breed, p.age, p.weight, p.next_vaccine::date, p.icon, p.description
from users u
cross join (values
  ('Nina', 'Coelho', 'Mini Lop', '2', '1,8 kg', '2026-10-15', '🐰',
   'Carinhosa e tranquila. Gosta de feno e de ficar em lugares aconchegantes.'),
  ('Mimi', 'Gato', 'SRD', '3', '4,2 kg', '2026-10-22', '🐱',
   'Curiosa e brincalhona. Adora brinquedos com penas e horários certinhos para comer.'),
  ('Thor', 'Cão', 'Golden Retriever', '4', '12 kg', '2026-10-20', '🐶',
   'Muito ativo e companheiro. Gosta de passeios, banho e bastante atenção.')
) as p (name, type, breed, age, weight, next_vaccine, icon, description)
where u.email = 'demo@petcare.com'
  and not exists (select 1 from pets where user_id = u.id);

insert into appointments (pet_id, title, category, date, time, notes)
select pets.id, a.title, a.category, current_date + a.day_offset, a.time::time, a.notes
from users u
join pets on pets.user_id = u.id
join (values
  ('Mimi', 'Jantar da Mimi', 'Alimentação', 0, '19:00', 'Ração e água.'),
  ('Nina', 'Ninar a Nina', 'Rotina', 0, '20:00', ''),
  ('Thor', 'Banho do Thor', 'Higiene', 1, '21:00', 'Usar shampoo neutro.')
) as a (pet, title, category, day_offset, time, notes) on a.pet = pets.name
where u.email = 'demo@petcare.com'
  and not exists (
    select 1 from appointments
    join pets owned on owned.id = appointments.pet_id
    where owned.user_id = u.id
  );
