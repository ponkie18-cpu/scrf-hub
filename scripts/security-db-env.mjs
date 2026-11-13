// libpq treats an empty PGSERVICE as a named service, not as "disabled".
// Drop inherited PG* settings rather than forwarding empty connection options.
export function localPostgresEnv(source = process.env) {
  return {
    ...Object.fromEntries(Object.entries(source).filter(([key]) => !/^PG/i.test(key))),
    PGPASSWORD: 'postgres',
    PGHOSTADDR: '127.0.0.1',
    PGOPTIONS: '',
    PGSSLMODE: 'disable',
  };
}