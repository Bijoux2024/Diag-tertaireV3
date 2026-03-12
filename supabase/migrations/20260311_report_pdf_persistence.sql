alter table public.pro_reports
  add column if not exists latest_pdf_file_id uuid null references public.organization_files(id) on delete set null,
  add column if not exists latest_pdf_generated_at timestamptz null,
  add column if not exists pdf_status text null,
  add column if not exists pdf_error text null;
