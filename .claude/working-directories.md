# Working directory structure

## Related repositories

- `../policyengine-api-v2`: Backend API services (FastAPI)
  - `projects/policyengine-api-full`: Full API with CRUD operations
  - `projects/policyengine-api-simulation`: Simulation runner API (used for long-running operations)
  - `projects/policyengine-api-tagger`: Model version tagging service
- `../policyengine.py`: Core PolicyEngine package with models and database table definitions

## Backend architecture

### Full API (policyengine-api-full)
Handles CRUD operations for:
- Simulations
- Aggregates
- Aggregate changes
- Policies
- Datasets
- etc.

### Simulation API (policyengine-api-simulation)
Long-running simulation processing service. In production, endpoints are invoked via Google Cloud Workflows.

### Database
Supabase/PostgreSQL database with table definitions in `policyengine.py`.

## Local development vs production

- Production: Simulation API endpoints run via Google Cloud Workflows
- Local: Need to mock workflow behaviour with queue processing

## Debugging APIs locally

When debugging, you can make HTTP requests to test the APIs:
- Full API (CRUD): `http://localhost:8000`
- Simulation API (processing): `http://localhost:8001`

Example debugging commands:
```bash
# Get a simulation
curl http://localhost:8000/simulations/{simulation_id}

# Run a simulation synchronously
curl -X POST http://localhost:8001/run_simulation_sync/{simulation_id}
```
