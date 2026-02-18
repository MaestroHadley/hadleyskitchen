-- Ensure shared default ingredients use grams (g) as canonical unit.

begin;

update public.ingredients
set unit_type = 'g'
where owner_id is null
  and lower(unit_type) = 'ml';

commit;
