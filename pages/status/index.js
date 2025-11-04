import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  if(response.ok) {
    return response.json();
  }

  const error = await response.json()
  throw new Error(error)
}

export default function StatusPage() {
  return (
    <>
      <h1>Status Page</h1>
      <UpdatedAt />
      <Database />
    </>
  );
}

function UpdatedAt() {
  const { data, isLoading, error } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAt = error ? new Date().toISOString() : "Carregando...";

  if (!isLoading && data) {
    updatedAt = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return <h2>Ultima atualização: {updatedAt}</h2>;
}

function Database() {
  const { data, isLoading, error } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  if(error) {
    return(
      <h1>Failed to load</h1>
    )
  }

  let version = "0.0";
  let maxConnections = 0;
  let openedConnections = 0;

  if (!isLoading && data) {
    version = data.dependencies.database.version;
    maxConnections = data.dependencies.database.max_connections;
    openedConnections = data.dependencies.database.opened_connections;
  }

  return (
    <div>
      <h2>Database status</h2>
      <h3>Versão: {version}</h3>
      <h3>Máximo de conexões: {maxConnections}</h3>
      <h3>Conexões abertas: {openedConnections}</h3>
    </div>
  );
}
