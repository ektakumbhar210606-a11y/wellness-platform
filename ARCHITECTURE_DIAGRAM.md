# Architecture Overview - Therapist Monthly Cancellation Reset System

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Scheduled Job Execution"
        A[Cron Schedule<br/>0 0 1 * *] --> B[Job Manager<br/>resetTherapistCancellationCountersJob.ts]
        B --> C[Main Scheduler<br/>index.ts]
    end
    
    subgraph "Core Logic Layer"
        C --> D[Reset Function<br/>resetTherapistMonthlyCancellationCounters.ts]
        D --> E[Database Connection<br/>connectToDatabase]
        D --> F[Find Therapists<br/>with non-zero counters]
        F --> G[Reset Counters<br/>Update each therapist]
        G --> H[Log Results<br/>Detailed output]
        H --> I[Disconnect DB<br/>disconnectFromDatabase]
    end
    
    subgraph "Access Methods"
        J[Method 1:<br/>Integrated Cron] --> C
        K[Method 2:<br/>External Cron Service] --> L[API Endpoint<br/>route.ts]
        L --> D
        M[Method 3:<br/>Manual Script<br/>CLI] --> D
    end
    
    subgraph "Data Layer"
        N[(MongoDB Database)]
        G -.-> N
        F -.-> N
    end
    
    subgraph "Monitoring & Security"
        O[Logging & Console Output]
        P[Authorization Check<br/>x-background-task-secret]
        Q[Status Monitoring<br/>getAllScheduledJobsStatus]
        
        L -.-> O
        D -.-> O
        L -.-> P
        C -.-> Q
    end
```

## Component Interaction Flow

### Monthly Execution Flow

```mermaid
sequenceDiagram
    participant Cron as Cron Scheduler
    participant Job as Job Manager
    participant API as API Endpoint
    participant Reset as Reset Function
    participant DB as MongoDB Database
    
    Cron->>Job: Trigger at 0 0 1 * *
    Job->>Reset: Execute reset
    Reset->>DB: Connect to database
    Reset->>DB: Find therapists with non-zero counters
    DB-->>Reset: Return therapist list
    
    loop For each therapist
        Reset->>DB: Update monthlyCancelCount = 0
        Reset->>DB: Update cancelWarnings = 0
        Reset->>DB: Update bonusPenaltyPercentage = 0
        Note over DB,Reset: totalCancelCount preserved
    end
    
    Reset->>Job: Return results
    Job->>Job: Log execution details
    Reset->>DB: Disconnect from database
```

### API Request Flow (External Cron Service)

```mermaid
sequenceDiagram
    participant External as External Cron Service
    participant API as API Endpoint
    participant Auth as Authorization Check
    participant Reset as Reset Function
    participant DB as MongoDB Database
    
    External->>API: POST /api/background/tasks/reset-therapist-cancellation-counters
    Note over External,API: Headers: x-background-task-secret
    
    API->>Auth: Validate secret
    alt Secret Valid or Not Configured
        Auth-->>API: Authorized
        API->>Reset: Call reset function
        Reset->>DB: Connect and execute reset
        Reset-->>API: Return results
        API-->>External: JSON Response with results
    else Secret Invalid
        Auth-->>API: Unauthorized
        API-->>External: 401 Unauthorized
    end
```

### Manual Execution Flow

```mermaid
sequenceDiagram
    participant User as Developer/Admin
    participant Script as CLI Script
    participant Reset as Reset Function
    participant DB as MongoDB Database
    
    User->>Script: Run: npx ts-node scripts/resetTherapistMonthlyCancellationCounters.ts
    Script->>Reset: Call reset function
    Reset->>DB: Connect and execute reset
    Reset-->>Script: Return results
    Script->>Script: Display console output
    Script-->>User: Show summary and details
```

## Deployment Architecture Options

### Option A: Integrated Cron (Traditional Server)

```mermaid
graph LR
    subgraph "Next.js Application Server"
        A[Next.js App<br/>layout.tsx] --> B[Job Manager<br/>initializeAllScheduledJobs]
        B --> C[Cron Job<br/>Running in background]
        C --> D[Reset Function]
        D --> E[(MongoDB)]
    end
    
    F[Server Process] -.-> A
