# !pip install --upgrade pip
# !pip install fpdf pandas openpyxl ollama torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
# !pip install transformers sentencepiece accelerate ipywidgets langchain-ollama langgraph
import os
import re
from typing import List
from pydantic import BaseModel, ConfigDict, Field
import pandas as pd
from fpdf import FPDF
import ollama
from langgraph.graph import StateGraph
from langgraph.graph.message import add_messages
import matplotlib.pyplot as plt
from pathlib import Path
from datetime import datetime

# Configuration
BASE_PATH = "C:\\Users\\Atharva\\Documents\\reimagine"
DATA_PATH = f"{BASE_PATH}\\synthetic_bank_data_with_transitions.xlsx"
REPORT_PATH = f"{BASE_PATH}\\reports\\report"
MODEL_NAME = 'deepseek-r1'

solvency_label = {
    1: "Solvent",
    2: "Good",
    3: "Fair",
    4: "At Risk",
    5: "Insolvent"
}

class PrismaState(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    step: str = "ingest"
    data_path: str = DATA_PATH
    curr: dict = {}
    hist: pd.DataFrame = Field(default_factory=pd.DataFrame, exclude=True)
    trends: dict = {}
    metrics: dict = {}
    anomalies: List[str] = []
    report_path: str = ""
    suggestions: List[str] = []
    chat_history: List[str] = []
    user_question: str = ""
    response: str = "The given bank is solvent"
    solvency_scale: str = ""
    df: pd.DataFrame = Field(default_factory=pd.DataFrame, exclude=True)
    graph_paths: dict[str, str] = {}
    
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
def ingest_agent(state: PrismaState):
    if not os.path.exists(state.data_path):
        raise FileNotFoundError(f"Data file not found at {state.data_path}")
    
    state.df = pd.read_excel(state.data_path) if state.data_path.endswith(".xlsx") else pd.read_csv(state.data_path)
    state.df = state.df.rename(columns={
        "Tier 1 Capital Ratio": "Tier1_capital_ratio",
        "Total Capital Ratio": "Total_capital_ratio",
        "CET1 Ratio": "CET1_ratio",
        "Leverage Ratio": "leverage_ratio",
        "RoE": "ROE",
        "RoA": "ROA",
        "NIM": "NIM",
        "Loan-to-Deposit Ratio": "L_to_D_ratio",
        "NSFR": "NSFR",
        "NPL Ratio": "NPL_ratio",
        "Coverage Ratio": "Coverage_ratio",
        "Sovereign Ratio": "Sovereign_exposure"})
    state.hist = state.df.iloc[:-1].reset_index(drop=True)
    state.curr = state.df.iloc[-1].to_dict()
    state.step = "calc"
    print("Current Metrics:", state.curr)
    return state

def sanitize(s: str) -> str:
    replacements = {
        "–": "-", # en dash
        "—": "-", # em dash
        "“": '"', "”": '"', # quotes
        "‘": "'", "’": "'", # apostrophes
        "…": "...", # ellipsis
        "≥": ">=", # greater than or equal to
        "≤": "<=", # less than or equal to
        "×": "x", # multiplication symbol
        "•": "-", # bullet
    }
    for orig, repl in replacements.items():
        s = s.replace(orig, repl)
    return s

def getLLMResponse(prompt, model):
    response = ollama.chat(model=model, messages=[{'role': 'user', 'content': prompt}])
    return sanitize(re.sub(r"<think>.*?</think>", "", response['message']['content'] or "", flags=re.DOTALL).strip())

def solvency_calc_agent(state: PrismaState, model: str = MODEL_NAME):
    prompt = (
        f"Current metrics: {state.curr}\n\n"
        "You are a financial AI agent tasked with assessing the solvency of banks based on their current financial and operational metrics."
        "Given the following data for a bank, analyse and predict whether the bank is:\n"
        "1. Solvent\n2. Good\n3. Fair\n4. At Risk\n5. Insolvent\n\n"
        "Strictly Return only one integer, which must be a number from 1 to 5. No explanation needed. No extra text just the fucking integer"
    )
    state.solvency_scale = getLLMResponse(prompt, model)
    print("Solvency Scale Value:", state.solvency_scale)
    return state

def plot_column_vs_date(df, column_name,output_path, date_column='Date'):
    """
    Plots the specified column against the date column in the DataFrame.

    Parameters:
    - df (pd.DataFrame): The DataFrame containing the data.
    - column_name (str): The name of the column to plot on the y-axis.
    - date_column (str): The name of the column to use for the x-axis (default is 'date').

    Returns:
    - None
    """
    if column_name not in df.columns:
        raise ValueError(f"Column '{column_name}' not found in DataFrame.")
    if date_column not in df.columns:
        raise ValueError(f"Date column '{date_column}' not found in DataFrame.")

    if not pd.api.types.is_datetime64_any_dtype(df[date_column]):
        df[date_column] = pd.to_datetime(df[date_column])

    df_sorted = df.sort_values(by=date_column)

    plt.figure(figsize=(12, 6))
    plt.plot(df_sorted[date_column], df_sorted[column_name], marker='o', linestyle='-')
    plt.title(f'{column_name} Over Time')
    plt.xlabel('Date')
    plt.ylabel(column_name)
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    
def analysis_agent(state: PrismaState, model: str = MODEL_NAME):
    prompt = (
        f"Historical metrics: {state.hist}\n"
        f"Current metrics: {state.curr}\n\n"
        "You are a financial AI agent tasked with assessing the solvency of banks based on their current financial and operational metrics. "
        f"The solvency calculated using current metrics is {solvency_label[int(state.solvency_scale)]}. "
        "Explain your reasoning using the most current metrics, historical metrics and suggest actions the bank could take to improve solvency."
    )
    # state.response = getLLMResponse(prompt, model)
    print("AI Response:", state.response)
    columns_to_plot = [
    "Tier1_capital_ratio",
    "Total_capital_ratio",
    "CET1_ratio",
    "leverage_ratio",
    "ROE",
    "ROA",
    "NIM",
    "L_to_D_ratio",
    "NSFR",
    "NPL_ratio",
    "Coverage_ratio",
    "Sovereign_exposure"
    ]
    
    for col in columns_to_plot:
        graph_path = f"{BASE_PATH}\\graphs\\{col}.png"
        plot_column_vs_date(state.df, col, graph_path)
        state.graph_paths[col] = graph_path
    return state

def suggested_questions_agent(state: PrismaState, model: str = MODEL_NAME):
    prompt = (
        f"Based on the following response, suggest one short, unique and relevant follow-up question.\n\n"
        f"Response: {state.response}\n\n"
    )
    
    questions = []

    for i in range(3):
        question = getLLMResponse(prompt, model).strip()
        questions.append(question)
        if i == 0:
            prompt += "Do not repeat any of the following questions:\n"
        prompt += f"{i + 1}. {question}\n"
        print(prompt)
    state.suggestions = questions
    return state

def report_gen_agent(state: PrismaState, report_path: str = REPORT_PATH):
    raw_date = state.curr.get("Date")
    pred_date = raw_date.strftime("%Y-%m-%d %H:%M:%S") if hasattr(raw_date, "strftime") else str(raw_date)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=14)
    pdf.cell(0, 10, "Solvency Prediction Report", ln=True, align="C")

    pdf.set_font("Arial", size=12)
    pdf.cell(0, 8, f"Prediction Date: {pred_date}", ln=True)
    pdf.ln(2)
    pdf.cell(0, 8, "Metrics used for prediction:", ln=True)

    for key, val in state.curr.items():
        if key == "Date":
            continue
        pdf.cell(0, 6, f"{key}: {val}", ln=True)
    pdf.ln(4)

    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 8, "AI Summary:", ln=True)
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 6, state.response)

    for i, (col, graph_path) in enumerate(state.graph_paths.items()):
        if Path(graph_path).exists():
            try:
                pdf.add_page()
                if i == 0:
                    pdf.set_font("Arial", 'B', 12)
                    pdf.cell(0, 10, "Metric Trends:", ln=True)
                    pdf.ln(5)

                print(graph_path)
                pdf.set_font("Arial", 'B', 10)
                pdf.cell(0, 10, f"{col}", ln=True)  # Title above image
                pdf.image(graph_path, x=20, y=30, w=180)
                pdf.ln(90)  # Add spacing after image
            except RuntimeError as e:
                print(f"Error embedding image {graph_path}: {e}")
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    report_path = f"{report_path}_{timestamp}.pdf"
    pdf.output(report_path)
    state.report_path = report_path
    state.step = "chat" #TODO: Check and Remove if not necessary
    print(f"Report saved to: {report_path}")
    return state

def chatbot_agent(prompt: str, model: str = MODEL_NAME):
    # Stream the response from Ollama model
    response = ollama.chat(
        model=model,
        messages=[{'role': 'user', 'content': prompt}],
        stream=True
    )
    for chunk in response:
        if 'message' in chunk and 'content' in chunk['message']:
            yield chunk['message']['content']