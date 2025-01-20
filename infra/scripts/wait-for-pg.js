const { exec } = require("node:child_process");

function checkPostgres() {
  exec("docker exec pg-dev pg_isready --host localhost", handleIsReady);

  function handleIsReady(error, stdout) {
    if (stdout.search("accepting connections") === -1) {
      process.stdout.write(".");
      checkPostgres();
      return;
    }
    console.log("\n🟢 Postgres está pronto e aceitando conexões!\n");
  }
}

process.stdout.write("\n\n🔴 Aguardando Postgres aceitar conexões");
checkPostgres();
