export async function simulate(mode, input) {
  const response = await fetch(`/api/${mode}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Simulation failed.');
  return result.data;
}