```

**Best for:** VPS, EC2, Docker containers, dedicated servers

---

### Option B: External Cron Service (Serverless)

```mermaid
graph LR
    A[External Cron Service<br/>cron-job.org etc] -->|HTTP POST| B[Next.js API Route]
    B --> C[Reset Function]
    C --> D[(MongoDB)]
    
    E[Vercel/Netlify<br/>Serverless Platform] -.-> B
```

**Best for:** Vercel, Netlify, serverless functions

---

### Option C: Hybrid Approach

```mermaid
graph TB
    subgraph "Development Environment"
        A[Manual Script] --> D[Reset Function]
        B[API Testing] --> D
    end
    
    subgraph "Production - Traditional Server"
        C[Integrated Cron Job] --> E[Job Manager]
        E --> D
    end
    
    subgraph "Production - Serverless"
        F[External Cron Service] --> G[API Endpoint]
        G --> D
    end
    
    D --> H[(MongoDB)]
```

---

## Data Flow Diagram

### Reset Operation Data Flow

```mermaid
graph LR
    A[Therapist Collection] --> B{Has non-zero<br/>counters?}
    B -->|Yes| C[Read Current Values]
    B -->|No| D[Skip Therapist]
    
    C --> E[Store Previous Values<br/>for logging]
    E --> F[Update monthlyCancelCount = 0]
    F --> G[Update cancelWarnings = 0]
    G --> H[Update bonusPenaltyPercentage = 0]
    H --> I[Preserve totalCancelCount]
    I --> J[Log Reset Details]
    
    D --> K[Next Therapist]
    J --> K
```

---

## State Transition Diagram

### Therapist Counter States

```mermaid
stateDiagram-v2
    [*] --> ActiveMonth: Month starts
    ActiveMonth --> CancellationsOccur: Therapist cancels
    CancellationsOccur --> WarningsIssued: Cancel count > threshold
    WarningsIssued --> PenaltyApplied: Warnings > threshold
    PenaltyApplied --> MonthEnd: Month ends
    
    MonthEnd --> ResetTriggered: 1st of next month
    ResetTriggered --> ActiveMonth: Counters reset to 0
    
    note right of ResetTriggered
        monthlyCancelCount = 0
        cancelWarnings = 0
        bonusPenaltyPercentage = 0
        totalCancelCount unchanged
    end note
```

---

## Error Handling Flow

```mermaid
graph TD
    A[Start Reset Job] --> B{Database<br/>Connected?}
    B -->|No| C[Log Error]
    C --> D[Throw Exception]
    D --> Z[End - Failed]
    
    B -->|Yes| E[Find Therapists]
    E --> F{Therapists<br/>Found?}
    
    F -->|No| G[Log: No action needed]
    G --> H[Disconnect DB]
    H --> Y[End - Success]
    
    F -->|Yes| I[Process Each Therapist]
    
    I --> J{Update<br/>Successful?}
    J -->|Yes| K[Log Success]
    J -->|No| L[Log Error]
    L --> M{Continue Processing?}
    M -->|Yes| I
    M -->|No| N[Stop Processing]
    N --> O[Disconnect DB]
    O --> X[End - Partial Success]
    
    K --> P{More Therapists?}
    P -->|Yes| I
    P -->|No| Q[Complete Summary]
    Q --> H
```

---

## Security Model

### API Authorization Flow

```mermaid
graph TD
    A[Incoming Request] --> B{x-background-task-secret<br/>header present?}
    B -->|No| C{SECRET<br/>configured?}
    C -->|Yes| D[Return 401 Unauthorized]
    C -->|No| E[Proceed without auth]
    
    B -->|Yes| F{Secret matches<br/>env variable?}
    F -->|Yes| E
    F -->|No| D
    
    E --> G[Execute Reset Function]
    D --> H[Return Error Response]
    
    G --> I[Return Success Response]
