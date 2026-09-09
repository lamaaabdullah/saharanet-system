-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_roles (
  role_id integer NOT NULL DEFAULT nextval('admin_roles_role_id_seq'::regclass),
  role_name character varying NOT NULL UNIQUE,
  CONSTRAINT admin_roles_pkey PRIMARY KEY (role_id)
);
CREATE TABLE public.admin (
  admin_id integer NOT NULL DEFAULT nextval('admin_admin_id_seq'::regclass),
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  department character varying,
  username character varying UNIQUE,
  role_id integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid UNIQUE,
  reset_code character varying,
  reset_expiry timestamp without time zone,
  CONSTRAINT admin_pkey PRIMARY KEY (admin_id),
  CONSTRAINT admin_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.admin_roles(role_id),
  CONSTRAINT admin_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.customer (
  customer_id integer NOT NULL DEFAULT nextval('customer_customer_id_seq'::regclass),
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  company character varying,
  status character varying NOT NULL DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'suspended'::character varying, 'inactive'::character varying]::text[])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid UNIQUE,
  reset_code character varying,
  reset_expiry timestamp without time zone,
  CONSTRAINT customer_pkey PRIMARY KEY (customer_id),
  CONSTRAINT customer_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.hosting_plan (
  plan_id integer NOT NULL DEFAULT nextval('hosting_plan_plan_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  storage_size character varying NOT NULL,
  bandwidth_limit character varying NOT NULL,
  price numeric NOT NULL,
  duration_months integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hosting_plan_pkey PRIMARY KEY (plan_id)
);
CREATE TABLE public.service (
  service_id integer NOT NULL DEFAULT nextval('service_service_id_seq'::regclass),
  name character varying NOT NULL,
  service_duration character varying,
  price numeric NOT NULL,
  status character varying NOT NULL DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying]::text[])),
  admin_id integer,
  plan_id integer NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT service_pkey PRIMARY KEY (service_id),
  CONSTRAINT service_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(admin_id),
  CONSTRAINT service_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.hosting_plan(plan_id)
);
CREATE TABLE public.booking (
  booking_id integer NOT NULL DEFAULT nextval('booking_booking_id_seq'::regclass),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'active'::character varying, 'suspended'::character varying, 'cancelled'::character varying, 'expired'::character varying, 'scheduled'::character varying]::text[])),
  customer_id integer NOT NULL,
  service_id integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT booking_pkey PRIMARY KEY (booking_id),
  CONSTRAINT booking_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id),
  CONSTRAINT booking_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.service(service_id)
);
CREATE TABLE public.billing (
  invoicing_id integer NOT NULL DEFAULT nextval('billing_invoicing_id_seq'::regclass),
  amount numeric NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  payment_method character varying,
  payment_status character varying NOT NULL DEFAULT 'unpaid'::character varying CHECK (payment_status::text = ANY (ARRAY['unpaid'::character varying, 'paid'::character varying, 'overdue'::character varying, 'refunded'::character varying]::text[])),
  customer_id integer NOT NULL,
  booking_id integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT billing_pkey PRIMARY KEY (invoicing_id),
  CONSTRAINT billing_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id),
  CONSTRAINT billing_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.booking(booking_id)
);
CREATE TABLE public.support_logs (
  support_id integer NOT NULL DEFAULT nextval('support_logs_support_id_seq'::regclass),
  title character varying NOT NULL,
  content text NOT NULL,
  status character varying NOT NULL DEFAULT 'open'::character varying CHECK (status::text = ANY (ARRAY['open'::character varying, 'in_progress'::character varying, 'resolved'::character varying, 'closed'::character varying]::text[])),
  created_date timestamp with time zone NOT NULL DEFAULT now(),
  updated_date timestamp with time zone NOT NULL DEFAULT now(),
  customer_id integer NOT NULL,
  admin_id integer,
  phone character varying DEFAULT ''::character varying,
  contact_email character varying DEFAULT ''::character varying,
  CONSTRAINT support_logs_pkey PRIMARY KEY (support_id),
  CONSTRAINT support_logs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id),
  CONSTRAINT support_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(admin_id)
);
CREATE TABLE public.ticket_replies (
  reply_id integer NOT NULL DEFAULT nextval('ticket_replies_reply_id_seq'::regclass),
  support_id integer NOT NULL,
  sender_type character varying NOT NULL CHECK (sender_type::text = ANY (ARRAY['customer'::character varying, 'admin'::character varying]::text[])),
  sender_id integer NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ticket_replies_pkey PRIMARY KEY (reply_id),
  CONSTRAINT ticket_replies_support_id_fkey FOREIGN KEY (support_id) REFERENCES public.support_logs(support_id)
);
CREATE TABLE public.ai_chat_logs (
  log_id integer NOT NULL DEFAULT nextval('ai_chat_logs_log_id_seq'::regclass),
  session_id character varying NOT NULL,
  customer_id integer,
  user_message text NOT NULL,
  ai_reply text NOT NULL,
  category character varying NOT NULL DEFAULT 'General'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_chat_logs_pkey PRIMARY KEY (log_id),
  CONSTRAINT ai_chat_logs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id)
);