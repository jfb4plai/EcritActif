-- EcritActif : mots locaux acceptés par classe (signal « mot absent de la liste »).
-- À appliquer seulement avec l'accord de JF, d'abord dans une transaction annulée (voir supabase/essai-rollback-mots-classe.sql).
-- La RLS et les droits de ecrit_classes (lecture et mise à jour par le propriétaire) couvrent déjà la nouvelle colonne.
alter table public.ecrit_classes add column if not exists mots_acceptes text[] not null default '{}';
