# Flow Management System

The flow management system is a series of code structures meant to handle multi-step user interfaces through Redux state management and component orchestration. The system uses **flows** (sequences of connected components) and **frames** (individual steps) for complex navigation patterns. One **flow** consists of one or more **frames**, and flows can nest within one another, allowing for complex routing. Flows and frames are both currently defined using title case.

## Core Components

**Reducer (`flowSlice`)**
- Manages navigation state: `currentFlow`, `currentFrame`, and `flowStack`
- Key actions: `setFlow`, `navigateToFrame`, `navigateToFlow`, `returnFromFlow`
- Flow stack enables nested flows by preserving calling flow state

**Registry System**
- `componentRegistry`: Maps `ComponentKey` strings to React components; `ComponentKey`s allow for serializable TypeScript-friendly referencing of components
- `flowRegistry`: Maps `FlowKey` strings to `Flow` objects; `FlowKey`s allow for serializable TypeScript-friendly referencing of flows 

**FlowContainer**
- Renders current frame's component from `componentRegistry`
- Provides `onNavigate`, `onReturn`, and `flowConfig` props to components; these must be passed to components as explicit props to enable navigation
- Handles navigation logic and component resolution

## Flow Structure

**Flow Definition (`Flow` type)**
- `initialFrame`: Entry point (`ComponentKey | FlowKey | null`)
- `frames`: Record mapping frame names to `FlowFrame` objects

**Frame Configuration (`FlowFrame` type)**
- `component`: `ComponentKey` specifying which component to render
- `on`: `EventList` mapping event names to navigation targets
- Targets can be: `ComponentKey` (same flow), `FlowKey` (subflow), or `"__return__"` (exit flow)

## Adding New Components

**1. Create Component with Required Props**
```typescript
export default function MyComponent({ onNavigate, onReturn, flowConfig }: FlowComponentProps) {
  const handleNext = () => onNavigate('next');
  const handleBack = () => onNavigate('back');

  const returnFromFlow = () => onReturn();

  // flowConfig is used to access flow configuration within component
  
  return (
    <div>
      <Button onClick={handleNext}>Next</Button>
      <Button onClick={handleBack}>Back</Button>
    </div>
  );
}
```

**2. Register Component**
```typescript
// In registry.ts
export const componentRegistry = {
  "MyComponent": MyComponent,
  // ... other components
} as const;
```

**3. Use in Flow Definition**
```typescript
const MyFlow: Flow = {
  initialFrame: "MyComponent",
  frames: {
    MyComponent: {
      component: "MyComponent",
      on: {
        "next": "AnotherComponent",
        "back": "__return__"
      }
    }
  }
};
```

## Adding New Flows

**1. Define Flow Structure**
```typescript
export const MyNewFlow: Flow = {
  initialFrame: "StartComponent",
  frames: {
    StartComponent: {
      component: "StartComponent",
      on: {
        "next": "MiddleComponent",
        "skip": "EndComponent"
      }
    },
    MiddleComponent: {
      component: "MiddleComponent", 
      on: {
        "next": "EndComponent",
        "back": "StartComponent",
        "subflow": "AnotherFlow"  // Navigate to subflow
      }
    },
    EndComponent: {
      component: "EndComponent",
      on: {
        "finish": "__return__"
      }
    }
  }
};
```

**2. Register Flow**
```typescript
// In registry.ts
export const flowRegistry = {
  "MyNewFlow": MyNewFlow,
  // ... other flows
} as const;
```

**3. Trigger Flow**
```typescript
// In any component
const dispatch = useDispatch();
dispatch(setFlow(MyNewFlow));
```

## Navigation and Events

**Action Dispatching**
- Components call `onNavigate(eventName)` to trigger navigation
- `eventName` must match keys in the frame's `on` configuration
- FlowContainer resolves targets and dispatches appropriate Redux actions

**Special Navigation**
- `"__return__"`: Exit current flow (pops from `flowStack`)
- `FlowKey` targets: Enter subflow (pushes current state to stack)
- `ComponentKey` targets: Navigate within current flow