```

---

## Monitoring & Observability

### Logging Levels

```mermaid
graph LR
    subgraph "Log Types"
        A[INFO Logs<br/>Job started/stopped]
        B[DEBUG Logs<br/>Individual therapist processing]
        C[SUMMARY Logs<br/>Reset statistics]
        D[ERROR Logs<br/>Failures and exceptions]
    end
    
    A --> E[Console Output]
    B --> E
    C --> E
    D --> E
    
    E --> F[Log Aggregation System<br/>Optional]
```

### Metrics to Monitor

```mermaid
graph TD
    A[Monthly Reset Job] --> B[Execution Metrics]
    A --> C[Business Metrics]
    
    subgraph B
        B1[Job Started]
        B2[Job Completed]
        B3[Execution Duration]
        B4[Error Rate]
        B5[Next Scheduled Run]
    end
    
    subgraph C
        C1[Therapists Processed]
        C2[Counters Reset]
        C3[Average Cancel Count]
        C4[Warning Trends]
    end
    
    B --> D[Monitoring Dashboard<br/>Optional]
    C --> D
```

---

## File Structure

```
wellness-app/
├── utils/
│   ├── resetTherapistMonthlyCancellationCounters.ts    # Core reset logic
│   └── scheduledJobs/
│       ├── index.ts                                     # Main job manager
│       └── resetTherapistCancellationCountersJob.ts    # Specific job
├── app/
│   └── api/
│       └── background/
│           └── tasks/
│               └── reset-therapist-cancellation-counters/
│                   └── route.ts                         # API endpoint
├── scripts/
│   ├── resetTherapistMonthlyCancellationCounters.ts    # Manual script
│   └── test-resetTherapistCancellation.ts              # Test suite
├── package.json                                         # Dependencies
└── .env.local                                           # Environment vars
```

---

## Timeline View

### Monthly Execution Timeline

```mermaid
gantt
    title Monthly Cancellation Counter Reset Timeline
    dateFormat  YYYY-MM-DD
    section Month 1
    Normal Operations      :2024-03-01, 30d
    section Month 2
    Reset Execution        :crit, 2024-04-01, 1h
    Normal Operations      :2024-04-01, 29d
    section Month 3
    Reset Execution        :crit, 2024-05-01, 1h
    Normal Operations      :2024-05-01, 30d
```

### Job Execution Timeline (Detailed)

```mermaid
gantt
    title Single Reset Job Execution (Not to Scale)
    dateFormat  X
    axisFormat %s
    
    section Setup
    Initialize Job        :0, 1
    Connect to DB         :1, 2
    
    section Processing
    Find Therapists       :2, 5
    Process Therapist 1   :5, 10
    Process Therapist 2   :10, 15
    Process Therapist N   :15, 20
    
    section Cleanup
    Generate Summary      :20, 22
    Disconnect DB         :22, 23
    Log Results           :23, 25
```

---

## Decision Points

### Implementation Choices Made

```mermaid
graph TD
    A[Requirement:<br/>Monthly Reset] --> B{Implementation<br/>Approach?}
    
    B --> C[Node.js Cron Library]
    B --> D[System Cron Job]
    B --> E[Cloud Scheduler]
    
    C --> F{Which Library?}
    F --> G[node-cron ✓]
    F --> H[node-schedule]
    F --> I[cron]
    
    G --> J{Deployment<br/>Strategy?}
    J --> K[Integrated in App ✓]
    J --> L[External Service]
    
    K --> M[Traditional Server ✓]
    L --> N[Serverless Platform ✓]
    
    style G fill:#90EE90
    style K fill:#90EE90
    style M fill:#90EE90
    style N fill:#90EE90
```

---

## Summary

This architecture provides:

✅ **Flexibility**: Multiple deployment options  
✅ **Reliability**: Error handling and isolation  
✅ **Observability**: Comprehensive logging  
✅ **Security**: Optional authorization  
✅ **Maintainability**: Clean separation of concerns  
✅ **Scalability**: Can handle any number of therapists  

Choose the deployment option that best fits your infrastructure!
