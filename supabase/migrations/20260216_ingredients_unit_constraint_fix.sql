-- Normalize and widen ingredients unit_type check before shared seed migrations.

begin;

alter table if exists public.ingredients
  drop constraint if exists ingredients_unit_type_check;

update public.ingredients
set unit_type = case
  when lower(unit_type) in ('g', 'gram', 'grams') then 'g'
  when lower(unit_type) in ('kg', 'kilogram', 'kilograms') then 'kg'
  when lower(unit_type) in ('oz', 'ounce', 'ounces') then 'oz'
  when lower(unit_type) in ('lb', 'lbs', 'pound', 'pounds') then 'lb'
  when lower(unit_type) in ('ml', 'milliliter', 'milliliters') then 'ml'
  when lower(unit_type) in ('l', 'liter', 'liters') then 'l'
  when lower(unit_type) in ('tsp', 'teaspoon', 'teaspoons') then 'tsp'
  when lower(unit_type) in ('tbsp', 'tablespoon', 'tablespoons') then 'tbsp'
  when lower(unit_type) in ('cup', 'cups') then 'cup'
  when lower(unit_type) in ('unit', 'count', 'each') then 'unit'
  else lower(unit_type)
end
where unit_type is not null;

alter table if exists public.ingredients
  add constraint ingredients_unit_type_check
  check (lower(unit_type) in ('g', 'kg', 'oz', 'lb', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'unit'));

alter table if exists public.ingredients
  alter column unit_type set default 'g';

commit;
