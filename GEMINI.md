# CognitiveCanvas: A GraphRAG-Powered Interactive Workspace for Reusable AI Conversational Memories

This project is an advanced implementation and significant expansion of the concepts presented in the research paper **"Memolet: Reifying the Reuse of User-AI Conversational Memories"**. It transforms fragmented, isolated conversational histories into interactive, manipulable objects (Memory Nodes) that users can search, organize, verify, and curate to guide AI response generation.

## 🎯 Project Vision
To move beyond static, black-box chat logs and empower users with granular, visual control over their AI's memory. CognitiveCanvas shifts the paradigm from ephemeral chatbots to persistent, user-driven cognitive workspaces by introducing **GraphRAG**, **Trust & Verification layers**, **Temporal Auditing**, and **Real-Time Context Suggestion**.

## 🏗️ Architecture

### Backend: FastAPI & Hybrid Data Store
- **API Framework:** FastAPI for high-performance asynchronous endpoints.
- **Relational DB:** PostgreSQL (via SQLAlchemy) for storing Users, Conversations, and Chat Messages.
- **Graph DB:** Neo4j for **GraphRAG**, mapping memories to a knowledge graph of concepts for contextual retrieval.
- **Vector Search:** `pgvector` for semantic similarity matching.
- **Cache/Broker:** Redis for background task queueing (Celery) and session management.
- **LLM Routing:** LiteLLM for multi-model support (e.g., Gemini, Groq, Ollama).

### Frontend: Next.js & Interactive Canvas
- **Framework:** Next.js (TypeScript) with Tailwind CSS.
- **State Management:** Zustand for global application state and real-time syncing.
- **Sandbox Canvas:** React Flow (`@xyflow/react`) for the interactive workspace where memories are visualized as nodes.
- **Authentication:** JWT-based auth.

## 🚀 Key Features (Functional Requirements)

### 1. Multi-Layer Memory Engine (GraphRAG)
Features a tiered architecture comprising a long-term knowledge graph in Neo4j for complex, semantic retrieval, and an instant memory workspace (Sandbox) where users can seamlessly import memory objects.
- **Subgraph Retrieval:** Fetches related concepts even if they lack direct keyword overlap.
- **Conceptual Interpolation:** Maps relationships between distant conversational memories.

### 2. Real-Time Memory Suggestion & Ranking 
As the user types a new prompt in the chat interface, the system performs a debounced background search against the knowledge graph. 
- **Dynamic Ranking:** Instantly surfaces and ranks highly relevant past memories based on the current context of the keystrokes.
- **One-Click Injection:** Allows users to immediately pull a suggested memory into their active prompt or the Sandbox.

### 3. Deprecated Memory Auditor
Automatically identifies and flags time-sensitive information (e.g., software versions, political figures) when memories are first saved. 
- **Temporal Checks:** If a user later tries to reuse a flagged memory, an LLM-as-a-judge automatically verifies the facts against current data, warning the user to prevent stale context (temporal hallucinations).

### 4. Cross-Platform Chat Importer
An asynchronous ingestion engine (powered by Celery and Jina Reader) that processes public sharing links from ChatGPT and Gemini, autonomously extracting, chunking, and converting past conversations into reusable memory objects.

### 5. Trust & Verification System
- **Confidence Heatmaps:** Visual indicators for every sentence in the AI response, showing how well it is supported by active memories.
- **Trace Citations:** Clickable inline references linking specific AI-generated claims back to the source nodes.
- **Conflict Evaluation:** Automated detection of contradictory information between merged memories.

### 6. Interactive Sensemaking Sandbox
A 2D visual UI canvas where users can drag, drop, and organize modular memory nodes.
- **Spatial Weighting:** Physical manipulation of nodes (resizing, repositioning) dynamically adjusts their contextual weight (priority) in the LLM's prompt.

### 7. Memory Reinforcement & Decay
- **Memory Decay:** Unused memory objects gradually lose priority over time, simulating human memory decay and preventing prompt bloat.
- **Dynamic Reinforcement:** Frequently accessed memories gain weight, keeping the most valuable insights at the forefront.

## 🛠️ Development Standards

### Backend (Python)
- **Dependency Management:** Use `uv` or `pip` with `pyproject.toml`.
- **Migrations:** Managed via Alembic (`backend/alembic`).
- **Coding Style:** Follow PEP 8; use type hints for all service methods.
- **Testing:** Pytest for unit and integration tests (`backend/tests`).

### Frontend (TypeScript/Next.js)
- **Component Design:** Modular components in `frontend/components`.
- **Styling:** Tailwind CSS for layout; Vanilla CSS for complex canvas nodes.
- **API Client:** Shared Axios/Fetch instance in `frontend/lib/api.ts`.

## 📂 Directory Structure Highlights
- `backend/app/services/`: Core logic for GraphRAG, Retrieval, Trust, Auditor, and Sandbox.
- `backend/app/models/`: SQLAlchemy models for PostgreSQL.
- `frontend/components/Canvas/`: React Flow implementation for the Sandbox.
- `frontend/store/`: Zustand stores for Auth, UI, and Node state.

## 📝 Roadmap & Future Work
- [x] Establish Architecture & Database schemas.
- [x] Integrate Universal Chat Link Importer (ChatGPT/Gemini).
- [ ] Implement Debounced Real-Time Suggestion Engine.
- [ ] Build React Flow Sensemaking Sandbox.
- [ ] Develop Temporal Auditor & Conflict Detection logic.
- [ ] Multi-user collaborative Sandboxes (Stretch Goal).