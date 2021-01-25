CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- movie

CREATE TABLE IF NOT EXISTS person(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS movie(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  year integer NOT NULL,
  director_id uuid NOT NULL REFERENCES person(id),
  writer_id uuid NOT NULL REFERENCES person(id),
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS starring(
  person_id uuid NOT NULL REFERENCES person(id),
  movie_id uuid NOT NULL REFERENCES movie(id)
);

--------------------------------------------------------------------------------
-- user

CREATE TABLE IF NOT EXISTS "user"(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS event(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL,
  data JSON
);

--------------------------------------------------------------------------------
-- bitcoin

CREATE TABLE IF NOT EXISTS bitcoin_receive_address(
  id TEXT PRIMARY KEY
);

CREATE OR REPLACE FUNCTION truncate_tables(username IN VARCHAR) RETURNS void AS $$
DECLARE
  statements CURSOR FOR
    SELECT tablename FROM pg_tables
    WHERE tableowner = username AND schemaname = 'public';
BEGIN
  FOR stmt IN statements LOOP
      EXECUTE 'TRUNCATE TABLE ' || quote_ident(stmt.tablename) || ' CASCADE;';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT truncate_tables('vagrant');

INSERT INTO "user"(name) VALUES
  ('laura'),
  ('dale'),
  ('audrey'),
  ('leland'),
  ('donna'),
  ('ben')
;

INSERT INTO bitcoin_receive_address(id) VALUES
  ('1K5oPr2BE4QQQ13tXmcfW9eteQCJh6g54u'),
  ('1GA1PqAwmGpj9Wp6r8zLoe5Gdi9hDsb8PS'),
  ('1JP45zuwzKXQu51AxmAKsqRnE68DoPnTPL'),
  ('3MfN5to5K5be2RupWE8rjJHQ6V9L8ypWeh'),
  ('1487tLmthE7ya5dr1Db2JAqPaJnHuDRHA3')
;
