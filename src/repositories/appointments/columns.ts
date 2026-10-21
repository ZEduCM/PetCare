// Espera os aliases "a" (appointments) e "p" (pets).
export const appointmentColumns = `
  a.id, a.pet_id AS "petId", p.name AS "petName", a.title, a.category,
  to_char(a.date, 'YYYY-MM-DD') AS date,
  to_char(a.time, 'HH24:MI') AS time,
  a.notes, a.completed`;
