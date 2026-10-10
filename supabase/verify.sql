-- This test rolls back all test records. It does not remove any real doll.
begin;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"9518f7d8-f6ff-4df3-8425-c9eab8244cf4","role":"authenticated"}',true);
do $$
declare n integer;
begin
 if not public.is_site_admin() then raise exception 'Administrator is not configured'; end if;
 insert into public.family_members(id,name,created,owner_id,object_path,revision)
 values('00000000000000000000000000000001','临时权限测试',1,'9518f7d8-f6ff-4df3-8425-c9eab8244cf4','9518f7d8-f6ff-4df3-8425-c9eab8244cf4/00000000000000000000000000000001/00000000-0000-0000-0000-000000000002.json',1);
 perform set_config('request.jwt.claims','{"sub":"dd6db72c-f66f-4989-8a90-71e2507ad91b","role":"authenticated","is_anonymous":true}',true);
 if public.is_site_admin() then raise exception 'Visitor acquired administrator permissions'; end if;
 update public.family_members set name='不允许覆盖',revision=2 where id='00000000000000000000000000000001';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Visitor can overwrite another doll'; end if;
 delete from public.family_members where id='00000000000000000000000000000001';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Visitor can delete another doll'; end if;
 perform set_config('request.jwt.claims','{"sub":"9518f7d8-f6ff-4df3-8425-c9eab8244cf4","role":"authenticated"}',true);
 update public.family_members set name='管理员渲染更新',revision=2 where id='00000000000000000000000000000001';
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Administrator cannot update the doll'; end if;
 perform set_config('request.jwt.claims','{"sub":"dd6db72c-f66f-4989-8a90-71e2507ad91b","role":"authenticated","is_anonymous":true}',true);
 insert into public.family_members(id,name,created,owner_id,object_path,revision)
 values('00000000000000000000000000000004','朋友作品测试',1,'dd6db72c-f66f-4989-8a90-71e2507ad91b','dd6db72c-f66f-4989-8a90-71e2507ad91b/00000000000000000000000000000004/00000000-0000-0000-0000-000000000002.json',1);
 perform set_config('request.jwt.claims','{"sub":"9518f7d8-f6ff-4df3-8425-c9eab8244cf4","role":"authenticated"}',true);
 update public.family_members set name='朋友作品管理员更新',revision=2,object_path='9518f7d8-f6ff-4df3-8425-c9eab8244cf4/00000000000000000000000000000004/00000000-0000-0000-0000-000000000002.json' where id='00000000000000000000000000000004';
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Administrator cannot update a friend-owned doll'; end if;
 -- Check visitors cannot forge another author's identity.
 perform set_config('request.jwt.claims','{"sub":"dd6db72c-f66f-4989-8a90-71e2507ad91b","role":"authenticated","is_anonymous":true}',true);
 begin
  insert into public.family_members(id,name,created,owner_id,object_path,revision)
  values('00000000000000000000000000000003','拒绝伪造作者',1,'9518f7d8-f6ff-4df3-8425-c9eab8244cf4','dd6db72c-f66f-4989-8a90-71e2507ad91b/00000000000000000000000000000003/00000000-0000-0000-0000-000000000002.json',1);
  raise exception 'Visitor can impersonate another author';
 exception when insufficient_privilege then null;
 end;
 raise notice 'PASS: administrator configured; visitor cannot overwrite/delete/impersonate another author; administrator update succeeds.';
end;
$$;
rollback;
select 'PASS: 权限检查通过，所有测试记录已回滚' as verification;
