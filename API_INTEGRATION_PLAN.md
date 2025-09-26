# PolicyEngine App v2 API Integration Plan

## Overview
This document maps each component of the PolicyEngine app to the corresponding API endpoints at localhost:8000, identifying what data needs to be fetched, created, updated or deleted.

## API Base Configuration
- **Current**: https://api.policyengine.org
- **Target**: http://localhost:8000
- **Update Required**: `/app/src/constants.ts` BASE_URL

## Core Data Models & API Endpoints

### 1. Policies
**Component**: `/app/src/pages/Policies.page.tsx`
**Purpose**: Manage policy configurations and parameter overrides
**API Integration**:
- **GET /policies/** - List all policies (pagination support)
- **GET /policies/{policy_id}** - Get specific policy details
- **POST /policies/** - Create new policy
- **PATCH /policies/{policy_id}** - Update existing policy
- **DELETE /policies/{policy_id}** - Delete policy

**Data Flow**:
- User creates/edits policies through UI forms
- Policy parameters stored with parameter values
- Link policies to simulations for impact analysis

### 2. Simulations
**Component**: `/app/src/pages/Simulations.page.tsx`
**Purpose**: Run simulations with populations and policies
**API Integration**:
- **GET /simulations/** - List all simulations
- **GET /simulations/{simulation_id}** - Get simulation details
- **POST /simulations/** - Create new simulation
- **POST /simulations/{simulation_id}/run** - Execute simulation
- **PATCH /simulations/{simulation_id}** - Update simulation
- **DELETE /simulations/{simulation_id}** - Delete simulation

**Data Flow**:
- Simulations link policies with populations
- Run endpoint triggers calculation engine
- Results stored for report generation

### 3. Populations (Households/Geography)
**Component**: `/app/src/pages/Populations.page.tsx`
**Purpose**: Define household or geographic populations
**API Integration**:
- **GET /versioned-datasets/** - Get available population datasets
- **GET /versioned-datasets/{versioned_dataset_id}** - Get specific dataset
- **POST /versioned-datasets/** - Create custom population dataset

**Data Flow**:
- Users select predefined populations or create custom ones
- Populations used as input for simulations
- Support both household and geographic scopes

### 4. Reports
**Component**: `/app/src/frames/report/ReportOutputFrame.tsx`
**Purpose**: Generate and display analysis reports
**API Integration**:
- No direct report endpoints in new API
- Reports generated from simulation results
- Use simulation data for visualization

**Data Flow**:
- Pull data from completed simulations
- Generate charts and metrics client-side
- Cache results for performance

### 5. Parameters
**Purpose**: Configure policy parameter values
**API Integration**:
- **GET /parameters/** - List all parameters
- **GET /parameters/{parameter_id}** - Get parameter details
- **POST /parameters/** - Create new parameter
- **GET /parameter-values/** - Get parameter values
- **POST /parameter-values/** - Set parameter values
- **PATCH /parameter-values/{parameter_value_id}** - Update values
- **DELETE /parameter-values/{parameter_value_id}** - Remove values

**Data Flow**:
- Parameters define the configurable aspects of policies
- Values link parameters to specific policies
- Support time-based variations

### 6. Models & Model Versions
**Purpose**: Track calculation engine versions
**API Integration**:
- **GET /models/** - List available models
- **GET /models/{model_id}** - Get model details
- **GET /model-versions/** - List model versions
- **GET /model-versions/{model_version_id}** - Get version details
- **POST /models/** - Register new model
- **POST /model-versions/** - Create new version

**Data Flow**:
- Models represent different tax-benefit systems
- Versions track engine updates
- Simulations use specific model versions

### 7. Datasets
**Purpose**: Manage underlying data sources
**API Integration**:
- **GET /datasets/** - List datasets
- **GET /datasets/{dataset_id}** - Get dataset details
- **POST /datasets/** - Upload new dataset
- **PATCH /datasets/{dataset_id}** - Update dataset
- **DELETE /datasets/{dataset_id}** - Remove dataset

**Data Flow**:
- Datasets provide population and economic data
- Used as input for simulations
- Support versioning for reproducibility

### 8. Baseline Values
**Purpose**: Define baseline scenarios
**API Integration**:
- **GET /baseline-parameter-values/** - Get baseline parameters
- **POST /baseline-parameter-values/** - Set baseline values
- **GET /baseline-variables/** - Get baseline variables
- **POST /baseline-variables/** - Set baseline variables

**Data Flow**:
- Baselines represent current law/status quo
- Reforms compared against baselines
- Calculate differences for impact analysis

### 9. Dynamics
**Purpose**: Model time-varying behaviors
**API Integration**:
- **GET /dynamics/** - List dynamic configurations
- **GET /dynamics/{dynamic_id}** - Get specific dynamics
- **POST /dynamics/** - Create dynamics configuration
- **PATCH /dynamics/{dynamic_id}** - Update dynamics
- **DELETE /dynamics/{dynamic_id}** - Remove dynamics

**Data Flow**:
- Define how parameters change over time
- Support behavioral responses
- Enable multi-year projections

## Implementation Strategy

### Phase 1: Core Infrastructure
1. Update BASE_URL to localhost:8000
2. Create new API client service with proper error handling
3. Add environment variable support for API URL
4. Implement authentication headers if required

### Phase 2: Data Services
1. Replace existing API calls with new endpoint structure
2. Update type definitions to match API responses
3. Implement data transformation layers where needed
4. Add proper loading and error states

### Phase 3: State Management
1. Update Redux actions to use new API
2. Modify reducers for new data structures
3. Implement caching strategy
4. Add optimistic updates for better UX

### Phase 4: Feature Integration
1. **Policies**: Full CRUD operations
2. **Simulations**: Creation and execution
3. **Reports**: Generate from simulation data
4. **Parameters**: Dynamic form generation

### Phase 5: Advanced Features
1. Batch operations support
2. WebSocket for real-time updates
3. Offline mode with sync
4. Export/import functionality

## Key Considerations

### Data Mapping
- Current app uses nested objects, API uses flat structures
- Need transformation layer between API and UI
- Maintain backward compatibility during transition

### Error Handling
- Implement retry logic for failed requests
- User-friendly error messages
- Fallback to cached data when possible

### Performance
- Implement pagination for list endpoints
- Cache frequently accessed data
- Use optimistic updates for better UX
- Consider implementing GraphQL layer

### Security
- Add authentication token management
- Implement request signing if required
- Sanitize all user inputs
- Handle CORS properly

### Testing
- Unit tests for API services
- Integration tests for data flows
- E2E tests for critical paths
- Mock API for development

## Migration Checklist

- [ ] Update BASE_URL constant
- [ ] Create API client service
- [ ] Update type definitions
- [ ] Migrate policy endpoints
- [ ] Migrate simulation endpoints
- [ ] Migrate parameter endpoints
- [ ] Implement report generation
- [ ] Update Redux integration
- [ ] Add error handling
- [ ] Implement caching
- [ ] Add loading states
- [ ] Test all endpoints
- [ ] Document API usage
- [ ] Deploy changes

## Notes
- Association services (user-policy, user-simulation, etc.) may need to be implemented server-side or managed client-side
- Consider using React Query for better caching and synchronization
- May need to implement polling for long-running simulations
- WebSocket support would improve real-time updates