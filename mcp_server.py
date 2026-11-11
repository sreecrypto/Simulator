"""Circuit Studio's local MCP entry point."""

import json
import os
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, Request, build_opener

from mcp.server.fastmcp import FastMCP


mcp = FastMCP("Circuit Studio")
local_http = build_opener(ProxyHandler({}))


def request(path: str, payload: dict | None = None) -> dict:
    port = int(os.environ.get("CIRCUIT_STUDIO_PORT", "3000"))
    if not 1 <= port <= 65535:
        raise ValueError("CIRCUIT_STUDIO_PORT must be between 1 and 65535.")
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    req = Request(
        f"http://127.0.0.1:{port}/api/{path}",
        data=body,
        headers={"Content-Type": "application/json"} if body is not None else {},
    )
    try:
        with local_http.open(req, timeout=45) as response:
            data = response.read(40_000_001)
            if len(data) > 40_000_000:
                raise ValueError("Simulation result exceeds 40 MB.")
            return json.loads(data)
    except HTTPError as error:
        with error:
            detail = json.loads(error.read(8192)).get("error", str(error))
        raise ValueError(detail) from error
    except URLError as error:
        raise RuntimeError(
            f"Start Circuit Studio with node server.mjs on local port {port}."
        ) from error


def preview_rows(data: dict, max_rows: int) -> dict:
    if not 2 <= max_rows <= 2000:
        raise ValueError("max_rows must be between 2 and 2,000.")
    rows = data.get("rows")
    if rows is None or len(rows) <= max_rows:
        return data
    indices = [i * (len(rows) - 1) // (max_rows - 1) for i in range(max_rows)]
    return {**data, "rows": [rows[i] for i in indices], "totalRows": len(rows)}


@mcp.tool()
def simulator_status() -> dict:
    """Check the local server and optional ngspice and Icarus executables."""
    return request("status")


@mcp.tool()
def simulate_analog(
    circuit: dict,
    analysis: Literal["dc", "transient", "ac"] = "dc",
    engine: Literal["builtin", "ngspice"] = "builtin",
    duration: float = 0.01,
    max_rows: int = 200,
) -> dict:
    """Run an analog Circuit Studio project and return node voltages or a sampled trace."""
    data = request("analog/run", {
        "circuit": circuit, "engine": engine,
        "options": {"kind": analysis, "duration": duration},
    })["data"]
    return preview_rows(data, max_rows)


@mcp.tool()
def simulate_digital(
    circuit: dict,
    analysis: Literal["truth", "tick", "verify"] = "truth",
    duration: float = 0.01,
    max_rows: int = 256,
) -> dict:
    """Run a truth table, timed trace, or Icarus check for a digital Circuit Studio project."""
    data = request("digital/run", {
        "circuit": circuit, "kind": analysis, "duration": duration,
    })["data"]
    if analysis == "verify":
        return {"passed": data["passed"], "summary": data["summary"]}
    return preview_rows(data, max_rows)


@mcp.tool()
def simulate_fsm(
    machine: dict, state: str | None = None, event: str | None = None
) -> dict:
    """Get the initial state or apply one event to an FSM. Supply both state and event to step."""
    if (state is None) != (event is None):
        raise ValueError("Supply both state and event, or omit both to reset.")
    return request("fsm/run", {
        "machine": machine,
        "action": "reset" if event is None else "step",
        "state": state, "input": event,
    })["data"]


@mcp.tool()
def simulate_microcontroller(
    source: str,
    target: Literal["teaching", "avr", "8051"] = "teaching",
    steps: int = 100,
    cursor: int = 0,
) -> dict:
    """Run a supported assembly subset. Pass the returned cursor to continue the same program."""
    return request("microcontrollers/run", {
        "project": {"source": source, "target": target},
        "cursor": cursor, "steps": steps,
    })["data"]


if __name__ == "__main__":
    mcp.run(transport="stdio")
