-- ProSpace Health - corrigir o perfil de uma conta Auth existente
-- Execute no Supabase > SQL Editor.
-- Antes de executar, substitua COLOQUE_AQUI_O_EMAIL pelo e-mail EXATO da conta
-- que já existe em Authentication > Users.
--
-- Seguro para executar mais de uma vez:
-- - recria o trigger para novos cadastros;
-- - cria o perfil apenas se estiver ausente;
-- - não altera o role de um perfil que já existe;
-- - não publica nem utiliza service_role no frontend.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cpf text;
begin
  v_cpf := nullif(
    regexp_replace(coalesce(new.raw_user_meta_data ->> 'cpf', ''), '[^0-9]', '', 'g'),
    ''
  );

  insert into public.profiles (id, full_name, cpf, phone, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuário'
    ),
    case
      when v_cpf is not null
       and not exists (select 1 from public.profiles p where p.cpf = v_cpf)
      then v_cpf
      else null
    end,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    'citizen'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Corrige a conta que já existia antes da instalação do trigger.
do $$
declare
  v_email text := lower(trim('COLOQUE_AQUI_O_EMAIL'));
  v_user_id uuid;
  v_cpf text;
begin
  if v_email = '' or v_email = 'coloque_aqui_o_email' then
    raise exception 'Edite o e-mail no início deste bloco antes de executar.';
  end if;

  select u.id
    into v_user_id
  from auth.users u
  where lower(u.email) = v_email
  limit 1;

  if v_user_id is null then
    raise exception 'Não encontramos esse e-mail em Authentication > Users. Confira o endereço digitado.';
  end if;

  select nullif(
    regexp_replace(coalesce(u.raw_user_meta_data ->> 'cpf', ''), '[^0-9]', '', 'g'),
    ''
  )
    into v_cpf
  from auth.users u
  where u.id = v_user_id;

  insert into public.profiles (id, full_name, cpf, phone, role)
  select
    u.id,
    coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
      'Usuário'
    ),
    case
      when v_cpf is not null
       and not exists (select 1 from public.profiles p where p.cpf = v_cpf)
      then v_cpf
      else null
    end,
    nullif(trim(u.raw_user_meta_data ->> 'phone'), ''),
    'citizen'
  from auth.users u
  where u.id = v_user_id
  on conflict (id) do nothing;
end;
$$;

-- Verificação: deve retornar o e-mail, o id e o role citizen.
-- Se não retornar linha, confira o e-mail usado no bloco acima.
select u.email, p.id, p.full_name, p.role
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) = lower('COLOQUE_AQUI_O_EMAIL');
