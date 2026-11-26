-- Contact form messages live with the other leads (one table to read): kind 'contact', a topic and the message.
alter table public.waitlist drop constraint if exists waitlist_kind_check;
alter table public.waitlist add constraint waitlist_kind_check
  check (kind in ('city', 'flat_interior', 'renovation', 'architect_review', 'contact'));
alter table public.waitlist add column if not exists topic text
  check (topic is null or topic in ('question', 'problem', 'architect', 'other'));
alter table public.waitlist add column if not exists message text check (message is null or char_length(message) <= 4000);
