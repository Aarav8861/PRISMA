# main.py
from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from langgraph.checkpoint.memory import InMemorySaver
from typing import List
import os


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
# ---------- BUILD FLOW 1 GRAPH ----------
builder_flow1 = StateGraph(PrismaState)
builder_flow1.add_node("ingest", ingest_agent)
builder_flow1.add_node("calc", solvency_calc_agent)
builder_flow1.add_node("analyze", analysis_agent)
builder_flow1.add_node("suggested_questions", suggested_questions_agent)
builder_flow1.set_entry_point("ingest")
builder_flow1.add_edge("ingest", "calc")
builder_flow1.add_edge("calc", "analyze")
builder_flow1.add_edge("analyze", "suggested_questions")
graph_flow1 = builder_flow1.compile()

# ---------- BUILD FLOW 2 GRAPH ----------
builder_flow2 = StateGraph(PrismaState)
builder_flow2.add_node("report", report_gen_agent)
builder_flow2.set_entry_point("report")
graph_flow2 = builder_flow2.compile()

# ---------- API ENDPOINTS ----------

@app.post("/run-analysis")
def run_analysis():
    global shared_state
    shared_state = graph_flow1.invoke(shared_state)
    return {
        "solvency_scale": shared_state.get("solvency_scale"),
        "analysis_summary": shared_state.get("response"),
        "suggested_questions":shared_state.get("suggestions"),
        "graph_paths": shared_state.get("graph_paths")
    }

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

# @app.get("/suggested-questions", response_model=List[str])
# def get_suggested_questions():
#     global shared_state
#     ai_response = shared_state.get("response")
#     return generate_suggested_questions(ai_response)

@app.get("/stream-response")
def stream_response(prompt: str): 
    global shared_state
    global checkpointer
    return StreamingResponse(chatbot_agent(shared_state, prompt, checkpointer), media_type="text/plain")