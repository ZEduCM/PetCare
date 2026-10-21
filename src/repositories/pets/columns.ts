export const petColumns = `
  id, user_id AS "ownerId", name, type, breed, age, weight,
  coalesce(to_char(next_vaccine, 'YYYY-MM-DD'), '') AS vaccine,
  icon, description`;
