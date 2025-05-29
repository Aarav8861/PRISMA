# main.py
import os
import json
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from langgraph.checkpoint.memory import InMemorySaver
from main import PrismaState, ingest_agent, solvency_calc_agent, analysis_agent, report_gen_agent, suggested_questions_agent, chatbot_agent # Import your agents
from langgraph.graph import StateGraph

app = FastAPI()

# Allow frontend access (adjust as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- GLOBAL STATE ----------
shared_state = PrismaState()  # Shared mutable state (not thread-safe)
checkpointer = InMemorySaver()
# ---------- BUILD FLOW 2 GRAPH ----------
builder_flow2 = StateGraph(PrismaState)
builder_flow2.add_node("report", report_gen_agent)
builder_flow2.set_entry_point("report")
graph_flow2 = builder_flow2.compile()

# ---------- API ENDPOINTS ----------

@app.get("/run-analysis-stream")
def run_analysis_stream():
    def event_generator():
        global shared_state

        # 1) Ingest
        try:
            shared_state = ingest_agent(shared_state)
        except Exception as e:
            yield f"event: error\ndata: Ingest failed: {e}\n\n"
            return

        # 2) Solvency calc
        try:
            shared_state = solvency_calc_agent(shared_state)
            data = json.dumps({'solvency_scale': shared_state.solvency_scale})
            time.sleep(2)
            yield f"data: {data}\n\n"
        except Exception as e:
            yield f"event: error\ndata: Solvency calc failed: {e}\n\n"
            return

        # 3) Analysis summary
        try:
            yield f"data: {json.dumps({'message': 'generating the analysis summary, please wait...'})}\n\n"
            shared_state = analysis_agent(shared_state)
            yield f"data: {json.dumps({'analysis_summary': shared_state.response})}\n\n"
            time.sleep(2)
        except Exception as e:
            yield f"event: error\ndata: Analysis failed: {e}\n\n"
            return

        # 4) Suggested questions
        try:
            shared_state = suggested_questions_agent(shared_state)
            yield f"data: {json.dumps({'suggested_questions': shared_state.suggestions})}\n\n"
            time.sleep(2)
        except Exception as e:
            yield f"event: error\ndata: Suggestions failed: {e}\n\n"
            return

        # 5) Graph paths (last chunk)
        try:
            yield f"data: {json.dumps({'graph_paths': shared_state.graph_paths})}\n\n"
            time.sleep(2)
            yield f"event: close\ndata: Closing stream\n\n"
        except Exception as e:
            yield f"event: error\ndata: Graph paths failed: {e}\n\n"
            return
    headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    }
    return StreamingResponse(event_generator(), media_type="text/event-stream", headers=headers)

@app.post("/generate-report")
def generate_report():
    global shared_state
    shared_state = graph_flow2.invoke(shared_state)
    report_path = shared_state.get("report_path")

    if not report_path or not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Report not found")

    filename = os.path.basename(report_path)
    print(report_path)
    print(filename)
    return FileResponse(
        path=report_path,
        filename=filename,
        media_type="application/pdf"
    )

@app.get("/stream-response")
def stream_response(prompt: str): 
    global checkpointer
    return StreamingResponse(chatbot_agent(prompt, checkpointer), media_type="text/plain")